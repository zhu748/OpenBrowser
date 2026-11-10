//! Regression tests for the idle-timeout RE-ARM semantics (round-2 D1/D7).
//! The watchdog must (a) fire after the full window with no bytes in either
//! direction, and (b) re-arm on progress so an active transfer longer than
//! the window survives. A one-shot watchdog fails (b); a missing watchdog
//! fails (a). Both use the bounded seam with a 300ms window.

use openbrowser_core::proxy::stream::copy_bidirectional_with_idle_timeout_bounded;
use std::time::{Duration, Instant};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};

const WINDOW: Duration = Duration::from_millis(300);

#[tokio::test]
async fn silent_session_errors_within_window() {
    // Upstream accepts and never speaks; the browser peer accepts and never
    // speaks. The session is fully idle: the copy must return the
    // idle-timeout error well inside the 2s bound (a missing watchdog would
    // hang it instead).
    let l_up = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let up_addr = l_up.local_addr().unwrap();
    let up = tokio::spawn(async move {
        let (_sock, _) = l_up.accept().await.unwrap();
        tokio::time::sleep(Duration::from_secs(3600)).await;
    });
    let l_cli = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let cli_addr = l_cli.local_addr().unwrap();
    let cli = tokio::spawn(async move {
        let (_sock, _) = l_cli.accept().await.unwrap();
        tokio::time::sleep(Duration::from_secs(3600)).await;
    });
    let client_end = TcpStream::connect(cli_addr).await.unwrap();
    let server_end = TcpStream::connect(up_addr).await.unwrap();

    let start = Instant::now();
    let copied = tokio::time::timeout(
        Duration::from_secs(2),
        copy_bidirectional_with_idle_timeout_bounded(client_end, server_end, WINDOW),
    )
    .await
    .expect("watchdog did not fire within 2s");
    let elapsed = start.elapsed();
    assert!(copied.is_err(), "idle session must error, got Ok({copied:?})");
    let msg = copied.unwrap_err().to_string();
    assert!(msg.contains("idle timeout"), "unexpected error: {msg}");
    assert!(
        elapsed >= WINDOW && elapsed < Duration::from_secs(1),
        "fired out of window bounds: {elapsed:?}"
    );
    up.abort();
    cli.abort();
}

#[tokio::test]
async fn trickling_transfer_longer_than_window_survives() {
    // 1 byte every 100ms for 900ms with a 300ms window: a ONE-SHOT watchdog
    // kills this at ~300ms into the transfer; only re-arm semantics let it
    // complete. The copy must finish Ok with the full byte counts and
    // in-order delivery.
    let l_up = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let up_addr = l_up.local_addr().unwrap();
    let up = tokio::spawn(async move {
        let (mut sock, _) = l_up.accept().await.unwrap();
        for i in 0..9u8 {
            sock.write_all(&[b'A' + i]).await.unwrap();
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
        // Source done: wait for the copy side's FIN, then close.
        let mut eof_buf = [0u8; 64];
        loop {
            match sock.read(&mut eof_buf).await {
                Ok(0) | Err(_) => break,
                Ok(_) => {}
            }
        }
    });
    let l_cli = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let cli_addr = l_cli.local_addr().unwrap();
    let cli = tokio::spawn(async move {
        let (mut sock, _) = l_cli.accept().await.unwrap();
        // Browser peer: passively receive; after all 9 bytes, half-close.
        let mut got = Vec::new();
        let mut buf = [0u8; 64];
        while got.len() < 9 {
            match sock.read(&mut buf).await {
                Ok(0) | Err(_) => break,
                Ok(n) => got.extend_from_slice(&buf[..n]),
            }
        }
        assert_eq!(got, b"ABCDEFGHI", "trickled bytes must arrive in order");
        let _ = sock.shutdown().await;
        let mut drain = [0u8; 64];
        loop {
            match sock.read(&mut drain).await {
                Ok(0) | Err(_) => break,
                Ok(_) => {}
            }
        }
    });
    let client_end = TcpStream::connect(cli_addr).await.unwrap();
    let server_end = TcpStream::connect(up_addr).await.unwrap();

    let copied = tokio::time::timeout(
        Duration::from_secs(5),
        copy_bidirectional_with_idle_timeout_bounded(client_end, server_end, WINDOW),
    )
    .await
    .expect("copy did not complete within 5s");
    let stats = copied.expect("active trickling transfer must survive the window");
    assert_eq!(stats.server_to_client_bytes, 9, "s2c bytes: {stats:?}");
    assert_eq!(stats.client_to_server_bytes, 0, "c2s bytes: {stats:?}");
    up.abort();
    cli.abort();
}
