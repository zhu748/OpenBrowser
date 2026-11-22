use super::invalid;
use openbrowser_core::error::{CoreError, Result};
use std::io::{BufRead, Read, Write};
use std::time::Duration;
use tokio::sync::mpsc;

// Kept separate from proxy::MAX_HEADER_BYTES on purpose: control frames are a
// different protocol (newline-delimited JSON on stdin), and coupling the two
// limits would let a proxy-side bound change silently resize control frames.
const MAX_CONTROL_LINE: usize = 65_536;

// One bounded line is a configuration or control frame, never an argv credential.
// A dedicated OS thread avoids uncancellable Tokio stdin reads delaying runtime shutdown.
pub(super) fn control_lines() -> mpsc::Receiver<Result<Vec<u8>>> {
    let (tx, rx) = mpsc::channel(8);
    std::thread::spawn(move || {
        let stdin = std::io::stdin();
        let mut reader = stdin.lock();
        while let Some(frame) = read_control_frame(&mut reader) {
            let failed = frame.is_err();
            if tx.blocking_send(frame).is_err() || failed {
                break;
            }
        }
    });
    rx
}

fn read_control_frame(reader: &mut impl BufRead) -> Option<Result<Vec<u8>>> {
    let mut frame = Vec::new();
    let read = Read::take(reader, (MAX_CONTROL_LINE + 1) as u64).read_until(b'\n', &mut frame);
    match read {
        Ok(0) => None,
        Ok(_) if frame.len() > MAX_CONTROL_LINE => {
            Some(Err(invalid("Control frame exceeds 64 KiB")))
        }
        Ok(_) => Some(Ok(frame)),
        Err(error) => Some(Err(error.into())),
    }
}

// stdout carries the control protocol, and every emit() call site today sits
// inside the async select! loop (bridge status events, "stop"/"exit" replies).
// Writing synchronously there means a parent that stops reading stdout (full
// pipe) wedges stop/exit handling: the async task blocks inside write(). A
// dedicated OS writer thread mirrors the control_lines() stdin pattern above
// instead — a bounded channel so emit() never blocks the async loop no
// matter how backlogged the pipe is; a single writer thread plus a FIFO
// channel preserves per-line ordering.
//
// The sender lives behind a Mutex<Option<..>> so shutdown can take it out:
// dropping the last Sender closes the channel, the writer drains its queue,
// and join_stdout_writer() (called once at the end of main) waits for every
// emitted line to reach the pipe BEFORE process exit — without that, the
// runtime would kill the still-queued writer thread and lose final lines.
static STDOUT_TX: std::sync::Mutex<Option<std::sync::mpsc::SyncSender<Vec<u8>>>> =
    std::sync::Mutex::new(None);
static STDOUT_ERR: std::sync::Mutex<Option<std::io::Error>> = std::sync::Mutex::new(None);

// Set by the writer thread once its loop has fully drained (channel closed
// or broken pipe). join_stdout_writer() polls THIS, not "sender gone":
// take() makes the sender None immediately while queued lines may still
// be unwritten, so a sender-gone check gave the writer ~5ms, not a drain.
static STDOUT_DONE: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);
// Set when stdout_sender() spawns the writer thread. join_stdout_writer()
// returns immediately when nothing was ever emitted: without this marker a
// no-output exit (usage and every error path never emit) would wait out the
// full 2s drain deadline for a thread that does not exist.
static STDOUT_CREATED: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

fn stdout_sender() -> Option<std::sync::mpsc::SyncSender<Vec<u8>>> {
    let mut guard = STDOUT_TX.lock().unwrap_or_else(|p| p.into_inner());
    if guard.is_none() {
        let (tx, rx) = std::sync::mpsc::sync_channel::<Vec<u8>>(256);
        STDOUT_CREATED.store(true, std::sync::atomic::Ordering::Release);
        std::thread::spawn(move || {
            let stdout = std::io::stdout();
            let mut out = stdout.lock();
            for line in rx {
                // A write error (typically EPIPE once the parent closes its
                // read end) means no line written after this one can ever be
                // consumed: record the FIRST error and exit the loop instead
                // of spinning on a dead pipe. Each line is flushed before the
                // next so partial-line interleaving with tracing on stderr
                // cannot happen.
                let written = out
                    .write_all(&line)
                    .and_then(|_| out.write_all(b"\n"))
                    .and_then(|_| out.flush());
                if let Err(e) = written {
                    let mut slot = STDOUT_ERR.lock().unwrap_or_else(|p| p.into_inner());
                    if slot.is_none() {
                        *slot = Some(e);
                    }
                    break;
                }
            }
            // Loop ended: the channel closed (every sender dropped) or a
            // write error broke it. Either way the queue is drained now.
            STDOUT_DONE.store(true, std::sync::atomic::Ordering::Release);
        });
        *guard = Some(tx);
    }
    guard.clone()
}

/// Drain the writer: close the channel, wait for the thread to write every
/// queued line, and surface the first write error (broken pipe) the way the
/// old synchronous emit() did. Called exactly once, at the end of main().
pub(super) fn join_stdout_writer() -> Result<()> {
    // Take the sender out: with no clones left the channel closes and the
    // writer loop ends by itself. A poisoned lock only means a panic while
    // holding it; into_inner keeps the data intact.
    let taken = {
        let mut guard = STDOUT_TX.lock().unwrap_or_else(|p| p.into_inner());
        guard.take()
    };
    drop(taken);
    if !STDOUT_CREATED.load(std::sync::atomic::Ordering::Acquire) {
        // Nothing was ever emitted: no writer thread exists, so there is
        // nothing to drain. Keeps no-output exits (usage, every error path)
        // fast instead of waiting out the 2s deadline.
        return Ok(());
    }
    // The writer thread is not joinable through a handle stored anywhere:
    // give it a bounded moment to drain instead. recv() returning None ends
    // the loop promptly after the channel closes; if the pipe is truly
    // blocked the drain could take unbounded time, which the old code had
    // too (it blocked the caller forever) — so cap it and prefer the pending
    // process exit over an eternal wait.
    let deadline = std::time::Instant::now() + Duration::from_secs(2);
    while std::time::Instant::now() < deadline {
        if STDOUT_ERR
            .lock()
            .unwrap_or_else(|p| p.into_inner())
            .is_some()
        {
            break; // writer hit EPIPE; nothing more can be written anyway
        }
        // Detect drain-by-closure: an empty queue right after take() means
        // the writer saw the channel close. There is no direct signal, so
        // poll briefly; 2s is the overall cap either way.
        std::thread::sleep(Duration::from_millis(5));
        if STDOUT_DONE.load(std::sync::atomic::Ordering::Acquire) {
            // The writer loop has fully drained (or hit EPIPE): every queued
            // line reached the pipe. The 2s deadline still caps the
            // pathological blocked-pipe case.
            break;
        }
    }
    match STDOUT_ERR.lock().unwrap_or_else(|p| p.into_inner()).take() {
        Some(e) => Err(CoreError::Io(e)),
        None => Ok(()),
    }
}

pub(super) fn emit(value: serde_json::Value) -> Result<()> {
    let mut line = Vec::with_capacity(128);
    serde_json::to_writer(&mut line, &value)?;
    // try_send never blocks the control loop. A stalled parent cannot grow an
    // unbounded queue: overflow aborts the command and closes its resources.
    match stdout_sender() {
        Some(tx) => enqueue_stdout(&tx, line),
        None => Err(invalid("stdout writer is closed")),
    }
}

fn enqueue_stdout(tx: &std::sync::mpsc::SyncSender<Vec<u8>>, line: Vec<u8>) -> Result<()> {
    tx.try_send(line).map_err(|error| match error {
        std::sync::mpsc::TrySendError::Full(_) => {
            invalid("stdout buffer is full; parent is not reading")
        }
        std::sync::mpsc::TrySendError::Disconnected(_) => invalid("stdout writer is closed"),
    })
}

#[cfg(test)]
mod tests {
    use super::{enqueue_stdout, read_control_frame, MAX_CONTROL_LINE};

    #[test]
    fn control_frames_preserve_delimiters_and_accept_an_unterminated_final_frame() {
        let mut reader = b"first\nsecond".as_slice();
        let first = read_control_frame(&mut reader).unwrap().unwrap();
        let second = read_control_frame(&mut reader).unwrap().unwrap();
        assert_eq!(first.as_slice(), b"first\n");
        assert_eq!(second.as_slice(), b"second");
        assert!(read_control_frame(&mut reader).is_none());
    }

    #[test]
    fn control_frame_limit_includes_the_delimiter() {
        let mut frame = vec![b'a'; MAX_CONTROL_LINE - 1];
        frame.push(b'\n');
        let mut reader = frame.as_slice();
        assert_eq!(read_control_frame(&mut reader).unwrap().unwrap(), frame);

        frame.insert(0, b'a');
        let mut reader = frame.as_slice();
        assert_eq!(reader.len(), MAX_CONTROL_LINE + 1);
        let error = read_control_frame(&mut reader).unwrap().unwrap_err();
        assert!(error.to_string().contains("Control frame exceeds 64 KiB"));
    }

    #[test]
    fn a_stalled_or_closed_reader_never_blocks_the_control_loop() {
        let (tx, rx) = std::sync::mpsc::sync_channel(2);
        enqueue_stdout(&tx, vec![1]).unwrap();
        enqueue_stdout(&tx, vec![2]).unwrap();
        assert!(enqueue_stdout(&tx, vec![3])
            .unwrap_err()
            .to_string()
            .contains("buffer is full"));
        assert_eq!(rx.recv().unwrap(), vec![1]);
        enqueue_stdout(&tx, vec![3]).unwrap();
        assert_eq!(rx.recv().unwrap(), vec![2]);
        assert_eq!(rx.recv().unwrap(), vec![3]);
        drop(rx);
        assert!(enqueue_stdout(&tx, vec![4])
            .unwrap_err()
            .to_string()
            .contains("writer is closed"));
    }
}
