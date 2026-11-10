use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TlsProfilePreset {
    Chrome,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TlsProfile {
    pub preset: TlsProfilePreset,
    pub max_version: u16,
    pub ciphers: Vec<u16>,
    pub extensions: Vec<u16>,
    pub supported_groups: Vec<u16>,
    pub alpn: Vec<String>,
    pub enable_grease: bool,
    /// TLS 1.3 requires signature_algorithms (RFC 8446 §4.2.3); the fixture
    /// previously omitted the extension entirely. `#[serde(default)]` keeps
    /// profiles deserialized from disk (written before the field existed)
    /// loading instead of failing.
    #[serde(default)]
    pub signature_algorithms: Vec<u16>,
}

impl Default for TlsProfile {
    fn default() -> Self {
        Self::chrome()
    }
}

impl TlsProfile {
    /// Chrome modern profile (Chrome 120 - 131)
    /// Strict Chromium extension order:
    /// server_name -> extended_master_secret -> renegotiation_info -> supported_groups ->
    /// ec_point_formats -> session_ticket -> alpn -> status_request -> signature_algorithms ->
    /// key_share -> psk_key_exchange_modes -> supported_versions -> signed_certificate_timestamp ->
    /// compress_certificate -> application_settings -> padding
    ///
    /// The vectors are the repo's own ground truth (tests/boundary_hardening.rs
    /// FoxIO vector, incl. the GREASE-tolerant 15-cipher / 16-extension form);
    /// the JA4 that falls out of them is t13d1516h2_8daaf6152771_e5627efa2ab1
    /// — the same numbers real Chrome exposes.
    ///
    /// `min_version` and `permute_extensions` were removed: both were
    /// write-only (never read by the builder, which always emits TLS 1.2+ in
    /// fixed Chromium order), as were the never-constructed `ChromeLegacy` /
    /// `Node` presets. Re-add them together with real behavior if needed.
    pub fn chrome() -> Self {
        Self {
            preset: TlsProfilePreset::Chrome,
            max_version: 0x0304, // TLS 1.3
            ciphers: vec![
                0x1301, // TLS_AES_128_GCM_SHA256
                0x1302, // TLS_AES_256_GCM_SHA384
                0x1303, // TLS_CHACHA20_POLY1305_SHA256
                0xC02B, // ECDHE-ECDSA-AES128-GCM-SHA256
                0xC02F, // ECDHE-RSA-AES128-GCM-SHA256
                0xC02C, // ECDHE-ECDSA-AES256-GCM-SHA384
                0xC030, // ECDHE-RSA-AES256-GCM-SHA384
                0xCCA9, // ECDHE-ECDSA-CHACHA20-POLY1305
                0xCCA8, // ECDHE-RSA-CHACHA20-POLY1305
                0xC013, // ECDHE-RSA-AES128-SHA
                0xC014, // ECDHE-RSA-AES256-SHA
                0x009C, // AES128-GCM-SHA256
                0x009D, // AES256-GCM-SHA384
                0x002F, // AES128-SHA
                0x0035, // AES256-SHA
            ],
            extensions: vec![
                0x0000, // server_name
                0x0017, // extended_master_secret
                0xFF01, // renegotiation_info
                0x000A, // supported_groups
                0x000B, // ec_point_formats
                0x0023, // session_ticket
                0x0010, // alpn
                0x0005, // status_request
                0x000D, // signature_algorithms (TLS 1.3 mandatory, RFC 8446 §4.2.3)
                0x0033, // key_share
                0x002D, // psk_key_exchange_modes
                0x002B, // supported_versions
                0x0012, // signed_certificate_timestamp
                0x001B, // compress_certificate
                0x4469, // application_settings (ALPS)
                0x0015, // padding (watch openbrowser extension-order)
            ],
            supported_groups: vec![
                0x001D, // X25519
                0x0017, // secp256r1
                0x0018, // secp384r1
            ],
            alpn: vec!["h2".to_string(), "http/1.1".to_string()],
            enable_grease: true,
            signature_algorithms: vec![
                0x0403, // ecdsa_secp256r1_sha256
                0x0804, // rsa_pss_rsae_sha256
                0x0401, // ecdsa_secp256r1_sha1 (Chrome legacy, FoxIO vector order)
                0x0503, // ecdsa_secp384r1_sha384
                0x0805, // rsa_pss_rsae_sha384
                0x0501, // rsa_pkcs1_sha384
                0x0806, // rsa_pss_rsae_sha512
                0x0601, // rsa_pkcs1_sha512
            ],
        }
    }
}
