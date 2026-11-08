use crate::error::{CoreError, Result};
use crate::proxy::bridge::upstream_socket_addr;
use crate::proxy::config::ProxyConfig;
use crate::proxy::socks5::{
    reply_code_name, SocksAddress, ATYP_DOMAIN, ATYP_IPV4, ATYP_IPV6, AUTH_METHOD_NONE,
    AUTH_METHOD_USER_PASS, CMD_UDP_ASSOCIATE, REP_SUCCEEDED, SOCKS5_AUTH_SUBNEGOTIATION_VERSION,
    SOCKS5_VERSION,
};
use bytes::{BufMut, BytesMut};
use std::net::{IpAddr, SocketAddr};
use std::time::Duration;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpStream, UdpSocket};
use tokio::time::timeout;

/// SOCKS5 UDP request/response packet per RFC 1928 Section 7.
///
/// ```text
/// +----+------+------+----------+----------+----------+
/// |RSV | FRAG | ATYP | DST.ADDR | DST.PORT |   DATA   |
/// +----+------+------+----------+----------+----------+
/// | 2  |  1   |  1   | Variable |    2     | Variable |
/// +----+------+------+----------+----------+----------+
/// ```
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Socks5UdpPacket {
    pub frag: u8,
    pub address: SocksAddress,
    pub port: u16,
    pub data: Vec<u8>,
}

impl Socks5UdpPacket {
    pub fn new(address: SocksAddress, port: u16, data: Vec<u8>) -> Self {
        Self {
            frag: 0,
            address,
            port,
            data,
        }
    }

    /// Append the full datagram (header + payload) to `buf` without
    /// allocating an intermediate Vec.
    pub fn encode_into(&self, buf: &mut BytesMut) -> Result<()> {
        append_udp_header(buf, self.frag, &self.address, self.port)?;
        buf.put_slice(&self.data);
        Ok(())
    }

    pub fn encode(&self) -> Result<Vec<u8>> {
        let mut buf = BytesMut::with_capacity(32 + self.data.len());
        self.encode_into(&mut buf)?;
        Ok(buf.to_vec())
    }

    pub fn decode(buf: &[u8]) -> Result<Self> {
        if buf.len() < 4 {
            return Err(CoreError::Socks5(
                "UDP packet too short for SOCKS5 header (< 4 bytes)".into(),
            ));
        }
        let rsv = u16::from_be_bytes([buf[0], buf[1]]);
        if rsv != 0 {
            return Err(CoreError::Socks5(format!(
                "Invalid reserved field in SOCKS5 UDP header: 0x{:04x}",
                rsv
            )));
        }
        let frag = buf[2];
        if frag != 0 {
            // RFC 1928: fragmentation is at the IP layer; a SOCKS5 UDP relay
            // cannot reassemble fragments, so they must be dropped, not
            // forwarded as if they were complete datagrams.
            return Err(CoreError::Socks5(format!(
                "Fragmented SOCKS5 UDP datagrams are not supported (frag={})",
                frag
            )));
        }

        let mut cursor = std::io::Cursor::new(&buf[3..]);
        let address = SocksAddress::decode(&mut cursor)?;
        let read_offset = 3 + cursor.position() as usize;

        if buf.len() < read_offset + 2 {
            return Err(CoreError::Socks5(
                "UDP packet truncated before destination port".into(),
            ));
        }
        let port = u16::from_be_bytes([buf[read_offset], buf[read_offset + 1]]);
        let data = buf[read_offset + 2..].to_vec();

        Ok(Self {
            frag,
            address,
            port,
            data,
        })
    }
}

/// Append the SOCKS5 UDP header (RSV, frag, address, port) to `buf`.
/// Private send-path primitive: the send site hardcodes frag=0 because the
/// relay rejects fragmented datagrams on decode anyway.
fn append_udp_header(
    buf: &mut BytesMut,
    frag: u8,
    address: &SocksAddress,
    port: u16,
) -> Result<()> {
    buf.put_u16(0x0000); // RSV
    buf.put_u8(frag);
    address.encode(buf)?;
    buf.put_u16(port);
    Ok(())
}

/// Active SOCKS5 UDP ASSOCIATE session managing the TCP control stream and UDP relay socket.
///
/// Per RFC 1928 §7: "A UDP association terminates when the TCP connection that the
/// UDP ASSOCIATE request arrived on terminates."
pub struct Socks5UdpAssociate {
    tcp_control: TcpStream,
    relay_addr: SocketAddr,
    udp_socket: UdpSocket,
}

impl Socks5UdpAssociate {
    /// Establish a UDP ASSOCIATE session with the upstream SOCKS5 proxy.
    /// Bounded to 8s like the bridge dialers; a wedged upstream cannot pin
    /// the caller forever.
    pub async fn associate(
        config: &ProxyConfig,
        client_bnd_addr: Option<SocketAddr>,
    ) -> Result<Self> {
        config.validate()?;
        let upstream_addr = upstream_socket_addr(&config.host, config.port);
        timeout(
            Duration::from_secs(8),
            Self::associate_raw(config, client_bnd_addr),
        )
        .await
        .map_err(|_| {
            CoreError::Proxy(format!(
                "Timed out during SOCKS5 UDP ASSOCIATE with upstream {}",
                upstream_addr
            ))
        })?
    }

    /// Raw UDP ASSOCIATE handshake without local timeout (timeout handled by
    /// the associate wrapper's deadline).
    async fn associate_raw(
        config: &ProxyConfig,
        client_bnd_addr: Option<SocketAddr>,
    ) -> Result<Self> {
        let upstream_addr = upstream_socket_addr(&config.host, config.port);
        let mut stream = TcpStream::connect(&upstream_addr).await.map_err(|e| {
            CoreError::Proxy(format!(
                "Failed to connect TCP control to SOCKS5 upstream {}: {}",
                upstream_addr, e
            ))
        })?;
        stream.set_nodelay(true)?;

        // 1. Initial Greeting
        if config.is_authenticated() {
            stream
                .write_all(&[SOCKS5_VERSION, 1, AUTH_METHOD_USER_PASS])
                .await?;
        } else {
            stream
                .write_all(&[SOCKS5_VERSION, 1, AUTH_METHOD_NONE])
                .await?;
        }

        let mut greeting_resp = [0u8; 2];
        stream
            .read_exact(&mut greeting_resp)
            .await
            .map_err(|e| CoreError::Socks5(format!("Failed to read SOCKS5 greeting: {}", e)))?;

        if greeting_resp[0] != SOCKS5_VERSION {
            return Err(CoreError::Socks5(
                "Invalid SOCKS5 version from upstream".into(),
            ));
        }

        // RFC 1928: the server must pick a method from the offered set (see
        // bridge.rs for the rationale).
        let offered_auth_method = if config.is_authenticated() {
            AUTH_METHOD_USER_PASS
        } else {
            AUTH_METHOD_NONE
        };
        if greeting_resp[1] != offered_auth_method {
            return Err(CoreError::Socks5(format!(
                "Upstream rejected authentication method (selected {} which was not offered)",
                greeting_resp[1]
            )));
        }

        // 2. Authentication if required
        if greeting_resp[1] == AUTH_METHOD_USER_PASS {
            let user = config.username.as_deref().unwrap_or("");
            let pass = config.password.as_deref().unwrap_or("");

            if user.len() > 255 || pass.len() > 255 {
                return Err(CoreError::AuthFailed(
                    "Username or password exceeds 255 bytes".into(),
                ));
            }

            let mut auth_req = Vec::with_capacity(3 + user.len() + pass.len());
            auth_req.push(SOCKS5_AUTH_SUBNEGOTIATION_VERSION);
            auth_req.push(user.len() as u8);
            auth_req.extend_from_slice(user.as_bytes());
            auth_req.push(pass.len() as u8);
            auth_req.extend_from_slice(pass.as_bytes());

            stream.write_all(&auth_req).await?;

            let mut auth_resp = [0u8; 2];
            stream.read_exact(&mut auth_resp).await.map_err(|e| {
                CoreError::AuthFailed(format!("Failed to read SOCKS5 auth reply: {}", e))
            })?;

            if auth_resp[0] != SOCKS5_AUTH_SUBNEGOTIATION_VERSION || auth_resp[1] != 0 {
                return Err(CoreError::AuthFailed("SOCKS5 authentication failed".into()));
            }
        } else if greeting_resp[1] != AUTH_METHOD_NONE {
            return Err(CoreError::Socks5(format!(
                "Upstream rejected authentication method (code: {})",
                greeting_resp[1]
            )));
        }

        // 3. Send CMD_UDP_ASSOCIATE
        let mut req = Vec::with_capacity(32);
        req.push(SOCKS5_VERSION);
        req.push(CMD_UDP_ASSOCIATE);
        req.push(0x00); // Reserved

        if let Some(bnd) = client_bnd_addr {
            match bnd.ip() {
                IpAddr::V4(v4) => {
                    req.push(ATYP_IPV4);
                    req.extend_from_slice(&v4.octets());
                }
                IpAddr::V6(v6) => {
                    req.push(ATYP_IPV6);
                    req.extend_from_slice(&v6.octets());
                }
            }
            req.push((bnd.port() >> 8) as u8);
            req.push((bnd.port() & 0xFF) as u8);
        } else {
            // Default 0.0.0.0:0 when client IP/port is not fixed or known upfront
            req.push(ATYP_IPV4);
            req.extend_from_slice(&[0, 0, 0, 0]);
            req.push(0x00);
            req.push(0x00);
        }

        stream.write_all(&req).await?;

        // 4. Read UDP ASSOCIATE Reply
        let mut head = [0u8; 4];
        stream
            .read_exact(&mut head)
            .await
            .map_err(|e| CoreError::Socks5(format!("Failed to read UDP ASSOCIATE reply: {}", e)))?;

        if head[0] != SOCKS5_VERSION {
            return Err(CoreError::Socks5(
                "Invalid SOCKS5 version in UDP reply".into(),
            ));
        }
        if head[1] != REP_SUCCEEDED {
            return Err(CoreError::Socks5(format!(
                "SOCKS5 UDP ASSOCIATE failed: {} (code {:#04x})",
                reply_code_name(head[1]),
                head[1]
            )));
        }
        if head[2] != 0x00 {
            return Err(CoreError::Socks5(format!(
                "Invalid SOCKS5 reserved byte in UDP reply: expected 0x00, got 0x{:02x}",
                head[2]
            )));
        }

        let relay_ip: IpAddr = match head[3] {
            ATYP_IPV4 => {
                let mut octets = [0u8; 4];
                stream.read_exact(&mut octets).await?;
                let ip = IpAddr::from(octets);
                // RFC 1928 §7: if server returns 0.0.0.0, use the IP address of the TCP connection
                if ip.is_unspecified() {
                    stream.peer_addr()?.ip()
                } else {
                    ip
                }
            }
            ATYP_DOMAIN => {
                let len = stream.read_u8().await? as usize;
                let mut domain_bytes = vec![0u8; len];
                stream.read_exact(&mut domain_bytes).await?;
                let domain = String::from_utf8(domain_bytes)
                    .map_err(|_| CoreError::Socks5("Relay domain is not valid UTF-8".into()))?;
                let candidates = tokio::net::lookup_host(format!("{}:0", domain))
                    .await
                    .map_err(|e| {
                        CoreError::Socks5(format!(
                            "Failed to resolve relay domain {}: {}",
                            domain, e
                        ))
                    })?
                    .collect::<Vec<_>>();
                // Prefer an address on the same family as the TCP control
                // connection: the UDP socket is bound per-family above, so a
                // mismatched choice would fail on send.
                let peer_is_ipv4 = stream
                    .peer_addr()
                    .map(|addr| addr.is_ipv4())
                    .unwrap_or(true);
                let resolved = candidates
                    .iter()
                    .find(|addr| addr.is_ipv4() == peer_is_ipv4)
                    .or_else(|| candidates.first())
                    .copied()
                    .ok_or_else(|| {
                        CoreError::Socks5(format!("Relay domain {} resolved to no IP", domain))
                    })?;
                resolved.ip()
            }
            ATYP_IPV6 => {
                let mut octets = [0u8; 16];
                stream.read_exact(&mut octets).await?;
                let ip = IpAddr::from(octets);
                if ip.is_unspecified() {
                    stream.peer_addr()?.ip()
                } else {
                    ip
                }
            }
            other => {
                return Err(CoreError::Socks5(format!(
                    "Unsupported relay address type: {}",
                    other
                )));
            }
        };

        let mut port_bytes = [0u8; 2];
        stream.read_exact(&mut port_bytes).await?;
        let relay_port = u16::from_be_bytes(port_bytes);
        let relay_addr = SocketAddr::new(relay_ip, relay_port);

        // Bind local UDP socket for relaying. The old 127.0.0.1 bind made the
        // relay unusable against any remote SOCKS5 upstream: a loopback source
        // address is invalid off-host, and the IPv4-only socket could not even
        // send to an IPv6 relay.
        let udp_bind: &str = if relay_addr.is_ipv4() {
            "0.0.0.0:0"
        } else {
            "[::]:0"
        };
        let udp_socket = UdpSocket::bind(udp_bind).await?;

        Ok(Self {
            tcp_control: stream,
            relay_addr,
            udp_socket,
        })
    }

    /// Send a UDP datagram to target via the upstream SOCKS5 relay.
    /// One buffer holds header + payload for a single send_to; the send path
    /// bypasses Socks5UdpPacket entirely, so no target clone and no payload
    /// Vec copy happen per datagram.
    pub async fn send_to(
        &self,
        data: &[u8],
        target_addr: &SocksAddress,
        target_port: u16,
    ) -> Result<usize> {
        let mut buf = BytesMut::with_capacity(32 + data.len());
        append_udp_header(&mut buf, 0, target_addr, target_port)?;
        buf.put_slice(data);
        let sent = self.udp_socket.send_to(&buf, self.relay_addr).await?;
        Ok(sent)
    }

    /// Receive a forwarded UDP datagram from the upstream SOCKS5 relay.
    /// The datagram is recv'd straight into the caller's buffer, the header is
    /// decoded in place, and the payload is slid to the front, so the receive
    /// path allocates nothing per datagram (IPv4/IPv6 addresses are Copy; a
    /// Domain relay address still builds its String).
    pub async fn recv_from(&self, buf: &mut [u8]) -> Result<(usize, SocksAddress, u16)> {
        let (n, from_addr) = self.udp_socket.recv_from(buf).await?;
        // Source validation: the sender IP must be the SOCKS5 relay we contacted.
        // Some relays reply from a different ephemeral port on the same host, so the
        // port is NOT part of the check. (The previous condition let a spoofed packet
        // from any IP that merely matched the relay port bypass validation entirely.)
        if from_addr.ip() != self.relay_addr.ip() {
            return Err(CoreError::Socks5(format!(
                "Received UDP packet from unexpected address: expected {}, got {}",
                self.relay_addr, from_addr
            )));
        }

        // In-place header validation over buf[..n], the same rules
        // Socks5UdpPacket::decode applies, minus the payload copy.
        if n < 4 {
            return Err(CoreError::Socks5(
                "UDP packet too short for SOCKS5 header (< 4 bytes)".into(),
            ));
        }
        let rsv = u16::from_be_bytes([buf[0], buf[1]]);
        if rsv != 0 {
            return Err(CoreError::Socks5(format!(
                "Invalid reserved field in SOCKS5 UDP header: 0x{:04x}",
                rsv
            )));
        }
        let frag = buf[2];
        if frag != 0 {
            // RFC 1928: fragmentation is at the IP layer; a SOCKS5 UDP relay
            // cannot reassemble fragments, so they must be dropped, not
            // forwarded as if they were complete datagrams.
            return Err(CoreError::Socks5(format!(
                "Fragmented SOCKS5 UDP datagrams are not supported (frag={})",
                frag
            )));
        }

        let mut cursor = std::io::Cursor::new(&buf[..n]);
        cursor.set_position(3);
        let address = SocksAddress::decode(&mut cursor)?;
        let header_len = cursor.position() as usize;

        if n < header_len + 2 {
            return Err(CoreError::Socks5(
                "UDP packet truncated before destination port".into(),
            ));
        }
        let port = u16::from_be_bytes([buf[header_len], buf[header_len + 1]]);

        // Slide the payload to the front of the caller's buffer; copy_within
        // tolerates source and destination overlapping.
        let payload_len = n - header_len - 2;
        buf.copy_within(header_len + 2..n, 0);

        Ok((payload_len, address, port))
    }

    pub fn relay_addr(&self) -> SocketAddr {
        self.relay_addr
    }

    /// Check if the TCP control connection is still alive.
    pub fn is_control_alive(&self) -> bool {
        let mut buf = [0u8; 1];
        match self.tcp_control.try_read(&mut buf) {
            Ok(0) => false, // EOF -> TCP control dropped
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => true,
            _ => false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::{Ipv4Addr, Ipv6Addr};

    #[test]
    fn test_udp_packet_encode_decode_ipv4() {
        let target = SocksAddress::Ipv4(Ipv4Addr::new(8, 8, 8, 8));
        let payload = b"ping test payload".to_vec();
        let packet = Socks5UdpPacket::new(target.clone(), 53, payload.clone());

        let encoded = packet.encode().expect("encode must succeed");
        assert_eq!(encoded[0], 0x00);
        assert_eq!(encoded[1], 0x00);
        assert_eq!(encoded[2], 0x00); // frag
        assert_eq!(encoded[3], ATYP_IPV4);

        let decoded = Socks5UdpPacket::decode(&encoded).expect("decode must succeed");
        assert_eq!(decoded.frag, 0);
        assert_eq!(decoded.address, target);
        assert_eq!(decoded.port, 53);
        assert_eq!(decoded.data, payload);
    }

    #[test]
    fn test_udp_packet_encode_decode_domain() {
        let target = SocksAddress::Domain("dns.google".into());
        let payload = b"\x01\x02\x03\x04".to_vec();
        let packet = Socks5UdpPacket::new(target.clone(), 853, payload.clone());

        let encoded = packet.encode().expect("encode must succeed");
        assert_eq!(encoded[3], ATYP_DOMAIN);

        let decoded = Socks5UdpPacket::decode(&encoded).expect("decode must succeed");
        assert_eq!(decoded.address, target);
        assert_eq!(decoded.port, 853);
        assert_eq!(decoded.data, payload);
    }

    #[test]
    fn test_udp_packet_encode_decode_ipv6() {
        let target = SocksAddress::Ipv6(Ipv6Addr::new(0x2001, 0x4860, 0x4860, 0, 0, 0, 0, 0x8888));
        let payload = b"ipv6 payload".to_vec();
        let packet = Socks5UdpPacket::new(target.clone(), 53, payload.clone());

        let encoded = packet.encode().expect("encode must succeed");
        assert_eq!(encoded[3], ATYP_IPV6);

        let decoded = Socks5UdpPacket::decode(&encoded).expect("decode must succeed");
        assert_eq!(decoded.address, target);
        assert_eq!(decoded.port, 53);
        assert_eq!(decoded.data, payload);
    }

    #[test]
    fn test_udp_packet_truncated_rejections() {
        // Less than 4 bytes
        assert!(Socks5UdpPacket::decode(&[0, 0, 0]).is_err());

        // Invalid RSV
        assert!(Socks5UdpPacket::decode(&[0, 1, 0, 1, 1, 1, 1, 1, 0, 53]).is_err());

        // Truncated IPv4
        assert!(Socks5UdpPacket::decode(&[0, 0, 0, 1, 1, 1]).is_err());

        // Truncated Port
        assert!(Socks5UdpPacket::decode(&[0, 0, 0, 1, 127, 0, 0, 1, 0]).is_err());
    }
}
