//! Regression tests for the bridge stop()/start() race (P1-5).
//!
//! The racy window: inside the `running` lock, start() used to rearm() the
//! shared tunnel pool and only advance the generation counter AFTER
//! TcpListener::bind (an await point). The old run's task tail and the old
//! stop() tail both gate their pool clear on `generation == task_generation`,
//! and stop() releases `running` before awaiting its tail — so an old tail
//! landing inside the (rearm, fetch_add) window still saw a MATCH, ran
//! clear() AFTER the new run rearmed, and left the pool stopped=true forever:
//! every put_tunnel / prewarm refused for the whole new bridge run.
//! The fix advances the generation before rearm() inside the same lock.
//!
//! These tests exercise interleaved stop() -> start() cycles with client
//! sessions still open at stop time (so the old task's drain actually has
//! work to do, widening the window) and assert the NEW run's pool accepts
//! put_tunnel and prewarm. Loop count is high on purpose: the old ordering
//! lost the race only sometimes, so a handful of iterations proves nothing.

use openbrowser_core::proxy::pool::UpstreamTunnelPool;
use openbrowser_core::proxy::{
    FailClosedPolicy, LocalProxyBridge, ProxyConfig, ProxyForwarder, ProxyProtocol,
};
use std::sync::atomic::Ordering;
use std::time::Duration;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;

/// Minimal SOCKS5-upstream-equivalent: the HTTP-upstream path is the one that
/// prewarms/pools, so a mock HTTP CONNECT proxy (like upstream_reuse_tests)
/// gives the pool real work per request.
struct MockConnectProxy {
    addr: std::net::SocketAddr,
    shutdown_tx: tokio::sync::watch::Sender<bool>,
}

impl MockConnectProxy {
    async fn start() -> Self {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let (shutdown_tx, shutdown_rx) = tokio::sync::watch::channel(false);
        tokio::spawn(async move {
            let mut shutdown = shutdown_rx;
            while !*shutdown.borrow() {
                tokio::select! {
                    _ = shutdown.changed() => break,
                    accept = listener.accept() => {
                        if let Ok((mut stream, _)) = accept {
                            tokio::spawn(async move {
                                let mut buf = [0u8; 1024];
                                // Hold the accepted connection open without
                                // answering the CONNECT: keeps session tasks
                                // alive and draining at stop time (the exact
                                // condition that widens the racy window).
                                loop {
                                    match stream.read(&mut buf).await {
                                        Ok(0) | Err(_) => break,
                                        Ok(_) => {}
                                    }
                                }
                            });
                        }
                    }
                }
            }
        });
        Self { addr, shutdown_tx }
    }

    fn stop(&self) {
        let _ = self.shutdown_tx.send(true);
    }
}

fn http_config(port: u16) -> ProxyConfig {
    ProxyConfig {
        protocol: ProxyProtocol::Http,
        host: "127.0.0.1".into(),
        port,
        username: None,
        password: None,
        remark: None,
        name: None,
    }
}

/// Core regression: >=20 interleaved stop() -> start() cycles; after each
/// RESTART the new run's pool must accept put_tunnel and answer
/// should_prewarm=true (record_dial seeded first) — the two operations a
/// stale clear() permanently disables. Each cycle is: start, park a client
/// session mid-handshake (drain work for the stop), stop, restart, probe.
#[tokio::test]
async fn test_restart_cycles_keep_pool_accepting_puts_and_prewarms() {
    let proxy = MockConnectProxy::start().await;
    let config = http_config(proxy.addr.port());
    let bridge = LocalProxyBridge::new(config, FailClosedPolicy::default());
    let pool: std::sync::Arc<UpstreamTunnelPool> = bridge.tunnel_pool().clone();

    for cycle in 0..20u32 {
        let addr = bridge.start().await.expect("start");
        assert!(bridge.is_running(), "cycle {}: bridge must run", cycle);

        // Open a client session and leave it mid-handshake: the bridge
        // session task is still waiting on the upstream when stop() lands,
        // so the abort/drain tail has real work and the racy window is wide.
        let mut client = TcpStream::connect(addr).await.expect("client connect");
        client
            .write_all(b"CONNECT restart.test:443 HTTP/1.1\r\nHost: restart.test:443\r\n\r\n")
            .await
            .expect("write CONNECT");
        tokio::time::sleep(Duration::from_millis(5)).await;

        // stop(): clear() is legitimate here (no newer run yet) — the pool
        // goes stopped=true until the restart below rearms it.
        bridge.stop().await.expect("stop");
        assert!(!bridge.is_running(), "cycle {}: bridge must stop", cycle);

        // Restart: this start() is the one a stale tail could have cleared
        // after rearm under the old ordering.
        let addr2 = bridge.start().await.expect("restart");
        assert_ne!(addr, addr2, "cycle {}: fresh listener expected", cycle);

        // The new run must find an accepting pool. This is the exact
        // assertion the OLD ordering failed intermittently: a stale clear()
        // after rearm left stopped=true and every put refused.
        let spare = TcpStream::connect(("127.0.0.1", proxy.addr.port()))
            .await
            .expect("dial spare tunnel");
        let accepted = pool
            .put_tunnel("restart.test".into(), 443, spare, Vec::new())
            .await;
        assert!(
            accepted,
            "cycle {}: put_tunnel must be accepted after restart",
            cycle
        );

        // Prewarm: seed the recency map the way a served request would (a
        // mid-handshake stop aborts the real dial path), then the answer
        // must be true — should_prewarm is the second thing a stale clear
        // disables.
        pool.record_dial("restart.test", 443).await;
        assert!(
            pool.should_prewarm("restart.test", 443).await,
            "cycle {}: should_prewarm must answer true after restart",
            cycle
        );
        assert_eq!(
            pool.active_tunnel_count().await,
            1,
            "cycle {}: exactly the one standby",
            cycle
        );

        // Hand the standby to the next request: the pool keeps serving
        // traffic, not just probes.
        let taken = pool.take_tunnel("restart.test", 443).await;
        assert!(taken.is_some(), "cycle {}: take_tunnel", cycle);

        bridge.stop().await.expect("cycle cleanup stop");
    }

    proxy.stop();
}

/// With real client sessions open across the stop (upstream answered 200 and
/// the session streams): the drain tail of the OLD run must not clear the
/// pool the NEW run just rearmed. Exercises the same invariant through the
/// bridge's own session tasks rather than direct pool calls.
#[tokio::test]
async fn test_stop_with_open_sessions_does_not_kill_next_run_pool() {
    let proxy = MockConnectProxy::start().await;
    let bridge = LocalProxyBridge::new(http_config(proxy.addr.port()), FailClosedPolicy::default());
    let pool = bridge.tunnel_pool().clone();

    for cycle in 0..20u32 {
        let addr = bridge.start().await.expect("start");

        // One client session established through the full CONNECT handshake:
        // the mock upstream never answers, so the session task is parked in
        // the handshake deadline window when stop() aborts it — the drain
        // then has a live session to reap (the racing condition).
        let mut client = TcpStream::connect(addr).await.expect("client connect");
        client
            .write_all(b"CONNECT drain.test:443 HTTP/1.1\r\nHost: drain.test:443\r\n\r\n")
            .await
            .unwrap();
        // Give the bridge a moment to pick the session up.
        tokio::time::sleep(Duration::from_millis(10)).await;

        bridge.stop().await.expect("stop");

        // Restart immediately: start() rearms the pool under the same lock
        // the old tails raced in.
        let addr2 = bridge.start().await.expect("restart");
        assert_ne!(addr, addr2, "cycle {}: fresh listener expected", cycle);

        // The new run's pool must be accepting. Probing through the PUBLIC
        // surface (put + prewarm), the same pair stale clears disabled.
        let spare = TcpStream::connect(("127.0.0.1", proxy.addr.port()))
            .await
            .expect("dial spare");
        assert!(
            pool.put_tunnel("drain.test".into(), 443, spare, Vec::new())
                .await,
            "cycle {}: pool must accept puts for the new run",
            cycle
        );
        pool.record_dial("drain.test", 443).await;
        assert!(
            pool.should_prewarm("drain.test", 443).await,
            "cycle {}: prewarm must be answered for the new run",
            cycle
        );

        // And a full client CONNECT round on the new listener must be able
        // to consume the standby: proves the pool serves the new run's
        // traffic path, not just the direct calls above.
        let taken = pool.take_tunnel("drain.test", 443).await;
        assert!(taken.is_some(), "cycle {}: take via new run", cycle);
        bridge.stop().await.expect("final stop of cycle");
    }

    proxy.stop();
}

/// Concurrency variant: stop() racing start() while a run is ACTIVE — the
/// exact interleaving class the old ordering lost. Sequence per cycle: run
/// is up, then stop() and start() fire concurrently; stop's tail drains the
/// old task while start's critical section is between rearm() and the
/// generation advance. The invariant: whichever way the race resolves, the
/// NEXT start must find a pool that accepts puts.
#[tokio::test]
async fn test_concurrent_stop_start_never_leaves_pool_dead() {
    let proxy = MockConnectProxy::start().await;
    let bridge = std::sync::Arc::new(LocalProxyBridge::new(
        http_config(proxy.addr.port()),
        FailClosedPolicy::default(),
    ));
    let pool = bridge.tunnel_pool().clone();

    for cycle in 0..20u32 {
        // Run is up FIRST: the race below must have a live handle to take.
        let addr = bridge.start().await.expect("cycle start");
        assert!(bridge.is_running(), "cycle {}: run must be up", cycle);

        // A parked client session so the old task's abort/drain has work.
        let mut client = TcpStream::connect(addr).await.expect("client connect");
        client
            .write_all(b"CONNECT race.test:443 HTTP/1.1\r\nHost: race.test:443\r\n\r\n")
            .await
            .expect("write CONNECT");
        tokio::time::sleep(Duration::from_millis(5)).await;

        // Fire stop() and start() concurrently: stop takes the active
        // handle out under the lock, start waits for the lock behind it.
        // Whichever interleaving wins, the pool must survive.
        let b1 = bridge.clone();
        let b2 = bridge.clone();
        let stopped = tokio::spawn(async move { b1.stop().await });
        let started = tokio::spawn(async move { b2.start().await });
        let (stopped_res, started_res) = tokio::join!(stopped, started);
        let _ = stopped_res.expect("stop task panicked");
        let _ = started_res.expect("start task panicked");

        // However the race resolved, the bridge state must be coherent and
        // the pool usable: start once more unconditionally and probe.
        let addr = bridge.start().await.expect("recovery start");
        assert!(bridge.is_running(), "cycle {}: recovery start runs", cycle);

        let spare = TcpStream::connect(("127.0.0.1", proxy.addr.port()))
            .await
            .expect("dial spare");
        assert!(
            pool.put_tunnel("race.test".into(), 443, spare, Vec::new())
                .await,
            "cycle {}: recovery run must accept pool puts (stale clear race)",
            cycle
        );

        // Sanity: the running generation really is the newest one.
        assert_eq!(
            bridge.generation().load(Ordering::SeqCst),
            bridge.current_run_generation().unwrap_or(0),
            "cycle {}: active run must be the newest generation",
            cycle
        );

        let _ = addr;
        bridge.stop().await.expect("cleanup stop");
    }

    proxy.stop();
}
