# Fingerprint delivery and Firefox

## Identity generation

Profiles keep a `fingerprintSeed` alongside their ID. The editor's randomize action generates a new 128-bit seed in the draft, clears old overrides, and selects a coherent device persona. Saving commits the new identity; reopening an unchanged profile keeps it stable. Refresh-on-start uses an additional launch seed independently of the sampling stability mode.

Chromium UA generation uses the selected kernel's major/full version. Generated Client Hints are saved with the UA. An explicit custom UA takes precedence over the OS-version selector.

Editor-generated UA profiles retain `privacy.fingerprint.uaGenerated`. They follow the actual kernel on later launches, including its full version; editing the UA text makes it custom again. Strict mode updates the UA token, brands, full version and full-version list together. A custom UA that contradicts its navigator platform or Client Hints fails configuration validation before Chromium is spawned. The same validator runs before per-tab injection.

Mobile UA generation and runtime construction resolve one device identity. Client Hints persist its device selector and OS release so a saved UA cannot be paired with a second random phone. Unknown model selectors and unsupported model/OS combinations are rejected with an actionable error. The UA's reduced `Android 10; K` token is never used as its real Client Hints model or release.

The imported mobile catalogue is not a verified hardware database. `mobile-device-corrections.json` records sourced corrections; 447 Android records with the repeated, unverified `360 × 592` fallback geometry are excluded from sampling. Existing Android seeds retain their original catalogue device when it remains eligible. A quarantined record can resolve to a different identity; explicitly pinned unknown models must be regenerated. The remaining records still require hardware validation and are not labelled verified by these checks.

Firefox defaults to a Firefox/Gecko UA generated from its actual kernel version. Its random-UA button is disabled. Device identities can still change through the profile seed. Firefox preserves its native absence of Chromium-only APIs such as `navigator.deviceMemory` and Client Hints; it does not receive `window.chrome` from the shared injection script.

## Startup barrier

Both engines launch on `about:blank`. External startup URLs are opened only after document-start injection has been registered and the initial document's identity has been verified. Missing probes, script exceptions, and registration failures are failures. Native-kernel init write failures also stop Chromium startup.

For Chromium, late page/iframe targets finish injection and response setup before resuming. A failed target is closed; when target closure cannot be confirmed, its browser is stopped. Worker evaluation exceptions are inspected instead of being treated as successful protocol calls.

Startup injection or verification failures now reject startup and terminate the browser through its normal lifecycle cleanup. A failed browser is not left running on an error page. Runtime checks only mark targets successful after a valid probe; timeouts and script errors on targets that still exist are failures. The post-navigation pass verifies all current startup tabs without stacking a second injection or automatically reloading an external site. This pass observes the current documents; it does not establish what a site observed before that probe.

On secure Chromium documents the live probe also reads low- and high-entropy Client Hints with a bounded wait. Delivery checks compare brands, mobile, architecture, bitness, model, platform version, full browser version and the full-version list. Missing APIs or failed entropy probes cannot pass a secure-document check. Opaque initial documents preserve native secure-context gating; configuration validation handles identity contradictions before navigation.

The document media-query wrapper replaces individual persona predicates and delegates the complete expression to the native parser, preserving conjunctions, negation, media types and query lists. This is not certification that injected JS metrics and the renderer's CSS media evaluation agree on every kernel. Native CSS, GPU rendering, Canvas/Audio outputs, WebRTC and worker-first-instruction delivery remain separate platform validation gates.

Dedicated workers, shared workers and service workers share one Chromium setup path. Network UA and request interception are configured before evaluation and debugger resume. Existing worker targets participate in the startup barrier. A page becomes available to the extra-startup-tab navigator only after its Fetch setup and debugger resume complete. OOPIF sessions receive the same request/response setup. These ordering contracts have simulated-protocol coverage; native-kernel validation is still required.

Request-header rewrite failures block the paused request instead of retrying with raw headers. Duplicate pause events share one pending operation; session detach cancels it. If both continuation and request blocking fail without a confirmed closed session/request, the host stops the browser. Low-entropy Client Hints are rewritten only when the native request already contains them, preserving secure-context, policy and preflight eligibility. Failed-response events go to the response handler and cannot remain paused in the request handler. Header array ordering does not certify the actual HTTP/2 wire order or a complete TLS/JA3 identity.

When exit coordinates are unavailable, location permission is denied instead of granting access to host coordinates or substituting `(0,0)`. Native WebRTC proxy mode without an exit IP no longer falls back to real ICE.

## Runtime policy changes

Chromium's runtime sweep validates saved website rules and applies video blocking and local-port policies before its fingerprint-cache early return. Disabling video blocking clears its `Network.setBlockedURLs` list. Website lists are handled only by the shared request-stage Fetch handler; they are not also interpreted as CDP URL globs. Updating local-port allowances replaces the document-start registration and changes the existing guard in place; disabling it removes the registration and deactivates the guard without stacking wrappers. Steady policies issue no extra protocol commands.

Page and iframe targets install these policies before debugger resume. Dedicated, shared and service workers receive the same policy before resume and participate in subsequent updates through their flat sessions. Detaching a session invalidates its policy cache so reattachment reapplies it. Command failures and evaluation exceptions are propagated; failed target setup does not resume the target. These are simulated-protocol guarantees, pending native-kernel validation.

Only live policy fields are projected from the saved profile. Editing UA, device, seed or other fingerprint fields does not replace an identity already launched; those changes require a new launch. The port guard is a JavaScript protection layer for the APIs it wraps, not a system firewall. Local pages may load resources on their own origin; other local ports remain protected, including attempts from an external origin to reach the managed start-page server.

## Website access rules

The former per-tab, asynchronous allowlist connections are removed. Access rules and persona headers now use one request-stage Fetch owner. Page, iframe and all three worker sessions arm it before debugger resume. Each new paused request reads the latest saved lists, with compilation cached by the raw lists; updates and removal need neither a polling sweep nor a connection replacement. Redirect destinations are checked again. Already dispatched requests are not revoked retroactively.

Rules match websites, consistent with the editor: `example.com` and `*.example.com` include the domain and its subdomains, while IP literals match exactly. Full HTTP(S) URLs select the host; paths, query strings and schemes are not filters. An explicit port restricts the rule to that effective port, including default ports 80 and 443. Hostnames normalize case, IDNs and trailing dots. Blacklists take priority. Each list supports at most 200 entries; malformed entries and excess entries fail validation instead of being silently discarded. File/resource URL globs are not website rules; the video-blocking switch retains its separate extension patterns.

Invalid rules are rejected before Chromium acquires launch resources. Restricted non-blank runtime targets require the live shared interceptor. Blocked document requests receive a no-store 403 page with a restrictive CSP; other resources fail. Rejected or timed-out fulfillment falls back to request blocking. If blocking also fails without confirmed request/session closure, the browser is stopped through the same lifecycle callback as header-rewrite failures. Duplicate requests share a pending operation and session detach cancels it. Only the actual managed start-page server is exempt; arbitrary localhost ports and external URLs containing a start-page filename are not exempt.

This policy covers HTTP(S) requests delivered by Chromium Fetch interception. It is not an OS firewall and does not claim coverage of browser-process traffic or other protocols. Firefox has no equivalent implementation: launching a restricted profile is rejected before resource acquisition. Adding these restrictions to a running Firefox is reported and stops that browser on its next watch sweep; it is not per-request enforcement. The editor explains the Chromium requirement and website matching semantics.

Protocol reference: [Chromium Fetch definitions](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/domains/Fetch.pdl).

## API contracts and media permissions

Document and worker Client Hints accept iterable hint sequences, reject invalid arguments through rejected promises, preserve receiver checks and return independent dictionaries. Mutating returned brands or version lists cannot modify later responses. Unknown and inherited property names are ignored. Workers use the same metadata fallback as documents. Absent Client Hints and device-memory APIs remain absent in insecure worker and child realms instead of being created by parent-frame synchronization.

Synthetic media enumeration calls the native method first, preserving native errors, document visibility and Permissions Policy decisions. Labels and identifiers are exposed separately for each device kind only when native enumeration exposes that kind; other kinds remain withheld. Host labels and identifiers are not returned by synthetic enumeration. Empty mode returns an empty list and rejects `getUserMedia` with `NotFoundError`; explicit media blocking rejects it with `NotAllowedError`, including when enumeration is configured as real. These settings do not synthesize a working camera or microphone.

Choosing real media enumeration no longer prunes independent speech, battery, Bluetooth or connection policies from the emitted script. Network-information getters retain native receiver validation. These behaviors have VM regression coverage; physical capture devices and native permission dialogs require browser validation.

Contract references:

- [UA Client Hints interface](https://wicg.github.io/ua-client-hints/)
- [Media capture and device exposure](https://www.w3.org/TR/mediacapture-streams/)

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
npm run selftest -- fpidentity
npm run selftest -- fprealms
npm run selftest -- runtimepolicy
npm run selftest -- urlpolicy
npm run selftest -- mobilepersonas
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
