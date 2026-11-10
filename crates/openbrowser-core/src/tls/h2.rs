use bytes::{BufMut, BytesMut};
use serde::{Deserialize, Serialize};

/// HTTP/2 Settings Identifier (RFC 7540)
pub const SETTINGS_HEADER_TABLE_SIZE: u16 = 0x01;
pub const SETTINGS_ENABLE_PUSH: u16 = 0x02;
pub const SETTINGS_MAX_CONCURRENT_STREAMS: u16 = 0x03;
pub const SETTINGS_INITIAL_WINDOW_SIZE: u16 = 0x04;
pub const SETTINGS_MAX_FRAME_SIZE: u16 = 0x05;
pub const SETTINGS_MAX_HEADER_LIST_SIZE: u16 = 0x06;

/// Chrome HTTP/2 Fingerprint representation (Akamai format)
/// Example: "1:65536,2:0,4:6291456,6:262144|15663105|0|m,a,s,p"
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct H2Fingerprint {
    pub settings_raw: String,
    pub window_update: u32,
    pub priority_frames: Vec<String>,
    pub pseudo_headers_order: Vec<String>,
}

impl Default for H2Fingerprint {
    fn default() -> Self {
        Self::chrome()
    }
}

impl H2Fingerprint {
    /// Chrome modern HTTP/2 fingerprint (Chrome 120 - 131)
    pub fn chrome() -> Self {
        Self {
            settings_raw: "1:65536,2:0,4:6291456,6:262144".to_string(),
            window_update: 15663105, // 0xef0001
            priority_frames: vec![
                "3:0:0:201".to_string(),
                "5:0:0:101".to_string(),
                "7:0:0:1".to_string(),
                "9:0:7:1".to_string(),
                "11:0:3:1".to_string(),
            ],
            pseudo_headers_order: vec![
                ":method".to_string(),
                ":authority".to_string(),
                ":scheme".to_string(),
                ":path".to_string(),
            ],
        }
    }

    /// Format H2 fingerprint in Akamai notation: settings|window_update
    pub fn to_akamai_string(&self) -> String {
        format!("{}|{}", self.settings_raw, self.window_update)
    }

    /// Build the binary HTTP/2 SETTINGS frame from `settings_raw` itself
    /// ("id:value,id:value,..."). The old builder hard-coded Chrome's four
    /// settings, so any custom profile serialized one fingerprint but put a
    /// different one on the wire — the exact mismatch anti-bot panels flag.
    /// Malformed entries are skipped (defensive: profiles come from disk);
    /// a payload that cannot fit the 24-bit frame length is an error.
    pub fn build_settings_frame(&self) -> crate::error::Result<Vec<u8>> {
        let parsed: Vec<(u16, u32)> = self
            .settings_raw
            .split(',')
            .filter_map(|entry| {
                let entry = entry.trim();
                let (id, value) = entry.split_once(':')?;
                let id: u16 = id.trim().parse().ok()?;
                let value: u32 = value.trim().parse().ok()?;
                // Identifiers are 0x01..=0xff per RFC 7540; values are 31-bit
                // unsigned. SETTINGS_ENABLE_PUSH only allows 0/1 on the wire.
                if id == 0 || value > 0x7FFF_FFFF {
                    return None;
                }
                if id == SETTINGS_ENABLE_PUSH && value > 1 {
                    return None;
                }
                Some((id, value))
            })
            .collect();
        // Fall back to Chrome's defaults when nothing parsed: an empty frame
        // (length 0) is legal but visibly non-browser.
        let settings: &[(u16, u32)] = if parsed.is_empty() {
            &[
                (SETTINGS_HEADER_TABLE_SIZE, 65536),
                (SETTINGS_ENABLE_PUSH, 0),
                (SETTINGS_INITIAL_WINDOW_SIZE, 6291456),
                (SETTINGS_MAX_HEADER_LIST_SIZE, 262144),
            ]
        } else {
            &parsed
        };

        let payload_len = settings.len() * 6;
        // SETTINGS frame length is a 24-bit field: a settings_raw large enough
        // to push the payload past 16 MiB-1 would wrap the 3-byte prefix and
        // put an inconsistent frame on the wire. A profile is attacker-shaped
        // input (deserialized from disk), so reject instead of truncating.
        if payload_len > 0xFF_FFFF {
            return Err(crate::error::CoreError::Tls(format!(
                "HTTP/2 SETTINGS payload length {} exceeds the 24-bit frame length limit (0xFF_FFFF); settings_raw is malformed",
                payload_len
            )));
        }
        let mut buf = BytesMut::with_capacity(9 + payload_len);
        // Frame header: 9 bytes, 24-bit length prefix.
        buf.put_u8((payload_len >> 16) as u8);
        buf.put_u8((payload_len >> 8) as u8);
        buf.put_u8(payload_len as u8);
        buf.put_u8(0x04); // Type: SETTINGS
        buf.put_u8(0x00); // Flags: none (not ACK)
        buf.put_u32(0); // Stream ID: 0

        for (id, value) in settings {
            buf.put_u16(*id);
            buf.put_u32(*value);
        }

        Ok(buf.to_vec())
    }

    /// Build binary HTTP/2 WINDOW_UPDATE frame
    pub fn build_window_update_frame(&self) -> Vec<u8> {
        let mut buf = BytesMut::with_capacity(13);
        // Frame length: 4 bytes
        buf.put_u8(0);
        buf.put_u8(0);
        buf.put_u8(4);
        buf.put_u8(0x08); // Type: WINDOW_UPDATE
        buf.put_u8(0x00); // Flags
        buf.put_u32(0); // Stream ID 0
        buf.put_u32(self.window_update & 0x7FFFFFFF); // 31-bit window size increment
        buf.to_vec()
    }
}
