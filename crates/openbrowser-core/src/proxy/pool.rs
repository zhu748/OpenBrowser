use crate::error::{CoreError, Result};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::net::TcpStream;
use tokio::sync::{Mutex, OwnedSemaphorePermit, Semaphore, SemaphorePermit};

/// Concurrent prewarm dial cap. Distinct from the client-handshake limiter:
/// prewarm dials are speculative traffic and must never crowd out real
/// handshakes, so they get their own small pool of slots.
const PREWARM_DIAL_CONCURRENCY: usize = 4;

/// Eviction threshold for the recency map: once it grows past this, entries
/// older than the TTL are dropped so the map stays bounded.
const RECENT_DIAL_CAP: usize = 1024;

/// Concurrency limiter for proxy dialers and tunnel connections.
/// Prevents thread exhaustion and rate-limit triggers by pacing connection handshakes.
#[derive(Debug, Clone)]
pub struct ConcurrencyLimiter {
    semaphore: Arc<Semaphore>,
    max_concurrent: usize,
}

impl ConcurrencyLimiter {
    pub fn new(max_concurrent: usize) -> Self {
        let max = if max_concurrent == 0 {
            128
        } else {
            max_concurrent
        };
        Self {
            semaphore: Arc::new(Semaphore::new(max)),
            max_concurrent: max,
        }
    }

    pub async fn acquire(&self) -> Result<SemaphorePermit<'_>> {
        self.semaphore
            .acquire()
            .await
            .map_err(|_| CoreError::Proxy("Concurrency limiter semaphore closed".to_string()))
    }

    pub fn available_permits(&self) -> usize {
        self.semaphore.available_permits()
    }

    pub fn max_concurrent(&self) -> usize {
        self.max_concurrent
    }
}

/// Helper to verify whether an idle TCP stream is still open and healthy without consuming bytes.
pub fn is_stream_healthy(stream: &TcpStream) -> bool {
    let mut buf = [0u8; 1];
    match stream.try_read(&mut buf) {
        Ok(0) => false, // EOF / remote peer closed the connection
        Ok(_) => false, // Unexpected unread bytes on idle tunnel
        Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => true, // Still alive, non-blocking check
        Err(_) => false,                                                  // Socket error or RST
    }
}

/// A pre-established CONNECT tunnel ready to immediately bridge client data.
#[derive(Debug)]
pub struct PooledTunnel {
    pub stream: TcpStream,
    pub upstream_remainder: Vec<u8>,
    pub created_at: Instant,
}

/// A prewarmed raw TCP stream to the upstream proxy.
#[derive(Debug)]
pub struct PooledTcp {
    pub stream: TcpStream,
    pub created_at: Instant,
}

/// Upstream connection pool for HTTP proxy tunnels and TCP connections.
///
/// Implements dual-level pooling:
/// 1. Established CONNECT tunnels keyed by `(target_host, target_port)`:
///    Reuses or prewarms completed upstream CONNECT handshakes to reduce second-handshake latency.
/// 2. Raw TCP connections to the upstream proxy:
///    Eliminates TCP 3-way handshake round-trip on the critical path.
///
/// Prewarm dials are gated three ways: the target must have carried real
/// traffic recently (`record_dial`), the pool must have capacity, and a
/// dedicated semaphore caps concurrent prewarm dials so speculative traffic
/// never competes with real handshakes.
#[derive(Debug)]
pub struct UpstreamTunnelPool {
    tunnels: Mutex<HashMap<(String, u16), Vec<PooledTunnel>>>,
    raw_tcp: Mutex<Vec<PooledTcp>>,
    recent_dials: Mutex<HashMap<(String, u16), Instant>>,
    prewarm_permits: Arc<Semaphore>,
    stopped: AtomicBool,
    max_tunnels_per_target: usize,
    max_total_tunnels: usize,
    max_raw_tcp: usize,
    ttl: Duration,
    prewarm_enabled: bool,
}

impl UpstreamTunnelPool {
    pub fn new(max_total_tunnels: usize, ttl: Duration) -> Self {
        let max_total = if max_total_tunnels == 0 {
            16
        } else {
            max_total_tunnels
        };
        Self {
            tunnels: Mutex::new(HashMap::new()),
            raw_tcp: Mutex::new(Vec::new()),
            recent_dials: Mutex::new(HashMap::new()),
            prewarm_permits: Arc::new(Semaphore::new(PREWARM_DIAL_CONCURRENCY)),
            stopped: AtomicBool::new(false),
            max_tunnels_per_target: 2,
            max_total_tunnels: max_total,
            max_raw_tcp: 4,
            ttl,
            prewarm_enabled: true,
        }
    }

    pub fn with_prewarm(mut self, enabled: bool) -> Self {
        self.prewarm_enabled = enabled;
        self
    }

    pub fn is_prewarm_enabled(&self) -> bool {
        self.prewarm_enabled
    }

    /// Retrieve an established tunnel for the given target host and port.
    pub async fn take_tunnel(
        &self,
        target_host: &str,
        target_port: u16,
    ) -> Option<(TcpStream, Vec<u8>)> {
        let key = (target_host.to_ascii_lowercase(), target_port);
        let mut guard = self.tunnels.lock().await;

        if let Some(list) = guard.get_mut(&key) {
            while let Some(tunnel) = list.pop() {
                if tunnel.created_at.elapsed() < self.ttl && is_stream_healthy(&tunnel.stream) {
                    if list.is_empty() {
                        guard.remove(&key);
                    }
                    return Some((tunnel.stream, tunnel.upstream_remainder));
                }
                // Expired or closed stream is silently dropped
            }
            guard.remove(&key);
        }
        None
    }

    /// Store a pre-established tunnel for the given target host and port.
    /// Refuses while stopped: a straggler prewarm task must not re-populate a
    /// pool whose owner already drained it on stop.
    pub async fn put_tunnel(
        &self,
        target_host: String,
        target_port: u16,
        stream: TcpStream,
        upstream_remainder: Vec<u8>,
    ) -> bool {
        if !self.prewarm_enabled || self.stopped.load(Ordering::Acquire) {
            return false;
        }

        let key = (target_host.to_ascii_lowercase(), target_port);
        let mut guard = self.tunnels.lock().await;
        // Re-check under the lock: clear() takes this same lock, so a put that
        // raced the unlocked check can no longer land after the drain.
        if self.stopped.load(Ordering::Acquire) {
            return false;
        }

        let total_tunnels: usize = guard.values().map(|v| v.len()).sum();
        if total_tunnels >= self.max_total_tunnels {
            return false;
        }

        let list = guard.entry(key).or_default();
        if list.len() >= self.max_tunnels_per_target {
            // Drop oldest
            list.remove(0);
        }

        list.push(PooledTunnel {
            stream,
            upstream_remainder,
            created_at: Instant::now(),
        });
        true
    }

    /// Retrieve a prewarmed raw TCP stream to the upstream proxy.
    pub async fn take_upstream_tcp(&self) -> Option<TcpStream> {
        let mut guard = self.raw_tcp.lock().await;
        while let Some(pooled) = guard.pop() {
            if pooled.created_at.elapsed() < self.ttl && is_stream_healthy(&pooled.stream) {
                return Some(pooled.stream);
            }
        }
        None
    }

    /// Store a prewarmed raw TCP stream to the upstream proxy.
    /// Refuses while stopped, symmetric with put_tunnel.
    pub async fn put_upstream_tcp(&self, stream: TcpStream) -> bool {
        if !self.prewarm_enabled || self.stopped.load(Ordering::Acquire) {
            return false;
        }
        let mut guard = self.raw_tcp.lock().await;
        // Re-check under the lock, symmetric with put_tunnel: clear() drains
        // this same mutex, so the unlocked check alone is a TOCTOU window.
        if self.stopped.load(Ordering::Acquire) {
            return false;
        }
        if guard.len() >= self.max_raw_tcp {
            return false;
        }
        guard.push(PooledTcp {
            stream,
            created_at: Instant::now(),
        });
        true
    }

    /// Record that the real dial path in handle_client served this target.
    /// The next request's prewarm decision reads this: a target never seen on
    /// the real path is one-off traffic, and prewarming it would spend an
    /// upstream dial that may never be reused.
    pub async fn record_dial(&self, target_host: &str, target_port: u16) {
        let key = (target_host.to_ascii_lowercase(), target_port);
        let mut guard = self.recent_dials.lock().await;
        if guard.len() > RECENT_DIAL_CAP {
            guard.retain(|_, at| at.elapsed() < self.ttl);
        }
        if guard.len() >= RECENT_DIAL_CAP && !guard.contains_key(&key) {
            // Full of fresh entries: dropping this record only costs the
            // target its prewarm eligibility, never correctness.
            return;
        }
        guard.insert(key, Instant::now());
    }

    /// Check if a standby tunnel for this target is worth dialing now.
    /// Three gates: the target carried real traffic within the TTL, the pool
    /// has per-target AND total capacity, and the pool is not stopped.
    pub async fn should_prewarm(&self, target_host: &str, target_port: u16) -> bool {
        if !self.prewarm_enabled || self.stopped.load(Ordering::Acquire) {
            return false;
        }
        let key = (target_host.to_ascii_lowercase(), target_port);
        let recently_dialed = {
            let recency = self.recent_dials.lock().await;
            recency.get(&key).is_some_and(|at| at.elapsed() < self.ttl)
        };
        if !recently_dialed {
            return false;
        }
        let tunnels = self.tunnels.lock().await;
        tunnels.get(&key).map_or(0, |v| v.len()) < self.max_tunnels_per_target
            && tunnels.values().map(|v| v.len()).sum::<usize>() < self.max_total_tunnels
    }

    /// Try to take one of the dedicated prewarm dial slots. Returns None when
    /// the cap is busy or the pool is stopped; callers skip this prewarm round
    /// silently instead of queueing, so real handshakes are never delayed.
    pub fn try_acquire_prewarm_slot(&self) -> Option<OwnedSemaphorePermit> {
        if !self.prewarm_enabled || self.stopped.load(Ordering::Acquire) {
            return None;
        }
        self.prewarm_permits.clone().try_acquire_owned().ok()
    }

    /// Current count of raw TCP streams in the pool.
    pub async fn raw_tcp_count(&self) -> usize {
        self.raw_tcp.lock().await.len()
    }

    /// Current count of active tunnels in the pool across all targets.
    pub async fn active_tunnel_count(&self) -> usize {
        let guard = self.tunnels.lock().await;
        guard.values().map(|v| v.len()).sum()
    }

    /// Clear and drop all pooled sockets immediately (invoked on stop/shutdown)
    /// and mark the pool stopped: later put_tunnel/put_upstream_tcp calls
    /// refuse, so a prewarm task that outlives the stop cannot re-populate a
    /// pool the owner believes is drained.
    pub async fn clear(&self) {
        self.stopped.store(true, Ordering::Release);
        let mut tunnels_guard = self.tunnels.lock().await;
        tunnels_guard.clear();
        let mut tcp_guard = self.raw_tcp.lock().await;
        tcp_guard.clear();
        let mut recency_guard = self.recent_dials.lock().await;
        recency_guard.clear();
    }

    /// Re-arm a pool that clear() stopped. A shared pool can outlive one
    /// bridge run: without this reset, restarting a bridge on the same pool
    /// would keep refusing puts and prewarms forever.
    pub fn rearm(&self) {
        self.stopped.store(false, Ordering::Release);
    }
}
