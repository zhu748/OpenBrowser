use crate::error::{CoreError, Result};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tracing::{error, warn};

/// How long the breaker stays fully closed before a single probe request is
/// allowed through (half-open). Residential proxies frequently answer with a
/// transient 407 while rate limiting, and without a cooldown one such answer
/// used to brick the whole bridge until the profile was restarted.
const BREAKER_COOLDOWN: Duration = Duration::from_secs(30);

/// Fail-Closed security policy:
/// If the configured proxy bridge or upstream cannot be connected or verified,
/// traffic MUST be dropped/rejected. Direct fallback is strictly forbidden.
#[derive(Debug, Clone)]
pub struct FailClosedPolicy {
    /// If true, any failure immediately blocks subsequent requests
    pub strict_block: bool,
    /// When true, direct fallback is never permitted
    pub disallow_direct_fallback: bool,
    /// Circuit breaker state
    tripped: Arc<AtomicBool>,
    tripped_at: Arc<Mutex<Option<Instant>>>,
}

impl Default for FailClosedPolicy {
    fn default() -> Self {
        Self {
            strict_block: true,
            disallow_direct_fallback: true,
            tripped: Arc::new(AtomicBool::new(false)),
            tripped_at: Arc::new(Mutex::new(None)),
        }
    }
}

impl FailClosedPolicy {
    pub fn new(strict: bool) -> Self {
        Self {
            strict_block: strict,
            disallow_direct_fallback: true,
            tripped: Arc::new(AtomicBool::new(false)),
            tripped_at: Arc::new(Mutex::new(None)),
        }
    }

    /// Check if the route is allowed to proceed under the fail-closed policy.
    ///
    /// After the breaker has been tripped for `BREAKER_COOLDOWN`, one probe
    /// connection is admitted in half-open state; a successful tunnel resets
    /// the breaker (`reset`), a failure re-trips it for another cooldown.
    pub fn verify_route(&self, has_proxy: bool) -> Result<()> {
        if !has_proxy && self.disallow_direct_fallback {
            error!("[Fail-Closed] Blocked direct route attempt without verified proxy");
            return Err(CoreError::FailClosed(
                "Direct connection rejected: profile policy requires an active proxy (fail-closed)"
                    .to_string(),
            ));
        }

        if self.tripped.load(Ordering::SeqCst) {
            if self.admit_half_open_probe() {
                warn!("[Fail-Closed] Cooldown elapsed; admitting half-open probe connection");
                return Ok(());
            }
            error!("[Fail-Closed] Circuit breaker is tripped; blocking connection");
            return Err(CoreError::FailClosed(
                "Proxy circuit breaker tripped: upstream is unreachable or unauthenticated"
                    .to_string(),
            ));
        }

        Ok(())
    }

    /// Trip the circuit breaker on critical security or transport violation.
    pub fn trip(&self, reason: &str) {
        warn!("[Fail-Closed] Tripping circuit breaker: {}", reason);
        self.tripped.store(true, Ordering::SeqCst);
        if let Ok(mut slot) = self.tripped_at.lock() {
            *slot = Some(Instant::now());
        }
    }

    /// Reset circuit breaker (e.g. after health check succeeds).
    pub fn reset(&self) {
        self.tripped.store(false, Ordering::SeqCst);
        if let Ok(mut slot) = self.tripped_at.lock() {
            *slot = None;
        }
    }

    pub fn is_tripped(&self) -> bool {
        self.tripped.load(Ordering::SeqCst)
    }

    /// Decide whether this caller is the single half-open probe. The probe is
    /// granted when the cooldown has elapsed, and the timestamp is refreshed
    /// so later callers keep failing until the probe's tunnel resolves the
    /// breaker one way or the other.
    fn admit_half_open_probe(&self) -> bool {
        let Ok(mut slot) = self.tripped_at.lock() else {
            return false;
        };
        match *slot {
            Some(at) if at.elapsed() >= BREAKER_COOLDOWN => {
                *slot = Some(Instant::now());
                true
            }
            _ => false,
        }
    }
}
