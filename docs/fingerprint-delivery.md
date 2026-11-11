# Fingerprint delivery and Firefox

## Identity generation

Profiles keep a `fingerprintSeed` alongside their ID. The editor's randomize action generates a new 128-bit seed in the draft, clears old overrides, and selects a coherent device persona. Saving commits the new identity; reopening an unchanged profile keeps it stable. Refresh-on-start uses an additional launch seed independently of the sampling stability mode.

Chromium UA generation uses the selected kernel's major/full version. Generated Client Hints are saved with the UA. An explicit custom UA takes precedence over the OS-version selector.

Firefox defaults to a Firefox/Gecko UA generated from its actual kernel version. Its random-UA button is disabled. Device identities can still change through the profile seed. Firefox preserves its native absence of Chromium-only APIs such as `navigator.deviceMemory` and Client Hints; it does not receive `window.chrome` from the shared injection script.

## Startup barrier

Both engines launch on `about:blank`. External startup URLs are opened only after document-start injection has been registered and the initial document's identity has been verified. Missing probes, script exceptions, and registration failures are failures. Native-kernel init write failures also stop Chromium startup.

For Chromium, late page/iframe targets finish injection and response setup before resuming. A failed target is closed; when target closure cannot be confirmed, its browser is stopped. Worker evaluation exceptions are inspected instead of being treated as successful protocol calls.

Startup injection or verification failures now reject startup and terminate the browser through its normal lifecycle cleanup. A failed browser is not left running on an error page. Runtime checks only mark targets successful after a valid probe; timeouts and script errors on targets that still exist are failures. The post-navigation pass verifies all current startup tabs without stacking a second injection or automatically reloading an external site. This pass observes the current documents; it does not establish what a site observed before that probe.

Dedicated workers, shared workers and service workers share one Chromium setup path. Network UA and request interception are configured before evaluation and debugger resume. Existing worker targets participate in the startup barrier. A page becomes available to the extra-startup-tab navigator only after its Fetch setup and debugger resume complete. OOPIF sessions receive the same request/response setup. These ordering contracts have simulated-protocol coverage; native-kernel validation is still required.

Request-header rewrite failures block the paused request instead of retrying with raw headers. Duplicate pause events share one pending operation; session detach cancels it. If both continuation and request blocking fail without a confirmed closed session/request, the host stops the browser. Low-entropy Client Hints are rewritten only when the native request already contains them, preserving secure-context, policy and preflight eligibility. Failed-response events go to the response handler and cannot remain paused in the request handler. Header array ordering does not certify the actual HTTP/2 wire order or a complete TLS/JA3 identity.

When exit coordinates are unavailable, location permission is denied instead of granting access to host coordinates or substituting `(0,0)`. Native WebRTC proxy mode without an exit IP no longer falls back to real ICE.

## Firefox implementation and limits

Firefox uses its loopback-only Remote Agent with WebDriver BiDi. `script.addPreloadScript` is registered without a sandbox so it runs in the document's main realm before page scripts, including subsequently created frame documents. The initial blank document is patched and probed before target navigation. Supported native emulation commands supplement the shared runtime script; unsupported optional commands are reported. A configured position requires the native geolocation override to succeed.

The BiDi connection is part of the running item's lifecycle and is closed on stop. Unexpected disconnects stop the managed browser.
Repeated opens share a single BiDi socket. Firefox liveness checks use BiDi and do not invoke the Chromium runtime-injection sweep.

| Surface | Firefox status |
|---|---|
| UA / platform / languages | Native profile prefs plus document injection; UA tracks the selected Firefox kernel |
| Hardware concurrency / screen / Canvas / WebGL / Audio / ClientRects | Shared document-start injection on APIs the browser exposes |
| Device memory / Client Hints / Chrome namespace | Preserve Firefox's native API shape; no fabricated Chromium interface |
| Timezone | BiDi override where supported, runtime fallback, and process timezone on non-Windows hosts |
| Worker realms | Best-effort injection on `script.realmCreated`; execution before the worker's first instruction is **not guaranteed** |
| CDP automation / extension hot loading | Remain unsupported on Firefox |

`fingerprintDelivery` and `fingerprintVerification` describe document delivery. `workerFingerprintDelivery` remains false. A successful document probe does not certify every worker, rendering backend, font asset, or network fingerprint.

Official protocol references:

- [Firefox BiDi connection](https://developer.mozilla.org/en-US/docs/Web/WebDriver/How_to/Create_BiDi_connection)
- [BiDi script module and document preload scripts](https://developer.mozilla.org/en-US/docs/Web/WebDriver/Reference/BiDi/Modules/script)

## Session restoration

Native automatic restore can execute old tabs before the injection barrier. It is disabled. Managed sessions save up to 100 URLs in `OpenBrowserSession.json` and reopen them after verification. Back/forward history, scroll position and unsaved page state are not restored by this URL snapshot.

On the first restore-mode launch without a managed snapshot, existing native session files are copied once to `OpenBrowserLegacySessions/<engine>/` before the browser starts. They are preserved for recovery; they are not parsed into the managed URL snapshot. That first launch uses the configured startup URLs. The archive is not overwritten on later launches.

## Validation

From `Browserapp/`:

```sh
npm run selftest -- fpreliability
npm run selftest -- fpdeliveryboundaries
npm run selftest:firefoxstart
```

The reliability suite uses actual configuration/build/injection functions, VM document execution, fault-injected CDP calls, deferred-session files and an in-memory BiDi transport. The Firefox launch suite runs the actual process lifecycle with a stub executable and simulated protocol messages; it is not a native Gecko rendering test. It stubs network discovery and makes no external exit-IP requests.

The delivery-boundary suite exercises duplicate/rejected/hung request handling, strict probes, all three Chromium worker types, page readiness publication and Firefox watcher routing. It also executes the production Chromium startup routine with process/protocol fixtures to check that injection failures, mismatches and probe exceptions invoke process cleanup before target navigation, while a verified launch still completes. Fixtures do not substitute for the native browser gate below.

Native Firefox verification is a separate gate:

```sh
OPENBROWSER_FIREFOX_BINARY=/absolute/path/to/firefox npm run selftest:firefoxfingerprint
```

That gate checks inline first-script observations, iframe observations and HTTP UA against a local server. Other traffic is routed to an unavailable loopback proxy. Missing Firefox exits with code 2 rather than reporting a passed browser test. Native Windows/macOS/Linux checks, GPU/codec/font compatibility and worker-first-instruction delivery still require platform-specific validation.
