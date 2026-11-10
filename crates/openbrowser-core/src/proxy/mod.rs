pub mod bridge;
pub mod config;
pub mod fail_closed;
pub mod forwarder;
pub mod http;
pub mod pool;
pub mod socks5;
pub mod stream;
pub mod udp;

/// Upper bound for a proxied HTTP header block (client request headers and
/// upstream CONNECT response headers alike). The bound is checked before the
/// header terminator is searched for, so any block that can still grow past
/// this size is rejected without a per-position re-check.
pub const MAX_HEADER_BYTES: usize = 65_536;

pub use bridge::LocalProxyBridge;
pub use config::{ProxyConfig, ProxyProtocol};
pub use fail_closed::FailClosedPolicy;
pub use forwarder::ProxyForwarder;
pub use http::HttpConnectTarget;
pub use pool::{ConcurrencyLimiter, UpstreamTunnelPool};
pub use socks5::{reply_code_name, SocksAddress, SOCKS5_VERSION};
pub use stream::{copy_bidirectional, copy_bidirectional_with_idle_timeout, StreamStats, IDLE_TIMEOUT};
pub use udp::{Socks5UdpAssociate, Socks5UdpPacket};
