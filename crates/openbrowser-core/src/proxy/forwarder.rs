use crate::error::Result;
use crate::proxy::fail_closed::FailClosedPolicy;
use crate::proxy::stream::StreamStats;
use std::net::SocketAddr;

/// Native async-in-trait (Rust 1.75+): this trait is only used as a generic
/// bound, never as a `dyn` object, so no `async_trait` boxing is needed. The
/// `impl Future + Send` form (instead of `async fn`) states the Send bound
/// explicitly, which is what callers spanning the tokio runtime require.
pub trait ProxyForwarder: Send + Sync {
    /// Start listening on local loopback and forward connections to upstream proxy
    fn start(&self) -> impl std::future::Future<Output = Result<SocketAddr>> + Send;

    /// Retrieve local listening address
    fn local_addr(&self) -> Option<SocketAddr>;

    /// Current fail-closed policy
    fn fail_closed_policy(&self) -> &FailClosedPolicy;

    /// Terminate listener and abort all active connections
    fn stop(&self) -> impl std::future::Future<Output = Result<()>> + Send;

    /// Retrieve cumulative streaming stats
    fn stats(&self) -> StreamStats;
}
