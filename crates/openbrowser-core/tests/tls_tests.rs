use openbrowser_core::tls::{
    compute_ja3, get_random_grease, is_grease, ClientHelloBuilder, H2Fingerprint, TlsProfile,
    GREASE_TABLE,
};

#[test]
fn test_chromium_extension_order_strict() {
    let profile = TlsProfile::chrome();
    let builder = ClientHelloBuilder::new(profile).server_name("chromium.org");

    let raw = builder.build().expect("build ClientHello");
    let parsed = ClientHelloBuilder::parse_client_hello(&raw).expect("parse ClientHello");

    // Filter out GREASE extensions to test exact non-GREASE extension ordering
    let non_grease_exts: Vec<u16> = parsed
        .extensions
        .iter()
        .copied()
        .filter(|&e| !is_grease(e))
        .collect();

    let expected_order = vec![
        0x0000, // server_name
        0x0017, // extended_master_secret
        0xFF01, // renegotiation_info
        0x000A, // supported_groups
        0x000B, // ec_point_formats
        0x0023, // session_ticket
        0x0010, // alpn
        0x0005, // status_request
        0x000D, // signature_algorithms (RFC 8446 §4.2.3, mandatory for TLS 1.3)
        0x0033, // key_share
        0x002D, // psk_key_exchange_modes
        0x002B, // supported_versions
        0x0012, // signed_certificate_timestamp
        0x001B, // compress_certificate
        0x4469, // application_settings (ALPS)
        0x0015, // padding (RFC 7685)
    ];

    assert_eq!(
        non_grease_exts, expected_order,
        "Extensions must strictly follow Chromium 120-131 order"
    );
}

#[test]
fn test_grease_symmetric_injection() {
    let mut rng = rand::rng();
    for _ in 0..10 {
        let grease = get_random_grease(&mut rng);
        assert!(GREASE_TABLE.contains(&grease));
        assert!(is_grease(grease));
    }

    let profile = TlsProfile::chrome();
    let builder = ClientHelloBuilder::new(profile).server_name("grease.test");
    let raw = builder.build().expect("build ClientHello");
    let parsed = ClientHelloBuilder::parse_client_hello(&raw).expect("parse ClientHello");

    // Check that exactly 1 GREASE cipher is injected at index 0
    assert!(
        is_grease(parsed.ciphers[0]),
        "First cipher suite must be a GREASE value"
    );
    let grease_cipher_count = parsed.ciphers.iter().filter(|&&c| is_grease(c)).count();
    assert_eq!(grease_cipher_count, 1);

    // Check that exactly 1 GREASE extension is injected at index 0
    assert!(
        is_grease(parsed.extensions[0]),
        "First extension must be a GREASE value"
    );
    let grease_ext_count = parsed.extensions.iter().filter(|&&e| is_grease(e)).count();
    assert_eq!(grease_ext_count, 1);
}

#[test]
fn test_ja3_stability_and_export() {
    let profile = TlsProfile::chrome();
    let builder = ClientHelloBuilder::new(profile.clone()).server_name("mybank.example.com");

    let ja3_a = builder.compute_ja3();
    let ja3_b = builder.compute_ja3();

    assert_eq!(
        ja3_a.hash, ja3_b.hash,
        "JA3 hash must be fully deterministic"
    );
    assert_eq!(ja3_a.raw, ja3_b.raw, "JA3 raw string must match");
    assert_eq!(ja3_a.hash.len(), 32);

    // Verify manual calculation matches
    let manual_ja3 = compute_ja3(
        0x0303,
        &profile.ciphers,
        &profile.extensions,
        &profile.supported_groups,
        &[0x00],
    );
    assert_eq!(ja3_a.hash, manual_ja3.hash);
}

#[test]
fn test_ja4_fingerprint_format_and_export() {
    let profile = TlsProfile::chrome();
    let builder = ClientHelloBuilder::new(profile).server_name("api.github.com");

    let ja4 = builder.compute_ja4();

    // JA4 format: {proto}{ver}{sni}{ciphers}{exts}{alpn}_{cipher_hash}_{ext_hash}
    let parts: Vec<&str> = ja4.formatted.split('_').collect();
    assert_eq!(parts.len(), 3);
    assert_eq!(parts[0].len(), 10);
    assert!(parts[0].starts_with("t13d"));
    assert!(parts[0].ends_with("h2"));
    assert_eq!(parts[1].len(), 12);
    assert_eq!(parts[2].len(), 12);

    // Non-ASCII ALPN: the Part A code is derived from the raw UTF-8 BYTES
    // (FoxIO byte semantics). "\u{ab}" encodes as C2 AB: the first byte 0xC2
    // is not alphanumeric, so the hex path takes its high nibble ("c") and
    // the low nibble of the last byte 0xAB ("b") -> "cb". Likewise
    // "\u{abcd}" (EA AF 8D) -> "ed".
    let non_ascii = openbrowser_core::tls::compute_ja4('t', 0x0303, true, &[], &[], Some("\u{ab}"));
    assert!(non_ascii
        .formatted
        .split('_')
        .next()
        .unwrap()
        .ends_with("cb"));
    let non_ascii2 =
        openbrowser_core::tls::compute_ja4('t', 0x0303, true, &[], &[], Some("\u{abcd}"));
    assert!(non_ascii2
        .formatted
        .split('_')
        .next()
        .unwrap()
        .ends_with("ed"));
}

#[test]
fn test_h2_fingerprint_and_frame_generation() {
    let h2 = H2Fingerprint::chrome();
    let akamai_str = h2.to_akamai_string();

    assert_eq!(akamai_str, "1:65536,2:0,4:6291456,6:262144|15663105");

    let settings_frame = h2.build_settings_frame().expect("settings frame");
    // HTTP/2 Frame format:
    // 3 bytes length + 1 byte type (0x04 = SETTINGS) + 1 byte flags (0x00) + 4 bytes stream ID (0x00000000)
    assert!(settings_frame.len() >= 9);
    assert_eq!(
        settings_frame[3], 0x04,
        "Frame type must be SETTINGS (0x04)"
    );
    assert_eq!(settings_frame[4], 0x00, "Flags must be 0x00 (not ACK)");

    let window_update_frame = h2.build_window_update_frame();
    // WINDOW_UPDATE: 3 bytes length (4) + 1 byte type (0x08) + 1 byte flags (0x00) + 4 bytes stream ID (0x00000000) + 4 bytes increment
    assert_eq!(window_update_frame.len(), 13);
    assert_eq!(
        window_update_frame[3], 0x08,
        "Frame type must be WINDOW_UPDATE (0x08)"
    );

    let increment = u32::from_be_bytes([
        window_update_frame[9],
        window_update_frame[10],
        window_update_frame[11],
        window_update_frame[12],
    ]);
    assert_eq!(
        increment, 15663105,
        "WINDOW_UPDATE increment must be 15663105"
    );
}

/// The Chrome preset's fingerprints must equal the repo's own ground truth:
/// the FoxIO vector in tests/boundary_hardening.rs (15 ciphers, 16 extensions
/// incl. sig_algs/SCT/padding, sig_algs with GREASE 0x2A2A). Until this test
/// existed the preset shipped a 13-extension ClientHello with no
/// signature_algorithms and a JA4 whose Part C silently dropped the _sig
/// suffix — two different fingerprints where a browser (and this repo's
/// boundary test) show one.
#[test]
fn test_chrome_profile_matches_boundary_hardening_ground_truth() {
    use openbrowser_core::tls::compute_ja4_with_signatures;

    let profile = TlsProfile::chrome();

    // The boundary_hardening vector includes a GREASE cipher (0x0A0A) and a
    // GREASE sig algorithm (0x2A2A) which MUST be ignored; feed them here so
    // this test is exactly the vector, not a near-miss of it.
    let mut ciphers = profile.ciphers.clone();
    ciphers.push(0x0A0A);

    let mut sig_algs = profile.signature_algorithms.clone();
    sig_algs.push(0x2A2A);

    let ja3 = ClientHelloBuilder::new(profile.clone())
        .server_name("chromium.org")
        .compute_ja3();
    let expected_ja3 = compute_ja3(
        0x0303,
        &ciphers,
        &profile.extensions,
        &profile.supported_groups,
        &[0x00],
    );
    assert_eq!(ja3.hash, expected_ja3.hash, "JA3 must match the vector");

    let ja4 = ClientHelloBuilder::new(profile.clone())
        .server_name("chromium.org")
        .compute_ja4_with_signatures();
    let expected_ja4 = compute_ja4_with_signatures(
        't',
        0x0304,
        true,
        &ciphers,
        &profile.extensions,
        Some(&sig_algs),
        Some("h2"),
    );
    // Exact expected strings from the boundary_hardening vector.
    assert_eq!(
        ja4.formatted, "t13d1516h2_8daaf6152771_e5627efa2ab1",
        "Chrome-preset JA4 (with signatures) must equal the FoxIO vector"
    );
    assert_eq!(ja4.formatted, expected_ja4.formatted);
    // Part A sanity: 15 ciphers and 16 extensions on the wire.
    assert!(ja4.formatted.starts_with("t13d1516h2"));

    // The signature-less variant must differ in Part C: that is the proof
    // the _sig suffix is really flowing through the fixture path now.
    let ja4_no_sig = ClientHelloBuilder::new(profile).server_name("chromium.org").compute_ja4();
    assert_ne!(ja4.formatted, ja4_no_sig.formatted);
}

/// Profiles deserialize from disk; the signature_algorithms field post-dates
/// existing serialized profiles, so a JSON document without the key must keep
/// loading (empty vec = extension simply not emitted).
#[test]
fn test_tls_profile_deserializes_without_signature_algorithms() {
    let json = r#"{
        "preset": "chrome",
        "max_version": 772,
        "ciphers": [4865],
        "extensions": [0],
        "supported_groups": [29],
        "alpn": ["h2", "http/1.1"],
        "enable_grease": true
    }"#;
    let profile: TlsProfile = serde_json::from_str(json).expect("legacy profile must deserialize");
    assert!(profile.signature_algorithms.is_empty());

    // And a round-trip of the full profile keeps the field.
    let chrome = TlsProfile::chrome();
    let round: TlsProfile = serde_json::from_str(&serde_json::to_string(&chrome).unwrap()).unwrap();
    assert_eq!(round, chrome);
}
