use crate::error::{CoreError, Result};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HttpConnectTarget {
    pub host: String,
    pub port: u16,
}

impl HttpConnectTarget {
    /// Parse "CONNECT host:port HTTP/1.1" request line
    pub fn parse(target_str: &str) -> Result<Self> {
        let trimmed = target_str.trim();
        if trimmed.is_empty() {
            return Err(CoreError::Http("Empty CONNECT target".into()));
        }
        if !trimmed.contains(':') {
            return Err(CoreError::Http(format!(
                "CONNECT target must include port: {}",
                target_str
            )));
        }
        Self::parse_authority(trimmed, 0)
    }

    /// Parse HTTP target from URI and raw headers.
    /// Supports:
    /// - Absolute URI: "http://host[:port]/path", "https://host[:port]/path"
    /// - Authority: "host:port" (CONNECT style)
    /// - Relative path: "/path" with "Host: host[:port]" header
    pub fn parse_http_target(uri_or_target: &str, raw_headers: &str) -> Result<Self> {
        let uri = uri_or_target.trim();
        if uri.is_empty() {
            return Err(CoreError::Http("Empty HTTP target URI".into()));
        }

        // Case 1: Absolute URI starting with http:// or https://
        // Byte-level prefix compare: a lowered String per request (old form)
        // paid one heap allocation on every parsed target.
        let uri_bytes = uri.as_bytes();
        let ci_prefix = |prefix: &[u8]| {
            uri_bytes.len() >= prefix.len()
                && uri_bytes[..prefix.len()].eq_ignore_ascii_case(prefix)
        };
        if ci_prefix(b"http://") || ci_prefix(b"https://") {
            let is_https = ci_prefix(b"https://");
            let after_scheme = if is_https { &uri[8..] } else { &uri[7..] };
            let authority = match after_scheme.find(['/', '?', '#']) {
                Some(idx) => &after_scheme[..idx],
                None => after_scheme,
            };
            return Self::parse_authority(authority, if is_https { 443 } else { 80 });
        }

        // Case 2: Relative path starting with '/'
        if uri.starts_with('/') {
            if let Some(host_val) = find_host_header(raw_headers) {
                return Self::parse_authority(host_val, 80);
            }
            return Err(CoreError::Http(format!(
                "Relative request '{}' lacks a valid Host header",
                uri
            )));
        }

        // Case 3: Authority form with colon (e.g. "example.com:443" or "example.com:80")
        if uri.contains(':') && !uri.starts_with('/') {
            return Self::parse(uri);
        }

        // Case 4: Search Host header as fallback
        if let Some(host_val) = find_host_header(raw_headers) {
            return Self::parse_authority(host_val, 80);
        }

        // Case 5: Bare hostname without slash
        if !uri.is_empty() && !uri.contains('/') {
            return Self::parse_authority(uri, 80);
        }

        Err(CoreError::Http(format!(
            "Unable to parse HTTP target from '{}'",
            uri
        )))
    }

    /// Parse "host[:port]" or "[ipv6][:port]" with a fallback default port
    pub fn parse_authority(authority: &str, default_port: u16) -> Result<Self> {
        let auth = authority.trim();
        if auth.is_empty() {
            return Err(CoreError::Http("Empty authority in target".into()));
        }

        // Reject userinfo in authority
        if auth.contains('@') {
            return Err(CoreError::Http(format!(
                "Userinfo not allowed in authority: {}",
                auth
            )));
        }

        // Reject path, query, or fragment in authority
        if auth.find(['/', '?', '#']).is_some() {
            return Err(CoreError::Http(format!(
                "Path or query not allowed in authority: {}",
                auth
            )));
        }

        let (host, port) = if auth.starts_with('[') {
            // IPv6 address: "[ipv6]" or "[ipv6]:port"
            let close_idx = auth.find(']').ok_or_else(|| {
                CoreError::Http(format!("Unclosed IPv6 bracket in authority: {}", auth))
            })?;
            let inner = &auth[1..close_idx];
            if inner.is_empty() || inner.contains('[') || inner.contains(']') {
                return Err(CoreError::Http(format!(
                    "Malformed IPv6 brackets in authority: {}",
                    auth
                )));
            }
            let remainder = &auth[close_idx + 1..];
            let port = if remainder.is_empty() {
                default_port
            } else if let Some(stripped) = remainder.strip_prefix(':') {
                stripped.parse::<u16>().map_err(|_| {
                    CoreError::Http(format!("Invalid port in IPv6 authority: {}", remainder))
                })?
            } else {
                return Err(CoreError::Http(format!(
                    "Invalid characters after IPv6 bracket in authority: {}",
                    auth
                )));
            };
            (inner.to_string(), port)
        } else {
            // Hostname or IPv4
            if auth.contains('[') || auth.contains(']') {
                return Err(CoreError::Http(format!(
                    "Invalid bracket placement in authority: {}",
                    auth
                )));
            }
            if let Some((host_part, port_str)) = auth.rsplit_once(':') {
                // A host part that still contains ':' is a bare IPv6 address
                // like "::1": rsplit_once would happily split it into host ":"
                // and port 1, routing the session to a garbage target. IPv6
                // must arrive bracketed.
                if host_part.contains(':') {
                    return Err(CoreError::Http(format!(
                        "Bare IPv6 authority must use brackets: {}",
                        auth
                    )));
                }
                let port = port_str.parse::<u16>().map_err(|_| {
                    CoreError::Http(format!("Invalid port in authority: {}", port_str))
                })?;
                (host_part.trim().to_string(), port)
            } else {
                (auth.to_string(), default_port)
            }
        };

        if host.is_empty() {
            return Err(CoreError::Http(format!(
                "Empty host in authority: {}",
                auth
            )));
        }
        if host.chars().any(|c| c.is_control() || c.is_whitespace()) {
            return Err(CoreError::Http(format!(
                "Host contains whitespace or control characters: {}",
                host
            )));
        }
        if port == 0 {
            return Err(CoreError::Http("Target port must not be 0".into()));
        }

        Ok(Self { host, port })
    }
}

/// Single-pass Host header lookup over raw header lines: returns the trimmed
/// value of the first non-empty Host header, without allocating a lowercase
/// copy of every line.
fn find_host_header(raw_headers: &str) -> Option<&str> {
    for line in raw_headers.lines() {
        let trimmed = line.trim();
        // Header names are case-insensitive (RFC 9110 §5.1); a match on the
        // 5 ASCII bytes proves index 5 is a char boundary, so [5..] is safe.
        if trimmed
            .as_bytes()
            .get(..5)
            .is_some_and(|name| name.eq_ignore_ascii_case(b"Host:"))
        {
            let value = trimmed[5..].trim();
            if !value.is_empty() {
                return Some(value);
            }
        }
    }
    None
}

/// Helper to generate Basic Proxy-Authorization header
pub fn basic_auth_header(username: &str, password: &str) -> String {
    let combined = format!("{}:{}", username, password);
    const STANDARD: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let input = combined.as_bytes();
    let mut out = String::with_capacity(input.len().div_ceil(3) * 4);
    for chunk in input.chunks(3) {
        let b0 = chunk[0];
        let b1 = if chunk.len() > 1 { chunk[1] } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] } else { 0 };

        out.push(STANDARD[(b0 >> 2) as usize] as char);
        out.push(STANDARD[(((b0 & 0x03) << 4) | (b1 >> 4)) as usize] as char);
        if chunk.len() > 1 {
            out.push(STANDARD[(((b1 & 0x0F) << 2) | (b2 >> 6)) as usize] as char);
        } else {
            out.push('=');
        }
        if chunk.len() > 2 {
            out.push(STANDARD[(b2 & 0x3F) as usize] as char);
        } else {
            out.push('=');
        }
    }
    format!("Basic {}", out)
}

/// Extracts the origin path (path + optional query, e.g. "/api/v1?id=1") from a target string or absolute URI.
/// Defaults to "/" if no path is present.
pub fn extract_origin_path(uri: &str) -> String {
    let trimmed = uri.trim();
    if trimmed.starts_with('/') {
        return trimmed.to_string();
    }
    let trimmed_bytes = trimmed.as_bytes();
    let ci_prefix = |prefix: &[u8]| {
        trimmed_bytes.len() >= prefix.len()
            && trimmed_bytes[..prefix.len()].eq_ignore_ascii_case(prefix)
    };
    if ci_prefix(b"http://") || ci_prefix(b"https://") {
        let after_scheme = if ci_prefix(b"https://") {
            &trimmed[8..]
        } else {
            &trimmed[7..]
        };
        // Whichever of '/' or '?' comes first terminates the authority: the
        // old '/'-first scan mis-parsed `http://host?next=/a` into "/a".
        match after_scheme.find(['/', '?']) {
            Some(idx) if after_scheme.as_bytes()[idx] == b'/' => {
                return after_scheme[idx..].to_string();
            }
            Some(idx) => return format!("/{}", &after_scheme[idx..]),
            None => return "/".to_string(),
        }
    }
    if trimmed == "*" {
        return "*".to_string();
    }
    if let Some(idx) = trimmed.find('/') {
        trimmed[idx..].to_string()
    } else {
        "/".to_string()
    }
}

/// Rewrite client HTTP request header into standard origin-form for sending to origin server:
/// 1. Request line is converted from `GET http://example.com/path HTTP/1.1` to `GET /path HTTP/1.1`.
/// 2. Proxy-specific headers (Proxy-Authorization, Proxy-Connection, Proxy-Authenticate) are stripped.
/// 3. Proxy-specific and Keep-Alive headers are stripped; Upgrade is kept so
///    WebSocket handshakes survive the origin-form rewrite.
pub fn format_origin_request(header_slice: &[u8], uri_or_target: &str) -> Vec<u8> {
    let header_str = String::from_utf8_lossy(header_slice);
    let mut lines: Vec<&str> = header_str.lines().collect();
    if lines.is_empty() {
        return header_slice.to_vec();
    }
    let first_line = lines.remove(0);
    let parts: Vec<&str> = first_line.split_whitespace().collect();
    if parts.len() < 2 {
        return header_slice.to_vec();
    }
    let method = parts[0];
    let version = if parts.len() >= 3 {
        parts[2]
    } else {
        "HTTP/1.1"
    };
    let origin_path = extract_origin_path(uri_or_target);

    let mut out = String::with_capacity(header_slice.len());
    out.push_str(method);
    out.push(' ');
    out.push_str(&origin_path);
    out.push(' ');
    out.push_str(version);
    out.push_str("\r\n");

    let mut kept_upgrade_connection = false;
    for line in lines {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        // Slice compare instead of a lowered String per line: header lines
        // run through here on every forwarded request.
        let ci_starts_with = |needle: &str| {
            trimmed.len() >= needle.len()
                && trimmed.as_bytes()[..needle.len()]
                    .eq_ignore_ascii_case(needle.as_bytes())
        };
        // Upgrade stays: the tunnel endpoint is the origin server, and
        // stripping Upgrade while keeping `Connection: Upgrade` broke every
        // ws:// WebSocket handshake over a SOCKS5 upstream.
        if ci_starts_with("proxy-authorization:")
            || ci_starts_with("proxy-connection:")
            || ci_starts_with("proxy-authenticate:")
            || ci_starts_with("keep-alive:")
        {
            continue;
        }
        // Same rationale as the forwarded rewrite: only the first request on a
        // client connection is rewritten to origin-form, so the connection
        // must not be reused past the first response.
        if ci_starts_with("connection:") {
            let lower = trimmed.to_ascii_lowercase();
            if lower.contains("upgrade") {
                kept_upgrade_connection = true;
                out.push_str(trimmed);
                out.push_str("\r\n");
            }
            continue;
        }
        out.push_str(trimmed);
        out.push_str("\r\n");
    }
    if !kept_upgrade_connection {
        out.push_str("Connection: close\r\n");
    }
    out.push_str("\r\n");
    out.into_bytes()
}

/// Rewrite client HTTP request header for forwarding through an upstream HTTP proxy:
/// 1. Keeps absolute-form request line if present (or formats absolute URI from Host if relative).
/// 2. Replaces any existing Proxy-Authorization with our configured upstream Proxy-Authorization.
/// 3. Forces `Proxy-Connection: close` / `Connection: close` (an upgrade
///    handshake keeps its `Connection: Upgrade` header).
pub fn format_forwarded_proxy_request(header_slice: &[u8], auth_header: Option<&str>) -> Vec<u8> {
    let header_str = String::from_utf8_lossy(header_slice);
    let mut lines: Vec<&str> = header_str.lines().collect();
    if lines.is_empty() {
        return header_slice.to_vec();
    }
    let first_line = lines.remove(0);
    let parts: Vec<&str> = first_line.split_whitespace().collect();
    let mut out = String::with_capacity(header_slice.len() + 64);

    if parts.len() >= 2 {
        let method = parts[0];
        let uri = parts[1];
        let version = if parts.len() >= 3 {
            parts[2]
        } else {
            "HTTP/1.1"
        };

        if uri.starts_with('/') {
            // Find Host header to build absolute-form request target
            let host_header = lines.iter().find_map(|line| {
                let trimmed = line.trim();
                let is_host = trimmed.len() >= 5
                    && trimmed.as_bytes()[..5].eq_ignore_ascii_case(b"host:");
                if is_host {
                    let val = trimmed[5..].trim();
                    if !val.is_empty() {
                        Some(val)
                    } else {
                        None
                    }
                } else {
                    None
                }
            });

            if let Some(host) = host_header {
                out.push_str(&format!(
                    "{} http://{}{} {}\r\n",
                    method, host, uri, version
                ));
            } else {
                out.push_str(first_line.trim());
                out.push_str("\r\n");
            }
        } else {
            out.push_str(first_line.trim());
            out.push_str("\r\n");
        }
    } else {
        out.push_str(first_line.trim());
        out.push_str("\r\n");
    }

    let mut kept_upgrade_connection = false;
    for line in lines {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let ci_starts_with = |needle: &str| {
            trimmed.len() >= needle.len()
                && trimmed.as_bytes()[..needle.len()]
                    .eq_ignore_ascii_case(needle.as_bytes())
        };
        if ci_starts_with("proxy-authorization:") || ci_starts_with("proxy-connection:") {
            continue;
        }
        // Rewrite client keep-alive into close: the bridge only rewrites the
        // first request of a client connection, so a reused connection would
        // bypass the Proxy-Authorization injection above and the second
        // request would fail with 407. A WebSocket upgrade
        // (`Connection: Upgrade`) must keep its original header.
        if ci_starts_with("connection:") {
            let lower = trimmed.to_ascii_lowercase();
            if lower.contains("upgrade") {
                kept_upgrade_connection = true;
                out.push_str(trimmed);
                out.push_str("\r\n");
            }
            continue;
        }
        out.push_str(trimmed);
        out.push_str("\r\n");
    }

    if let Some(auth) = auth_header {
        out.push_str(&format!("Proxy-Authorization: {}\r\n", auth));
    }
    if !kept_upgrade_connection {
        out.push_str("Connection: close\r\n");
    }
    out.push_str("Proxy-Connection: close\r\n\r\n");
    out.into_bytes()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_connect_target() {
        let t1 = HttpConnectTarget::parse("example.com:443").unwrap();
        assert_eq!(t1.host, "example.com");
        assert_eq!(t1.port, 443);

        let t2 = HttpConnectTarget::parse("[::1]:8443").unwrap();
        assert_eq!(t2.host, "::1");
        assert_eq!(t2.port, 8443);

        assert!(HttpConnectTarget::parse("invalid").is_err());
        assert!(HttpConnectTarget::parse(":443").is_err());
        assert!(HttpConnectTarget::parse("example.com:notaport").is_err());
        assert!(HttpConnectTarget::parse("example.com:0").is_err());
        assert!(HttpConnectTarget::parse("user@example.com:443").is_err());
        assert!(HttpConnectTarget::parse("example.com:443/").is_err());
    }

    #[test]
    fn test_parse_authority_rejections() {
        // Port 0 rejected
        assert!(HttpConnectTarget::parse_authority("example.com:0", 80).is_err());
        assert!(HttpConnectTarget::parse_authority("[::1]:0", 80).is_err());

        // Bare IPv6 must be bracketed: rsplit_once(':') would otherwise accept
        // "::1" as host ":" with port 1 and route the session to a garbage target.
        assert!(HttpConnectTarget::parse_authority("::1", 80).is_err());
        assert!(HttpConnectTarget::parse_authority("::1:8080", 80).is_err());
        assert!(HttpConnectTarget::parse_authority("2001:db8::1", 80).is_err());
        // Bracketed forms still parse.
        let v6 = HttpConnectTarget::parse_authority("[::1]", 80).unwrap();
        assert_eq!(v6.host, "::1");
        assert_eq!(v6.port, 80);
        let v6p = HttpConnectTarget::parse_authority("[2001:db8::1]:8080", 80).unwrap();
        assert_eq!(v6p.host, "2001:db8::1");
        assert_eq!(v6p.port, 8080);

        // Empty host rejected
        assert!(HttpConnectTarget::parse_authority(":80", 80).is_err());
        assert!(HttpConnectTarget::parse_authority("[]:80", 80).is_err());
        assert!(HttpConnectTarget::parse_authority("", 80).is_err());

        // Userinfo in authority rejected
        assert!(HttpConnectTarget::parse_authority("admin:secret@example.com:8080", 80).is_err());

        // Path or query in authority rejected
        assert!(HttpConnectTarget::parse_authority("example.com:8080/index", 80).is_err());
        assert!(HttpConnectTarget::parse_authority("example.com:8080?q=1", 80).is_err());

        // Bad brackets rejected
        assert!(HttpConnectTarget::parse_authority("[::1:80", 80).is_err());
        assert!(HttpConnectTarget::parse_authority("example[com]:80", 80).is_err());
        assert!(HttpConnectTarget::parse_authority("[::1]extra:80", 80).is_err());

        // Whitespace or control rejected
        assert!(HttpConnectTarget::parse_authority("example .com:80", 80).is_err());
        assert!(HttpConnectTarget::parse_authority("example\n.com:80", 80).is_err());
    }

    #[test]
    fn test_parse_http_target_absolute() {
        let t1 = HttpConnectTarget::parse_http_target("http://example.com/api/test", "").unwrap();
        assert_eq!(t1.host, "example.com");
        assert_eq!(t1.port, 80);

        let t2 =
            HttpConnectTarget::parse_http_target("http://example.com:8080/test?q=1", "").unwrap();
        assert_eq!(t2.host, "example.com");
        assert_eq!(t2.port, 8080);

        let t3 = HttpConnectTarget::parse_http_target("https://secure.site:8443/", "").unwrap();
        assert_eq!(t3.host, "secure.site");
        assert_eq!(t3.port, 8443);

        let t4 = HttpConnectTarget::parse_http_target("http://[::1]:9000/info", "").unwrap();
        assert_eq!(t4.host, "::1");
        assert_eq!(t4.port, 9000);
    }

    #[test]
    fn test_parse_http_target_scheme_case_insensitive() {
        // The zero-allocation prefix compare must stay case-insensitive: a
        // lowercase-only byte compare would misroute HTTPS:// targets (the
        // plain-HTTP branch strips 7 bytes instead of 8, corrupting host
        // parsing). Pins the eq_ignore_ascii_case behavior from the hot-path
        // rewrite. Scheme identity is asserted through the default port:
        // https defaults to 443, http to 80.
        let upper_http = HttpConnectTarget::parse_http_target("HTTP://EXAMPLE.COM/x", "").unwrap();
        assert_eq!(upper_http.host, "EXAMPLE.COM");
        assert_eq!(upper_http.port, 80);

        let upper_https = HttpConnectTarget::parse_http_target("HTTPS://SECURE.SITE/", "").unwrap();
        assert_eq!(upper_https.host, "SECURE.SITE");
        assert_eq!(upper_https.port, 443);

        let mixed = HttpConnectTarget::parse_http_target("HtTpS://MiXeD.CaSe:9090/p?q=1", "").unwrap();
        assert_eq!(mixed.host, "MiXeD.CaSe");
        assert_eq!(mixed.port, 9090);

        // Truncated/partial prefixes must fall through the scheme branch into
        // the later cases without panicking on slicing. Both hit Case 3
        // (contains ':'), which rejects the trailing path — the key property
        // is a clean error, never a corrupted host from an off-by-one strip.
        assert!(HttpConnectTarget::parse_http_target("http:/", "").is_err());
        assert!(HttpConnectTarget::parse_http_target("https:/x", "").is_err());
    }

    #[test]
    fn test_parse_http_target_relative_with_host() {
        let headers = "GET /index.html HTTP/1.1\r\nHost: myapp.internal:3000\r\nUser-Agent: test";
        let t = HttpConnectTarget::parse_http_target("/index.html", headers).unwrap();
        assert_eq!(t.host, "myapp.internal");
        assert_eq!(t.port, 3000);

        let headers_def = "GET /index.html HTTP/1.1\r\nHost: myapp.internal\r\nUser-Agent: test";
        let t_def = HttpConnectTarget::parse_http_target("/index.html", headers_def).unwrap();
        assert_eq!(t_def.host, "myapp.internal");
        assert_eq!(t_def.port, 80);

        let headers_missing = "GET /index.html HTTP/1.1\r\nUser-Agent: test";
        assert!(HttpConnectTarget::parse_http_target("/index.html", headers_missing).is_err());
    }

    #[test]
    fn test_format_origin_request_and_extract_path() {
        let raw = b"GET http://example.com/api/v1/users?page=2 HTTP/1.1\r\nHost: example.com\r\nProxy-Authorization: Basic bad_token\r\nProxy-Connection: keep-alive\r\nUser-Agent: test-agent\r\n\r\n";
        let formatted = format_origin_request(raw, "http://example.com/api/v1/users?page=2");
        let formatted_str = String::from_utf8(formatted).unwrap();

        assert!(formatted_str.starts_with("GET /api/v1/users?page=2 HTTP/1.1\r\n"));
        assert!(formatted_str.contains("Host: example.com\r\n"));
        assert!(formatted_str.contains("User-Agent: test-agent\r\n"));
        assert!(!formatted_str.contains("Proxy-Authorization"));
        assert!(!formatted_str.contains("Proxy-Connection"));
        assert!(formatted_str.ends_with("\r\n\r\n"));
    }

    #[test]
    fn test_format_forwarded_proxy_request() {
        let raw = b"GET http://example.com/index.html HTTP/1.1\r\nHost: example.com\r\nProxy-Authorization: Basic old_creds\r\nUser-Agent: agent\r\n\r\n";
        let formatted = format_forwarded_proxy_request(raw, Some("Basic new_creds"));
        let formatted_str = String::from_utf8(formatted).unwrap();

        assert!(formatted_str.starts_with("GET http://example.com/index.html HTTP/1.1\r\n"));
        assert!(!formatted_str.contains("old_creds"));
        assert!(formatted_str.contains("Proxy-Authorization: Basic new_creds\r\n"));
        assert!(formatted_str.contains("Proxy-Connection: close\r\n"));
        assert!(formatted_str.contains("Connection: close\r\n"));
        assert!(formatted_str.ends_with("\r\n\r\n"));
    }

    #[test]
    fn test_format_forwarded_proxy_request_relative_rewritten_to_absolute() {
        let raw = b"GET /api/v1/search?q=openbrowser HTTP/1.1\r\nHost: myapp.internal:8080\r\nUser-Agent: agent\r\n\r\n";
        let formatted = format_forwarded_proxy_request(raw, None);
        let formatted_str = String::from_utf8(formatted).unwrap();

        assert!(formatted_str.starts_with(
            "GET http://myapp.internal:8080/api/v1/search?q=openbrowser HTTP/1.1\r\n"
        ));
        assert!(formatted_str.contains("Host: myapp.internal:8080\r\n"));
        assert!(formatted_str.contains("Proxy-Connection: close\r\n"));
        assert!(formatted_str.contains("Connection: close\r\n"));
        assert!(formatted_str.ends_with("\r\n\r\n"));
    }
}
