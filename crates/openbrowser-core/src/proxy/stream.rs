use crate::error::{CoreError, Result};
use std::pin::Pin;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::task::Poll;
use tokio::io::{AsyncRead, AsyncWrite, ReadBuf};
use tokio::time::{sleep, Duration, Instant};

/// Default inactivity ceiling for an established tunnel session.
///
/// Only the handshake deadline existed before; the session itself was a bare
/// tokio::io::copy_bidirectional with no timeout, so a session whose upstream
/// half-answered the handshake and then went silent held one of the 512
/// session slots forever. 90s of no bytes in EITHER direction is far beyond
/// any browser keep-alive gap yet short enough that wedged slots free up in
/// minutes, not hours.
pub const IDLE_TIMEOUT: Duration = Duration::from_secs(90);

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct StreamStats {
    pub client_to_server_bytes: u64,
    pub server_to_client_bytes: u64,
}

/// Bidirectional asynchronous streaming between client and upstream sockets.
/// Delegates buffering and half-close handling to tokio::io::copy_bidirectional;
/// see [`copy_bidirectional_with_idle_timeout`] for the bounded variant.
pub async fn copy_bidirectional<A, B>(mut client: A, mut server: B) -> Result<StreamStats>
where
    A: AsyncRead + AsyncWrite + Unpin,
    B: AsyncRead + AsyncWrite + Unpin,
{
    let (c2s, s2c) = tokio::io::copy_bidirectional(&mut client, &mut server).await?;
    Ok(StreamStats {
        client_to_server_bytes: c2s,
        server_to_client_bytes: s2c,
    })
}

/// Millis since an arbitrary process-wide epoch. Instant cannot be stored in
/// an AtomicU64 directly, so deadlines live as absolute millis on this scale;
/// monotonicity of Instant makes the arithmetic race-free.
fn millis_since_start(at: Instant) -> u64 {
    static START: std::sync::OnceLock<Instant> = std::sync::OnceLock::new();
    at.duration_since(*START.get_or_init(Instant::now))
        .as_millis() as u64
}

/// Stream wrapper that tracks last-progress time against [IDLE_TIMEOUT].
/// It is fully transparent: reads, writes, flushes and shutdowns delegate to
/// the inner stream; the only added behavior is the deadline bookkeeping the
/// watchdog query below consults, plus optional live byte counting so a
/// watchdog kill still reports the traffic a session already transferred.
struct IdleTimeoutStream<S> {
    inner: S,
    idle: Duration,
    /// Absolute millis-deadline shared by both ends. Lock-free: poll paths
    /// only ever `store` the next deadline, the watchdog only `load`s it —
    /// the std Mutex this replaces was two lock/unlock pairs per 16KB chunk.
    last_progress: Arc<AtomicU64>,
    /// Bytes READ from this stream are added here live (one direction of the
    /// tunnel). Counting on the read side — not the write side — matches
    /// tokio's per-direction byte accounting and avoids double counting the
    /// same chunk at both wrappers.
    read_counter: Option<Arc<AtomicU64>>,
}

impl<S> IdleTimeoutStream<S> {
    /// Any byte in either direction proves liveness: push the deadline out.
    fn note_progress(&mut self) {
        // Shared cell: one deadline for BOTH ends — progress on either side
        // pushes it. The watchdog reads the cell without borrowing the
        // streams, so its select arm never conflicts with the copy future's
        // &mut borrows.
        let deadline = millis_since_start(Instant::now()) + self.idle.as_millis() as u64;
        self.last_progress.store(deadline, Ordering::Release);
    }
}

impl<S: AsyncRead + Unpin> AsyncRead for IdleTimeoutStream<S> {
    fn poll_read(
        mut self: Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
        buf: &mut ReadBuf<'_>,
    ) -> std::task::Poll<std::io::Result<()>> {
        let this = &mut *self;
        match Pin::new(&mut this.inner).poll_read(cx, buf) {
            Poll::Pending => Poll::Pending,
            // Ready(EOF) included: FIN propagation happens through tokio's
            // copy loop exactly as before; only a READ timeout errors.
            Poll::Ready(Ok(())) => {
                // Live-count the chunk that just entered this end of the
                // tunnel (read-side accounting), then push the deadline.
                if let Some(counter) = &this.read_counter {
                    counter.fetch_add(buf.filled().len() as u64, Ordering::Relaxed);
                }
                this.note_progress();
                Poll::Ready(Ok(()))
            }
            Poll::Ready(Err(e)) => Poll::Ready(Err(e)),
        }
    }
}

impl<S: AsyncWrite + Unpin> AsyncWrite for IdleTimeoutStream<S> {
    fn poll_write(
        mut self: Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
        buf: &[u8],
    ) -> std::task::Poll<std::io::Result<usize>> {
        let this = &mut *self;
        match Pin::new(&mut this.inner).poll_write(cx, buf) {
            // A WOULD-BLOCK write is a live, progressing peer: counts as
            // progress so backpressure from a slow reader does not read as
            // inactivity.
            Poll::Pending => {
                this.note_progress();
                Poll::Pending
            }
            Poll::Ready(Ok(n)) => {
                this.note_progress();
                Poll::Ready(Ok(n))
            }
            Poll::Ready(Err(e)) => Poll::Ready(Err(e)),
        }
    }

    fn poll_flush(
        mut self: Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<std::io::Result<()>> {
        let this = &mut *self;
        match Pin::new(&mut this.inner).poll_flush(cx) {
            Poll::Pending => {
                this.note_progress();
                Poll::Pending
            }
            Poll::Ready(res) => {
                this.note_progress();
                Poll::Ready(res)
            }
        }
    }

    fn poll_shutdown(
        mut self: Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<std::io::Result<()>> {
        let this = &mut *self;
        Pin::new(&mut this.inner).poll_shutdown(cx)
    }
}

// The wrapper holds no self-referential data (a plain deadline field), so
// moving it is sound; tokio's copy helpers require their stream args Unpin.
impl<S: Unpin> Unpin for IdleTimeoutStream<S> {}

/// Inactivity-bounded copy: wraps both ends in [IdleTimeoutStream] and keeps
/// the actual byte moving inside tokio::io::copy_bidirectional, so half-close
/// / FIN propagation, stats counting and the 16KB buffers are exactly the
/// tokio semantics. A watchdog races the copy future; when it fires the
/// session had IDLE_TIMEOUT without a byte in either direction and the copy
/// is aborted with an error instead of holding its session slot forever.
pub async fn copy_bidirectional_with_idle_timeout<A, B>(client: A, server: B) -> Result<StreamStats>
where
    A: AsyncRead + AsyncWrite + Unpin,
    B: AsyncRead + AsyncWrite + Unpin,
{
    copy_bidirectional_with_idle_timeout_bounded(client, server, IDLE_TIMEOUT).await
}

/// Live-counted variant for the bridge hot path: every byte read from either
/// end is added to the SHARED counters as it flows (client reads feed c2s,
/// server reads feed s2c), so a session killed by the idle watchdog still
/// contributes the traffic it transferred before going idle — previously the
/// error path dropped the copy future and with it every byte of a multi-GB
/// session. The Ok return value keeps the session's final totals.
pub async fn copy_bidirectional_with_idle_timeout_into<A, B>(
    client: A,
    server: B,
    c2s_counter: Arc<AtomicU64>,
    s2c_counter: Arc<AtomicU64>,
) -> Result<StreamStats>
where
    A: AsyncRead + AsyncWrite + Unpin,
    B: AsyncRead + AsyncWrite + Unpin,
{
    copy_bidirectional_with_idle_timeout_bounded_into(
        client,
        server,
        IDLE_TIMEOUT,
        Some(c2s_counter),
        Some(s2c_counter),
    )
    .await
}

/// Injection seam for the regression tests: identical semantics with a
/// caller-provided window so the re-arm loop can be exercised in milliseconds
/// instead of waiting out the 90s production constant.
pub async fn copy_bidirectional_with_idle_timeout_bounded<A, B>(
    client: A,
    server: B,
    idle: Duration,
) -> Result<StreamStats>
where
    A: AsyncRead + AsyncWrite + Unpin,
    B: AsyncRead + AsyncWrite + Unpin,
{
    copy_bidirectional_with_idle_timeout_bounded_into(client, server, idle, None, None).await
}

/// Shared implementation: optional live byte counters (the bridge passes the
/// shared session-total atomics; tests pass None and read the Ok totals).
async fn copy_bidirectional_with_idle_timeout_bounded_into<A, B>(
    client: A,
    server: B,
    idle: Duration,
    c2s_counter: Option<Arc<AtomicU64>>,
    s2c_counter: Option<Arc<AtomicU64>>,
) -> Result<StreamStats>
where
    A: AsyncRead + AsyncWrite + Unpin,
    B: AsyncRead + AsyncWrite + Unpin,
{
    let last_progress = Arc::new(AtomicU64::new(
        millis_since_start(Instant::now()) + idle.as_millis() as u64,
    ));
    let mut client = IdleTimeoutStream {
        inner: client,
        idle,
        last_progress: Arc::clone(&last_progress),
        read_counter: c2s_counter,
    };
    let mut server = IdleTimeoutStream {
        inner: server,
        idle,
        last_progress: Arc::clone(&last_progress),
        read_counter: s2c_counter,
    };

    // The watchdog is armed from the shared deadline and RE-ARMED whenever
    // progress pushes it: every byte in either direction (and live write
    // backpressure) moves the cell, so when a sleep fires with the cell
    // still in the past, the session truly had the full window with no
    // progress. Re-arming — not a one-shot sleep — is what lets an active
    // transfer longer than the window survive: a one-shot watchdog killed it
    // at window-start regardless of traffic. The copy future persists across
    // watchdog re-arms (re-borrowed by each select iteration, never
    // recreated), so half-close/FIN propagation and stats stay exactly
    // tokio::io::copy_bidirectional's.
    let mut copy_fut = std::pin::pin!(tokio::io::copy_bidirectional(&mut client, &mut server));
    loop {
        let now_ms = millis_since_start(Instant::now());
        let armed_ms = last_progress.load(Ordering::Acquire).max(now_ms);
        let mut watchdog = Box::pin(sleep(Duration::from_millis(armed_ms - now_ms)));
        tokio::select! {
            biased;
            // Copy-first ordering: a completed copy is the definitive session
            // outcome. With the watchdog polled first, a copy that finished in
            // the same wakeup batch as an expired sleep was misreported as an
            // idle timeout (and its stats dropped).
            copied = &mut copy_fut => {
                let (c2s, s2c) = copied?;
                return Ok(StreamStats {
                    client_to_server_bytes: c2s,
                    server_to_client_bytes: s2c,
                });
            }
            _ = &mut watchdog => {
                let now_ms = millis_since_start(Instant::now());
                let cell_deadline = last_progress.load(Ordering::Acquire);
                if cell_deadline <= now_ms {
                    return Err(CoreError::Proxy("Tunnel session idle timeout exceeded".into()));
                }
                // Progress pushed the deadline after this sleep was armed:
                // the session is NOT idle. Loop re-arms from the new deadline.
                continue;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio::net::TcpStream;

    #[tokio::test]
    async fn idle_timeout_wrapper_passes_reads_and_writes() {
        // Echo server, and a client wrapped in the idle wrapper: the wrapper
        // must be transparent for normal traffic.
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let echo = tokio::spawn(async move {
            let (mut sock, _) = listener.accept().await.unwrap();
            let (mut rd, mut wr) = sock.split();
            let _ = tokio::io::copy(&mut rd, &mut wr).await;
        });
        let client = TcpStream::connect(addr).await.unwrap();
        let mut wrapped = IdleTimeoutStream {
            inner: client,
            idle: IDLE_TIMEOUT,
            last_progress: Arc::new(AtomicU64::new(0)),
            read_counter: Some(Arc::new(AtomicU64::new(0))),
        };
        wrapped.write_all(b"ping").await.unwrap();
        let mut buf = [0u8; 4];
        wrapped.read_exact(&mut buf).await.unwrap();
        assert_eq!(&buf, b"ping");
        echo.abort();
    }

    #[tokio::test]
    async fn idle_timeout_live_counters_survive_watchdog_kill() {
        // A session that transfers bytes, then goes silent long enough for the
        // watchdog: the live counters must retain the transferred bytes even
        // though the copy future (and its internal stats) is dropped on error.
        let l_up = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let up_addr = l_up.local_addr().unwrap();
        let up = tokio::spawn(async move {
            let (mut sock, _) = l_up.accept().await.unwrap();
            sock.write_all(b"payload").await.unwrap();
            // Then stay silent forever: the watchdog must fire.
            tokio::time::sleep(Duration::from_secs(3600)).await;
        });
        let l_cli = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let cli_addr = l_cli.local_addr().unwrap();
        let cli = tokio::spawn(async move {
            let (_sock, _) = l_cli.accept().await.unwrap();
            tokio::time::sleep(Duration::from_secs(3600)).await;
        });
        let client_end = TcpStream::connect(cli_addr).await.unwrap();
        let server_end = TcpStream::connect(up_addr).await.unwrap();

        let c2s = Arc::new(AtomicU64::new(0));
        let s2c = Arc::new(AtomicU64::new(0));
        let res = copy_bidirectional_with_idle_timeout_bounded_into(
            client_end,
            server_end,
            Duration::from_millis(200),
            Some(c2s.clone()),
            Some(s2c.clone()),
        )
        .await;
        assert!(
            res.is_err(),
            "silent session must be killed by the watchdog"
        );
        assert_eq!(
            s2c.load(Ordering::Relaxed),
            b"payload".len() as u64,
            "bytes transferred before idle must survive the watchdog kill"
        );
        assert_eq!(c2s.load(Ordering::Relaxed), 0);
        up.abort();
        cli.abort();
    }
}
