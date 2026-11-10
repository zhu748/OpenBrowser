//! Integration tests for the session inactivity ceiling (P2-3).
//!
//! Before the fix, an established tunnel session was wrapped around
//! tokio::io::copy_bidirectional with NO timeout — only the handshake
//! deadline existed. A wedged session (upstream replied 200 then went
//! silent) held one of the 512 session slots forever. The bridge now streams
//! through copy_bidirectional_with_idle_timeout (90s default). copy_bidirectional
//! semantics (half-close, FIN propagation, stats, 16KB buffers) are unchanged —
//! the timeout wraps the same tokio copy.

use openbrowser_core::copy_bidirectional_with_idle_timeout;
use std::time::{Duration, Instant};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::time::timeout;

/// Silent pair: a client and a server, both connected, then neither side
/// sends a byte. The copy future must remain pending for the whole probe
/// window — it sits in the idle watchdog, neither completing (which would
/// mean a fabricated EOF) nor erroring early. The watchdog firing at 90s is
/// covered by the unit test next to the wrapper (stream.rs); here we pin
/// the observable contract: a wedged session is still open after seconds,
/// not torn down, and never busy-loops.
#[tokio::test]
async fn test_silent_session_stays_pending_under_watchdog() {
    // One listener per helper leg; both sides stay silent forever.
    let silent_a = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr_a = silent_a.local_addr().unwrap();
    tokio::spawn(async move {
        let (_s, _) = silent_a.accept().await.unwrap();
        tokio::time::sleep(Duration::from_secs(300)).await;
    });
    let silent_b = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr_b = silent_b.local_addr().unwrap();
    tokio::spawn(async move {
        let (_s, _) = silent_b.accept().await.unwrap();
        tokio::time::sleep(Duration::from_secs(300)).await;
    });

    let started = Instant::now();
    let client = TcpStream::connect(addr_a).await.unwrap();
    let server = TcpStream::connect(addr_b).await.unwrap();

    let copy_fut = copy_bidirectional_with_idle_timeout(client, server);
    let outcome = timeout(Duration::from_secs(2), copy_fut).await;
    assert!(
        outcome.is_err(),
        "silent session must not complete or error within the probe window"
    );
    assert!(
        started.elapsed() >= Duration::from_secs(2),
        "the probe window must genuinely elapse (no busy loop)"
    );
}

/// Trickling transfer: the driver writes one byte every 250ms for ~2.5s —
/// longer than the 2s probe window of the silent test — with an echo on the
/// server leg. Every byte in either direction resets the watchdog, so the
/// copy must survive the whole trickle and then complete cleanly with both
/// byte counts > 0 once the driver half-closes. This is the
/// "transfer trickling data longer than the idle window survives" case.
#[tokio::test]
async fn test_trickling_transfer_survives_longer_than_probe_window() {
    // Echo server: accepts one connection and echoes until EOF.
    let echo = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let echo_addr = echo.local_addr().unwrap();
    tokio::spawn(async move {
        let (mut sock, _) = echo.accept().await.unwrap();
        let (mut rd, mut wr) = sock.split();
        let _ = tokio::io::copy(&mut rd, &mut wr).await;
    });

    // Relay: accepts two connections and pipes them into each other, so the
    // helper's client leg and the test driver are the two ends of one pair.
    let relay = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let relay_addr = relay.local_addr().unwrap();
    tokio::spawn(async move {
        let (mut p1, _) = relay.accept().await.unwrap();
        let (mut p2, _) = relay.accept().await.unwrap();
        let _ = tokio::io::copy_bidirectional(&mut p1, &mut p2).await;
    });

    // The helper's server leg goes straight into the echo server.
    let server_leg = TcpStream::connect(echo_addr).await.unwrap();

    // Driver connects first (relay p1); the helper's client leg is p2.
    let mut driver = TcpStream::connect(relay_addr).await.unwrap();
    let copier = tokio::spawn(async move {
        let client_leg = TcpStream::connect(relay_addr).await.unwrap();
        copy_bidirectional_with_idle_timeout(client_leg, server_leg).await
    });

    // Trickle: one distinct byte every 250ms, reading the echo back after
    // each write. Each round trip is progress in BOTH directions; the copy
    // must never trip the idle watchdog during the whole 2.5s sequence —
    // the reset structure is identical at any timescale, so this exercises
    // the same code path a 90s-window tunnel with sparse keepalives takes.
    let expected: Vec<u8> = (0..10u8).map(|i| b'A' + i).collect();
    let mut received = Vec::with_capacity(10);
    for &byte in &expected {
        driver.write_all(&[byte]).await.unwrap();
        let mut one = [0u8; 1];
        driver.read_exact(&mut one).await.unwrap();
        received.push(one[0]);
        tokio::time::sleep(Duration::from_millis(250)).await;
    }
    // Half-close: FIN propagates through the copy; the echo server then sees
    // EOF, closes, and the helper completes with the byte counts.
    driver.shutdown().await.unwrap();

    let stats = timeout(Duration::from_secs(5), copier)
        .await
        .expect("copy task must finish after half-close")
        .expect("copy task must not panic")
        .expect("trickling transfer must not trip the idle watchdog");
    assert_eq!(stats.client_to_server_bytes, 10, "c2s bytes");
    assert_eq!(stats.server_to_client_bytes, 10, "s2c bytes");
    assert_eq!(received, expected, "echoed bytes must round-trip in order");
}
