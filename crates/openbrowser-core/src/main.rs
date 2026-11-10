use openbrowser_core::error::{CoreError, Result};
use openbrowser_core::process::{FileLock, ProcessLock};
use openbrowser_core::proxy::{FailClosedPolicy, LocalProxyBridge, ProxyConfig, ProxyForwarder};
use openbrowser_core::sync::{ScreenBounds, TileGridLayout};
use openbrowser_core::tls::{ClientHelloBuilder, TlsProfile};
use serde_json::json;
use std::io::{BufRead, Read, Write};
use tokio::sync::mpsc;
use tokio::time::{timeout, Duration};

const CONTROL_PROTOCOL: u32 = 1;
// Kept separate from proxy::MAX_HEADER_BYTES on purpose: control frames are a
// different protocol (newline-delimited JSON on stdin), and coupling the two
// limits would let a proxy-side bound change silently resize control frames.
const MAX_CONTROL_LINE: usize = 65_536;

fn invalid(message: &str) -> CoreError {
    CoreError::InvalidConfig(message.to_owned())
}

// One bounded line is a configuration or control frame, never an argv credential.
// A dedicated OS thread avoids uncancellable Tokio stdin reads delaying runtime shutdown.
fn control_lines() -> mpsc::Receiver<Result<Vec<u8>>> {
    let (tx, rx) = mpsc::channel(8);
    std::thread::spawn(move || {
        let stdin = std::io::stdin();
        let mut reader = stdin.lock();
        loop {
            let mut frame = Vec::new();
            let read = (&mut reader)
                .take((MAX_CONTROL_LINE + 1) as u64)
                .read_until(b'\n', &mut frame);
            match read {
                Ok(0) => break,
                Ok(_) if frame.len() > MAX_CONTROL_LINE => {
                    let _ = tx.blocking_send(Err(invalid("Control frame exceeds 64 KiB")));
                    break;
                }
                Ok(_) => {
                    if tx.blocking_send(Ok(frame)).is_err() {
                        break;
                    }
                }
                Err(error) => {
                    let _ = tx.blocking_send(Err(error.into()));
                    break;
                }
            }
        }
    });
    rx
}

// stdout carries the control protocol, and every emit() call site today sits
// inside the async select! loop (bridge status events, "stop"/"exit" replies).
// Writing synchronously there means a parent that stops reading stdout (full
// pipe) wedges stop/exit handling: the async task blocks inside write(). A
// dedicated OS writer thread mirrors the control_lines() stdin pattern above
// instead — an unbounded channel so emit() NEVER blocks the async loop no
// matter how backlogged the pipe is; a single writer thread plus a FIFO
// channel preserves per-line ordering.
//
// The sender lives behind a Mutex<Option<..>> so shutdown can take it out:
// dropping the last Sender closes the channel, the writer drains its queue,
// and join_stdout_writer() (called once at the end of main) waits for every
// emitted line to reach the pipe BEFORE process exit — without that, the
// runtime would kill the still-queued writer thread and lose final lines.
static STDOUT_TX: std::sync::Mutex<Option<std::sync::mpsc::Sender<Vec<u8>>>> =
    std::sync::Mutex::new(None);
static STDOUT_ERR: std::sync::Mutex<Option<std::io::Error>> = std::sync::Mutex::new(None);

// Set by the writer thread once its loop has fully drained (channel closed
// or broken pipe). join_stdout_writer() polls THIS, not "sender gone":
// take() makes the sender None immediately while queued lines may still
// be unwritten, so a sender-gone check gave the writer ~5ms, not a drain.
static STDOUT_DONE: std::sync::atomic::AtomicBool =
    std::sync::atomic::AtomicBool::new(false);
// Set when stdout_sender() spawns the writer thread. join_stdout_writer()
// returns immediately when nothing was ever emitted: without this marker a
// no-output exit (usage and every error path never emit) would wait out the
// full 2s drain deadline for a thread that does not exist.
static STDOUT_CREATED: std::sync::atomic::AtomicBool =
    std::sync::atomic::AtomicBool::new(false);

fn stdout_sender() -> Option<std::sync::mpsc::Sender<Vec<u8>>> {
    let mut guard = STDOUT_TX.lock().unwrap_or_else(|p| p.into_inner());
    if guard.is_none() {
        let (tx, rx) = std::sync::mpsc::channel::<Vec<u8>>();
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
fn join_stdout_writer() -> Result<()> {
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

fn emit(value: serde_json::Value) -> Result<()> {
    let mut line = Vec::with_capacity(128);
    serde_json::to_writer(&mut line, &value)?;
    // send() on an unbounded channel never blocks; the only failure mode is
    // the writer having died on a stdout error, which join_stdout_writer()
    // reports at exit. An emit after shutdown is a caller bug: refuse it.
    match stdout_sender() {
        Some(tx) => tx
            .send(line)
            .map_err(|_| invalid("stdout writer is closed")),
        None => Err(invalid("stdout writer is closed")),
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing so bridge warnings / fail-closed errors are actually visible.
    // stdout carries the newline-delimited JSON control protocol, so logs go to stderr;
    // RUST_LOG (via env-filter) controls verbosity, defaulting to info.
    tracing_subscriber::fmt()
        .with_writer(std::io::stderr)
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();
    let args: Vec<String> = std::env::args().skip(1).collect();
    let (command, options) = args
        .split_first()
        .ok_or_else(|| invalid("Expected bridge, tls, lock, layout or version"))?;
    let result = match command.as_str() {
        "bridge" => run_bridge(options).await,
        "tls" => run_tls(options),
        "lock" => run_lock(options).await,
        "layout" => run_layout(options),
        "--version" | "-v" | "version" if options.is_empty() => emit(json!({
            "name": "openbrowser-core", "version": env!("CARGO_PKG_VERSION"),
            "control_protocol": CONTROL_PROTOCOL,
            "capabilities": ["http-upstream", "socks5-upstream", "layout-planner", "file-lock"]
        })),
        _ => Err(invalid("Unknown command or unexpected options")),
    };
    // Drain the stdout writer BEFORE returning: the emitted lines live in a
    // channel until this point, and process exit would otherwise kill the
    // writer thread with them still queued. The drain error (broken pipe)
    // only replaces the result if the command itself succeeded.
    let drained = join_stdout_writer();
    match (result, drained) {
        (Ok(()), Ok(())) => Ok(()),
        (Ok(()), Err(e)) => Err(e),
        (Err(e), _) => Err(e),
    }
}

async fn run_bridge(args: &[String]) -> Result<()> {
    if !args.is_empty() {
        return Err(invalid(
            "Bridge configuration must be supplied as one private stdin JSON line",
        ));
    }
    let mut lines = control_lines();
    let first = timeout(Duration::from_secs(10), lines.recv())
        .await?
        .ok_or_else(|| invalid("Missing bridge configuration"))??;
    let config: ProxyConfig = serde_json::from_slice(&first)?;
    let (status_tx, mut statuses) = mpsc::channel(32);
    let bridge =
        LocalProxyBridge::new(config, FailClosedPolicy::default()).with_status_sender(status_tx);
    let address = bridge.start().await?;
    if let Err(error) = emit(json!({
        "status": "listening", "control_protocol": CONTROL_PROTOCOL,
        "host": "127.0.0.1", "port": address.port(), "pid": std::process::id(),
        "chrome_url": format!("http://127.0.0.1:{}", address.port())
    })) {
        bridge.stop().await?;
        return Err(error);
    }
    let control_result = async {
        loop {
            tokio::select! {
                frame = lines.recv() => {
                    let Some(frame) = frame else { break };
                    let frame = frame?;
                    let command = std::str::from_utf8(&frame)
                        .map_err(|_| invalid("Control frame must be UTF-8"))?.trim();
                    if command == "stop" || command == "exit" { break; }
                    // Include a truncated preview so a protocol mismatch or a
                    // writer bug can be identified from the error alone.
                    let preview: String = command.chars().take(64).collect();
                    return Err(invalid(&format!(
                        "Unknown bridge control command: {:?}",
                        preview
                    )));
                }
                Some(code) = statuses.recv() => {
                    emit(json!({"event":"status", "code":code, "message":code}))?;
                }
            }
        }
        Ok(())
    }
    .await;
    bridge.stop().await?;
    control_result?;
    emit(json!({"status": "stopped"}))
}

fn option_pairs(args: &[String], allowed: &[&str]) -> Result<Vec<(String, String)>> {
    if !args.len().is_multiple_of(2) {
        return Err(invalid("Every option requires a value"));
    }
    let mut result = Vec::new();
    for pair in args.as_chunks::<2>().0 {
        if !allowed.contains(&pair[0].as_str()) || result.iter().any(|(key, _)| key == &pair[0]) {
            return Err(invalid("Unknown or duplicate option"));
        }
        result.push((pair[0].clone(), pair[1].clone()));
    }
    Ok(result)
}

fn run_tls(args: &[String]) -> Result<()> {
    let pairs = option_pairs(args, &["--sni"])?;
    let sni = pairs
        .first()
        .map_or("example.com", |(_, value)| value.as_str());
    if sni.is_empty()
        || sni.len() > 253
        || !sni
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'.' || b == b'-')
    {
        return Err(invalid("Invalid SNI hostname"));
    }
    // Offline inspection only. Browser TLS and HTTPS proxy transport remain unchanged.
    let builder = ClientHelloBuilder::new(TlsProfile::chrome()).server_name(sni);
    let packet = builder.build()?;
    let ja3 = builder.compute_ja3();
    emit(json!({"experimental": true, "transport_integrated": false,
        "ja3": ja3.raw, "ja3_hash": ja3.hash, "ja4": builder.compute_ja4_with_signatures().formatted,
        "client_hello_len": packet.len(), "sni": sni}))
}

async fn run_lock(args: &[String]) -> Result<()> {
    let pairs = option_pairs(args, &["--path"])?;
    let path = pairs
        .first()
        .filter(|(_, value)| !value.is_empty())
        .ok_or_else(|| invalid("Missing --path for lock"))?;
    let mut lock = FileLock::new(&path.1);
    if !lock.try_lock()? {
        // Busy is a normal, expected outcome fully described by the stdout
        // JSON; exiting non-zero here would only add stderr noise and a
        // misleading "failure" exit code for callers that already parse the
        // emitted status.
        emit(json!({"status":"busy", "acquired":false}))?;
        return Ok(());
    }
    emit(json!({"status":"locked", "acquired":true, "pid":std::process::id()}))?;
    let mut lines = control_lines();
    if let Some(frame) = lines.recv().await {
        frame?;
    }
    lock.unlock()?;
    emit(json!({"status":"unlocked"}))
}

fn run_layout(args: &[String]) -> Result<()> {
    let mut screen = ScreenBounds::default();
    let (mut count, mut margin, mut gap) = (4usize, 8u32, 8u32);
    for (key, value) in option_pairs(
        args,
        &[
            "--screen-w",
            "--screen-h",
            "--taskbar",
            "--count",
            "--margin",
            "--gap",
        ],
    )? {
        let number: u32 = value
            .parse()
            .map_err(|_| invalid("Expected an unsigned 32-bit integer"))?;
        match key.as_str() {
            "--screen-w" => screen.width = number,
            "--screen-h" => screen.height = number,
            "--taskbar" => screen.taskbar_height = number,
            "--count" => count = number as usize,
            "--margin" => margin = number,
            "--gap" => gap = number,
            _ => unreachable!(),
        }
    }
    let windows = TileGridLayout::calculate(screen, count, margin, gap)?;
    emit(
        json!({"screen":{"width":screen.width,"height":screen.height,"taskbar":screen.taskbar_height},
        "count":count,"windows":windows}),
    )
}
