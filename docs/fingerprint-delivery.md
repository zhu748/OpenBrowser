# Fingerprint delivery and Firefox

## Identity generation

Profiles keep a `fingerprintSeed` alongside their ID. The editor's randomize action generates a new 128-bit seed in the draft, clears old overrides, and selects a coherent device persona. Saving commits the new identity; reopening an unchanged profile keeps it stable. Refresh-on-start uses an additional launch seed independently of the sampling stability mode.

Profiles also persist `fingerprintVersion`. Missing versions mean **1**, including old backups and sync records. New profiles created through the API, single/batch creation dialogs, and the tabular importer use **2**. Templates and clones inherit their source version. The editor's randomize action upgrades the draft to version 2; saving commits both the seed and version. Ordinary edits and launches do not upgrade existing identities. Unsupported versions are rejected. API create accepts `fingerprintVersion` or `fingerprint_version`; API sync/import retains version 1 when absent.

Version 2 derives random fields using domain-separated SHA-256 (`seed + field name`), replacing version 1's overlapping seed offsets. Its default hardware path selects one coherent CPU/memory/screen/DPR/GPU template; new single-profile creation no longer pins 12 cores/8 GB over that template. Selection is independent of the host OS, while version 1 retains its historical host gating. Configured identity can be reproduced across hosts, but rendering pixels and usable limits still depend on the kernel, driver and fonts. Reusing a common hardware template is expected; this is not a guarantee of globally unique identities.

Network-information values follow Chromium's exposed bounds and buckets: downlink is 0–10 Mbps in 0.05 Mbps steps; RTT is 0–3000 ms in 50 ms steps. Version 2 corrects the old 10.1 Mbps draw to 10 without changing the seed or other draw slots. This changes that field for affected existing V2 profiles. Version 1 retains its serialized historical draw (the 240 replay fixtures remain unchanged), while document/worker delivery projects it onto the native bound and reports a consistency warning. Both versions' live readings can therefore change from 10.1 to 10 after this correction. Explicit overrides use the same bounds/buckets; null, blanks and booleans are not numeric zero. Delivery verification compares the effective values. These bounds do not make an independently sampled network distribution an empirically calibrated network-quality model.

Custom battery snapshots use one normalizer during profile save/load and fingerprint construction. Zero remains zero. JSON null durations remain unknown/Infinity instead of becoming zero; charging batteries have infinite dischargingTime, discharging batteries have infinite chargingTime, and a fully charged charging battery has chargingTime zero. The editor renders null durations as blank and retains their null representation on save. These are deterministic API snapshots, not a simulation of battery drain or charging events.

Document and worker WebGL wrappers query the actual context before applying persona limits. Maximum capabilities are bounded by native values, uniform-buffer alignment retains the native minimum requirement, typed-array range types are preserved, and native invalid-enum/null/receiver behavior is retained. OS constants are not measurements of GPU capability. These corrections apply to **both** versions: affected live readings change after upgrade even when the saved identity stays version 1. This bounds capability claims without virtualizing the driver or making every operation match a different GPU.

Version 2 iOS templates use `Apple Inc.` / `Apple GPU` instead of a desktop ANGLE wrapper. This does not turn Chromium into WebKit or certify a catalogue device as real hardware. Older iOS identities retain their generation behavior and report the wrapper as a consistency warning. Mobile window metrics preserve native outer-window dimensions and layout-viewport rounding, including pages without a viewport meta tag; screen, layout viewport and visual viewport are distinct quantities.

Legacy seed migration must persist successfully before either engine launches. A failed write blocks startup and keeps the selected seed pending in memory; retries flush that same identity instead of treating an uncommitted seed as saved or drawing another one. Concurrent migrations share one flush. Migration merges only the seed into the latest profile row and rejects a profile deleted or re-seeded during the write.

Chromium UA generation uses the selected kernel's major/full version. Generated Client Hints are saved with the UA. An explicit custom UA takes precedence over the OS-version selector.

Editor-generated UA profiles retain `privacy.fingerprint.uaGenerated`. They follow the actual kernel on later launches, including its full version; editing the UA text makes it custom again. Strict mode updates the UA token, brands, full version and full-version list together. A custom UA that contradicts its navigator platform, Client Hints, or actual Chromium major version fails configuration validation before Chromium is spawned. Regenerating or clearing the UA, or enabling strict mode, repairs a stale major. The same validator runs before per-tab injection. Reduced UA strings may be identical across profiles on the same platform and kernel; the profile identity is not a promise of a unique UA string.

Canvas and WebGL stability use one host policy in documents and workers. Stable mode uses sparse, seeded +/-1 pixel deltas; normal mode retains its -1/0/+1 distribution. Repeated reads of unchanged input keep the same deltas. Stable mode no longer reduces the entire delta distribution to zero. Auto mode resolves amplitude and sample density against the current realm's host instead of reusing the pre-navigation snapshot; prefix exceptions such as `cdn.` have the same meaning in both realms. This correction changes affected stable-mode pixel fingerprints once after upgrading.

Mobile UA generation and runtime construction resolve one device identity. Client Hints persist its device selector and OS release so a saved UA cannot be paired with a second random phone. Unknown model selectors and unsupported model/OS combinations are rejected with an actionable error. The UA's reduced `Android 10; K` token is never used as its real Client Hints model or release.

The imported mobile catalogue is not a verified hardware database. `mobile-device-corrections.json` records sourced corrections; 447 Android records with the repeated, unverified `360 × 592` fallback geometry are excluded from sampling. Existing Android seeds retain their original catalogue device when it remains eligible. A quarantined record can resolve to a different identity; explicitly pinned unknown models must be regenerated. The remaining records still require hardware validation and are not labelled verified by these checks.

Firefox defaults to a Firefox/Gecko UA generated from its actual kernel version. Its random-UA button is disabled. Device identities can still change through the profile seed. Firefox preserves its native absence of Chromium-only APIs such as `navigator.deviceMemory` and Client Hints; it does not receive `window.chrome` from the shared injection script.

## Native API behavior and worker delivery

WebGL enum arguments pass through native WebIDL conversion once, after native receiver validation. Numeric, string, boxed and unsigned-long-wrapped arguments resolve to the same persona metadata in WebGL1/2, documents and workers, including shader precision queries. Context-loss nulls and native invalid-argument errors are retained. Reported shader precision and runtime capability bounds cannot exceed the actual driver.

Rendered AudioBuffer reads and copies also delegate argument validation and unsigned-long conversion to the native method. User conversion hooks run once, invalid destination buffers fail before channel conversion, and explicit samples written through copyToChannel remain exact after subsequent reads. The Blob font gate reads the native Blob type getter only after successful native URL creation; custom type getters and failed arguments gain no extra reads. Object URL revocation converts its argument once across both the font and worker layers.

Worker and SharedWorker constructors proxy the native constructor, retain its prototype and subclass construction, and preserve the original observable WorkerLocation. The Blob font gate uses the same native construction rules; optional CSS bookkeeping does not replay custom Blob iterators, element getters or options getters. Ordinary Function.prototype.toString calls do not access or execute a function's custom toString property. Wrapped callable proxies prevent foreign-realm stringification from exposing those wrapper bodies.

Inline-worker preparation reads immutable local Blob bytes and uses a private Acorn tokenizer/parser to preserve hashbangs and genuine directive prologues. A continued string expression is not split into a directive and a second statement. Module entries receive a first static side-effect import that installs the configured identity before the original static dependencies execute. This retains the native module graph and startup-message delivery rather than delaying user code behind a dynamic import. The entry's import.meta.url and WorkerLocation retain the original URL. This is covered for Blob and data entries; cyclic graphs and arbitrary module loaders still need separate compatibility validation.

Child-worker installation is reconstructed from a private named function, including the font-presence layer. Installation checks and runtime revision checks use the private function bridge rather than public WorkerGlobalScope flags or source-passing hooks. Replaying the complete document source checks completion before its UA layer runs; installation-status messages pass through the UA, font and WebRTC layers. This prevents repeated wrapping when the complete source is executed again.

Chromium 143+ Service Workers additionally use a first-script execution gate, including scripts restored from the persistent script cache. Startup queues Debugger.enable, the beforeScriptExecution breakpoint and Runtime.runIfWaitingForDebugger in protocol order; awaiting Debugger.enable before releasing startup deadlocks on Chrome 157. At the actual script breakpoint, the gate installs and verifies the current UA/platform, core count, timezone and exposed network values before resuming application code, then disables Debugger. The old 400 ms post-resume injection is removed.

Only one session owns this gate per Service Worker target. Browser-level auto-attach owns Service Workers; page/iframe auto-attach filters exclude them before creation. If an extra session is nevertheless announced, it releases its startup latch only after the owner's breakpoint commands have been queued, then detaches through its actual parent after verification. Detaching it earlier can release the worker before the owner's breakpoint exists. The gate recognizes complete historical injection-prefix expressions in cached scripts, including parsed static module dependencies, and retires their exact token/revision checks through the private bridge so an old prefix cannot reinstall the previous persona. It does not clear registrations, cookies, application caches or browsing data. An unrecognized cached prefix, incompatible same-token revision, failed probe or timeout rejects delivery and follows target/browser shutdown. Already-running workers whose first execution cannot be verified are rejected rather than labelled protected. The gate bounds individual source at 16 MiB and a parsed graph at 512 scripts/32 MiB.

Native Chrome 157 on Linux covers classic/module Service Workers at network registration, restart with a changed persona using persisted scripts, static dependency first reads and unprefixed background updates. Windows/macOS kernels, arbitrary module graphs and Firefox still need their separate native validation; these results are not a claim of perfect fingerprint emulation.

Related same-origin documents coordinate rewritten SharedWorker Blob URLs through that private bridge, including iframes and opener chains. Only successful native construction publishes a prepared Blob entry; failed constructors cannot displace a live worker. Entries are retained for the original Blob URL's lifetime rather than evicted at an arbitrary thread count. Prepared Blob resources use the original creator's realm and are revoked with the original URL or a non-BFCache pagehide. A revoked canonical URL is retained for native reconnection to an already-live SharedWorker. Data entries are deterministic and need no document cache. Dedicated module helper URLs are released after a private initialization message, native error or termination; entry URLs are released as soon as the native constructor captures them.

The registry covers participating related same-origin documents; unrelated tabs and URLs created in another agent are not globally coordinated. A pure JavaScript registry does not replace the browser's own global SharedWorker identity store. Retaining many original Blob URLs also retains their prepared mappings until those URLs or their creator are released.

Inline worker preparation deliberately fails with SecurityError when CSP blocks reading the Blob source. Trusted inline script URLs are also rejected when preparation would require bypassing Trusted Types. The runtime creates no permissive Trusted Types policy. This protects identity delivery at the cost of compatibility with those inline-worker configurations; network-worker delivery retains the existing transport. Software rendering, strict-CSP workers and iOS emulation must not be labelled indistinguishable from native hardware or WebKit.

Window metrics retain the native descriptor owner, enumerability, setter and illegal-receiver checks. Native outer-window dimensions replace fixed desktop border estimates. iOS CSS.supports uses the actual CSS parser, so JS queries, declaration acceptance and stylesheet @supports agree; Chromium-only and WebKit-only capabilities still require their real engines.

## Startup barrier

Both engines launch on `about:blank`. External startup URLs are opened only after document-start injection has been registered and the initial document's identity has been verified. Missing probes, script exceptions, and registration failures are failures. Native-kernel init write failures also stop Chromium startup.

Proxy and locale discovery stage their results before publishing to the saved profile. Publication requires the source revision to remain current, including after seed migration and before spawning either engine. An edit, deletion, recreation or restore during preparation stops that launch with `PROFILE_STALE_REV` or `PROFILE_MAINTENANCE`; retry launches the latest configuration. Successful publication includes the resolved locale and exit metadata in the actual persisted map. Forced connectivity guards bypass both the engine's locale cache and the direct-exit lookup cache.

Cleanup is idempotent per running item. Profile-wide helper draining, singleton removal and named IPC cleanup require current generation and directory-lock ownership. A failed lock acquisition and a late callback from an older generation cannot clean a replacement's resources. Unknown helper scans retain the lock and singleton state until an explicit retry confirms exit; there is no synchronous process-kill fallback. Old private connections and proxies still close independently of directory ownership.

For Chromium, late page/iframe targets finish injection and response setup before resuming. A failed target is closed; when target closure cannot be confirmed, its browser is stopped. Worker evaluation exceptions are inspected instead of being treated as successful protocol calls.

Startup injection or verification failures now reject startup and terminate the browser through its normal lifecycle cleanup. A failed browser is not left running on an error page. Runtime checks only mark targets successful after a valid probe; timeouts and script errors on targets that still exist are failures. The post-navigation pass verifies all current startup tabs without stacking a second injection or automatically reloading an external site. This pass observes the current documents; it does not establish what a site observed before that probe.

On secure Chromium documents the live probe also reads low- and high-entropy Client Hints with a bounded wait. Delivery checks compare brands, mobile, architecture, bitness, model, platform version, full browser version and the full-version list. Missing APIs or failed entropy probes cannot pass a secure-document check. Opaque initial documents preserve native secure-context gating; configuration validation handles identity contradictions before navigation.

The document media-query wrapper replaces individual persona predicates and delegates the complete expression to the native parser, preserving conjunctions, negation, media types and query lists. This is not certification that injected JS metrics and the renderer's CSS media evaluation agree on every kernel. Native CSS, GPU rendering, Canvas/Audio outputs, WebRTC and worker-first-instruction delivery remain separate platform validation gates.

Desktop target setup applies native device metrics even for DPR=1, using zero layout dimensions to retain live viewport resizing and explicit persona screen dimensions for CSS device queries. Mobile targets retain pinned device viewports. Metric-command failures reject target setup; they cannot be recorded as successful injection. Subframes inherit top-level metrics instead of receiving top-level-only commands.

Resizing a desktop window changes its viewport but no longer grows the persona's `screen.width`, `screen.height` or available display bounds. Keeping the display fixed also keeps it aligned with the native CSS device metrics. A configured geolocation override, a granted location permission, and mobile touch emulation must succeed natively before document registration; unsupported-command errors cannot silently leave the host location or desktop touch behavior active.

## Registration ownership and recovery

Document registrations and runtime policies are tracked by their actual CDP connection and flat-session identity. Different sessions on the same target have separate registrations. Concurrent applies in one session serialize, and a failed operation does not poison retries. Live registrations are not evicted when the browser exceeds 256 targets. Closing or detaching a session invalidates its state and cancels late/queued setup; an old asynchronous result cannot mark a replacement session successful.

Target setup also has a session cancellation guard around native overrides, Fetch registration, worker evaluation and debugger resume. Detach, destruction, connection closure and late-page injection timeout cancel the remaining setup immediately, even if a protocol command has not returned. Commands already sent cannot be recalled, but their late results cannot issue subsequent commands or republish readiness. A ready flat session lost from a still-live target stops its browser unless another session owns the target; destruction and replacement are rechecked against current targets. Repeated old detach events preserve a verified replacement's readiness.

The initial page path uses a managed persistent WebSocket rather than the idle-evicted command pool or one-command sockets. A blank or debugger-paused target can transfer ownership to the persistent browser flat session: the old page connection is retired before the new native overrides are applied. An active, unpaused document cannot silently transfer ownership. Normal page closure is confirmed against current targets so closing one tab does not stop the other windows; unexpected owner loss on a still-live target stops its browser. Browser cleanup closes both active and still-opening fallback connections.

Fingerprint and port-policy replacement invalidate the previous registration before removing it. If installing the replacement fails, a later request for the original configuration reinstalls its removed script. Policy registrations also follow connection/session ownership, so retiring the initial page session cannot remove the only future-document port guard or cause a flat session to remove another session's identifier.

Chromium implementation reference: [InspectorPageAgent registration state and session disposal](https://chromium.googlesource.com/chromium/src/+/49651c0b5af34684bc1ecd8f0a347187796da1d9/third_party/blink/renderer/core/inspector/inspector_page_agent.cc). The lifecycle guarantees above have fault-injected protocol coverage; native browser handover/navigation tests are still required on supported platforms.

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

Permissions and geolocation now retain their native methods and PermissionStatus objects. The former query wrapper re-read `descriptor.name` after native conversion, so a valid getter could be called twice or turn a successful query into a rejection. The former synthetic deny callbacks also skipped receiver/callback/options validation, returned watch ID zero, did not honor native watch cancellation, and fabricated error dictionaries. Those wrappers are removed; permissions queries, coercion counts, callbacks, watch IDs, error objects and native Permissions-Policy behavior are delegated to the browser. Native permission status and access-policy decisions are compared with an untouched realm rather than assumed to always be the same state.

`geoMode: disabled` implies effective denial even when `geoPermission` is absent or prompt. Allow without valid configured coordinates also remains denied. Chromium must successfully apply Browser.setPermission for both grants and denials before document registration; an unsupported denial command stops setup instead of relying on a JavaScript callback facade.

Firefox writes `geo.enabled=false` for effective denial. Its default-deny permission preference alone does not revoke previously stored site grants; disabling the native feature protects even previously authorized origins and unprepared navigations, with native absence of `navigator.geolocation` as an intentional interface change. Prompt/allow launches explicitly restore the preference to true. Managed HTTP(S) startup origins receive the native BiDi permissions.setPermission grant/deny before navigation; failed setup blocks that navigation and is not cached as success. This does not auto-grant arbitrary redirect destinations, later script-driven origins or cross-origin frames; their native permission behavior is retained. Native position overrides remain required before a configured location can be used.

Storage estimates share one document/child/worker implementation. Native estimate performs receiver and argument validation, so genuine StorageManager objects from another same-origin realm are accepted. The wrapper retains the actual native result dictionary, its realm, property flags, optional-member absence and additional fields. It adjusts only a writable native quota value, never above the quota returned in that call. A persona tier is raised to current reported usage where possible, bounded by native quota; an already overcommitted native result remains native rather than inventing capacity. Native errors propagate. Parent synchronization recognizes an existing same-token patch instead of stacking wrappers.

The reported persona ceiling does not replace the native quota manager or enforce a synthetic disk size. Allocation and persistence behavior remain native.

The former unconditional RAM-based quota could exceed native capacity (the Linux Chrome probe returned about 10 GiB while injection claimed 30 GiB). Corrected live quotas can therefore change on existing identities without changing their saved seed or static generation. Chromium's reported quota also reflects current usage: Service Worker script-cache bytes affect it, so native regression comparisons use remaining space and comparable scopes rather than assuming every realm/profile has identical total quota. The VM quota fixture now owns its class/intrinsics per sandbox instead of patching a shared host Function prototype across profiles.

`MediaRecorder.isTypeSupported`, WebCodecs and RTP capability queries keep their native validation, MIME/codec parsing, function descriptors and complete result dictionaries. An OS-based answer cannot provide missing encoders or remove a codec from actual SDP negotiation. The former codec-matrix hooks are removed; the historical table remains in the generated identity object only for legacy replay compatibility and does not override runtime support. Codec support is consequently an explicit limit of cross-OS emulation. Unsupported legacy OS/browser combinations are rejected by the consistency check, including legacy Windows UAs and macOS releases supplied through Client Hints; reduced macOS UA tokens alone are not treated as an OS version.

Document and worker Client Hints accept iterable hint sequences, reject invalid arguments through rejected promises, preserve receiver checks and return independent dictionaries. Mutating returned brands or version lists cannot modify later responses. Unknown and inherited property names are ignored. Workers use the same metadata fallback as documents. Absent Client Hints and device-memory APIs remain absent in insecure worker and child realms instead of being created by parent-frame synchronization.

Synthetic media enumeration calls the native method first, preserving native errors, document visibility and Permissions Policy decisions. Labels and identifiers are exposed separately for each device kind only when native enumeration exposes that kind; other kinds remain withheld. Host labels and identifiers are not returned by synthetic enumeration. Empty mode returns an empty list and rejects `getUserMedia` with `NotFoundError`; explicit media blocking rejects it with `NotAllowedError`, including when enumeration is configured as real. These settings do not synthesize a working camera or microphone.

Choosing real media enumeration no longer prunes independent speech, battery, Bluetooth or connection policies from the emitted script. Network-information getters retain native receiver validation. These behaviors have VM regression coverage; physical capture devices and native permission dialogs require browser validation.

Document and worker NetworkInformation accessors now share one implementation and configuration. Real mode and absent native members remain untouched; iOS personas omit the API in both scopes. Duplicate injection does not stack the network getters. The live document probe compares exposed connection members with the launched persona so a failed patch cannot silently pass a network-value mismatch.

Same-origin child synchronization installs the network patch before exposing newly accessed blank iframe windows, including nested frames. It also patches existing child windows. Native member absence and receiver exceptions remain intact in each child realm. VM coverage exercises synchronous access; native cross-origin frame delivery remains a browser gate.

Network-condition simulation is separate from `navigator.connection` reporting. Missing latency/throughput inputs remain unset across save/load and editor normalization; explicit zero remains zero. Chromium's top-level sessions receive `-1` for unlimited throughput, and clearing an applied setting restores the default connection. Required network commands must succeed before target resume. Firefox currently has no simulation backend, so an active offline/throttle configuration rejects its launch with `NETWORK_CONDITIONS_UNSUPPORTED` instead of silently ignoring it. This is browser emulation, not an operating-system traffic policy; worker and non-page traffic need separate verification.

Contract references:

- [UA Client Hints interface](https://wicg.github.io/ua-client-hints/)
- [Media capture and device exposure](https://www.w3.org/TR/mediacapture-streams/)

## Firefox implementation and limits

Firefox uses its loopback-only Remote Agent with WebDriver BiDi. `script.addPreloadScript` is registered without a sandbox so it runs in the document's main realm before page scripts, including subsequently created frame documents. The initial blank document is patched and probed before target navigation. Supported native emulation commands supplement the shared runtime script; unsupported optional commands are reported. A configured position requires the native geolocation override to succeed.

Managed startup navigation and top-level context-created events share one native emulation task per context. Each extra startup tab waits for that task before navigating, whether its event arrives before or after the create response. Geolocation uses the same explicit context scope as UA and timezone, with the existing fallback for older kernels that reject context parameters. Required location failures reject startup or propagate through BiDi's fatal event/disconnect path. Child contexts inherit their top-level native overrides and do not receive top-level-only commands. This does not guarantee native emulation before the first script of an independently opened popup; those context events are asynchronous.

The BiDi connection is part of the running item's lifecycle and is closed on stop. Unexpected disconnects stop the managed browser.
Repeated opens share a single BiDi socket. Firefox liveness checks use BiDi and do not invoke the Chromium runtime-injection sweep.

| Surface | Firefox status |
|---|---|
| UA / platform / languages | Native profile prefs plus document injection; UA tracks the selected Firefox kernel |
| Hardware concurrency / screen / Canvas / WebGL / Audio / ClientRects | Shared document-start injection on APIs the browser exposes |
| Device memory / Client Hints / Chrome namespace | Preserve Firefox's native API shape; no fabricated Chromium interface |
| Timezone | BiDi override where supported, runtime fallback, and process timezone on non-Windows hosts |
| Worker realms | Prefs supply UA/platform/languages/timezone; newly fetched HTTP(S) worker scripts routed through the per-profile forwarder receive the JS prefix. Asynchronous realm injection remains best effort |
| CDP automation / extension hot loading | Remain unsupported on Firefox |

`fingerprintDelivery` and `fingerprintVerification` describe document delivery. `workerFingerprintDelivery` is `prefs-fields` after standalone BiDi initialization and `prefs-fields-plus-proxy` only when startup has established the Worker forwarder and imported its CA. This is not a claim of complete worker coverage: blob/data workers, previously cached scripts, static module dependencies and local proxy bypasses are not certified before their first instruction.

Every configured HTTP/HTTPS/SOCKS5 proxy, including unauthenticated proxies, is bridged before the Worker forwarder. Upstream credentials remain at the bridge. Forwarder or CA import failure stops startup before browser spawn. OpenSSL and an NSS `certutil` are required for this Firefox path. Localhost stays outside the forwarder so the managed local start page remains reachable. Normal stop first requests native BiDi `browser.close`; normal stop and failed startup both close the listener and sockets and remove temporary CA files.

The forwarder uses Node's HTTP parser for framing and streams ordinary resources without decoding their content. Worker responses alone are buffered, with separate 16 MiB encoded/decoded limits; gzip, deflate and Brotli are decoded before prefixing. Rewritten responses remove stale validators/digests and use `Cache-Control: no-store`. Native parsing handles close-delimited responses, chunk trailers, HEAD and bodyless statuses. HTTP upgrades remain streamed. TLS interception still uses Node's TLS implementation and does not reproduce a native Gecko TLS/HTTP2 fingerprint.

Network-script injection in both engines preserves the hashbang, original directive prologue and automatic semicolon insertion. It does not wrap the application in a function or repair invalid JavaScript. Chromium rewrites only JavaScript responses classified as worker loads (`Other`), preserving successful 2xx status codes and leaving page scripts, redirects, bodyless/error responses and non-JavaScript resources untouched. Partial Worker scripts are aborted instead of being executed without injection. CSP/CORS and other security headers survive rewriting. The obsolete public `__obPersonaUrl` Blob hook is removed; nested workers use the private closure installer. Duplicate response events share one operation, and target detach or network failure cancels tracking and prevents late fulfillment. Rewrite failures abort the paused request; inability to confirm abort stops the browser. Rewriting does not change static module dependency evaluation order, so arbitrary network-module dependency graphs are not certified by classic-worker first-read checks.

Firefox's production startup and per-host certificate generation use asynchronous OpenSSL calls. Per-profile signing has two concurrent jobs, at most 128 queued hosts and a 128-entry LRU cache; same-host requests share a job. Leaf keys/CSRs are removed after signing, and stop cancels active/queued jobs before removing the CA directory. Synchronous certificate helpers remain only for compatibility fixtures. Client cancellation closes pending CONNECT attempts, and direct socket DNS answers are checked against the existing outbound-address policy before connection. Active uploads retain Node's default request deadline rather than a 30-second total upload cutoff.

Official protocol references:

- [Firefox BiDi connection](https://developer.mozilla.org/en-US/docs/Web/WebDriver/How_to/Create_BiDi_connection)
- [BiDi script module and document preload scripts](https://developer.mozilla.org/en-US/docs/Web/WebDriver/Reference/BiDi/Modules/script)
- [BiDi emulation commands and context scope](https://w3c.github.io/webdriver-bidi/#module-emulation)

## Session restoration

Native automatic restore can execute old tabs before the injection barrier. It is disabled. Managed sessions save up to 100 URLs in `OpenBrowserSession.json` and reopen them after verification. Back/forward history, scroll position and unsaved page state are not restored by this URL snapshot.

On the first restore-mode launch without a managed snapshot, existing native session files are copied once to `OpenBrowserLegacySessions/<engine>/` before the browser starts. They are preserved for recovery; they are not parsed into the managed URL snapshot. That first launch uses the configured startup URLs. The archive is not overwritten on later launches.

## Validation

From `Browserapp/`:

```sh
npm run selftest -- fpreliability
npm run selftest -- fpgeneration
npm run selftest -- fpvalues
npm run selftest -- cleanupownership
npm run selftest -- launchwriteback
npm run selftest -- networkconditions
npm run selftest -- networkconditionsnative
npm run selftest -- swgate
npm run selftest -- swcache
npm run selftest -- fpapicontracts
npm run selftest -- fpapinat
npm run selftest -- ffgeonative
npm run selftest -- ffresponse
npm run selftest -- firefoxstart
npm run selftest -- workernetwork
npm run selftest -- ffcancel
npm run selftest -- ffcertificates
npm run selftest -- emittedscriptparse
npm run selftest -- fpidentity
npm run selftest -- fprealms
npm run selftest -- fpconsistency
npm run selftest -- fplifecycle
npm run selftest -- fpsessionraces
npm run selftest -- firefoxcontexts
npm run selftest -- teststatus
npm run selftest -- runtimepolicy
npm run selftest -- urlpolicy
npm run selftest -- mobilepersonas
npm run selftest -- fpdeliveryboundaries
npm run selftest:firefoxstart
```

The reliability suite uses actual configuration/build/injection functions, VM document execution, fault-injected CDP calls, deferred-session files and an in-memory BiDi transport. The Firefox launch suite runs the actual process lifecycle with a stub executable and simulated protocol messages; it is not a native Gecko rendering test. It stubs network discovery and makes no external exit-IP requests.

The delivery-boundary suite exercises duplicate/rejected/hung request handling, strict probes, all three Chromium worker types, page readiness publication and Firefox watcher routing. It also executes the production Chromium startup routine with process/protocol fixtures to check that injection failures, mismatches and probe exceptions invoke process cleanup before target navigation, while a verified launch still completes. Fixtures do not substitute for the native browser gate below.

Portable Chromium verification (Windows/macOS/Linux) is a separate required platform check:

The generation gate compares 240 pre-change version-1 identity digests, samples 2,000 version-2 profiles, checks replay under simulated host OSes, and verifies API defaults. The parse matrix validates resolved settings before parsing 147 document and 147 worker scripts.

The capability gate compares unmodified and injected software-driver WebGL1/2 contexts in documents and blob workers, allocates a one-row texture at the advertised maximum width, and compares Android/iOS window geometry against native device emulation with and without a viewport meta tag:

```sh
OPENBROWSER_CHROMIUM_BINARY=/absolute/path/to/chrome npm run selftest -- fpcapabilitiesnative
OPENBROWSER_CHROMIUM_BINARY=/absolute/path/to/chrome npm run selftest -- codecnative
OPENBROWSER_CHROMIUM_BINARY=/absolute/path/to/chrome npm run selftest -- networksemantics
```

The native-contract gate compares an unmodified browser with version-1 Windows and version-2 Windows/Android/iOS configurations. It exercises full font protection, Blob iterators/getters/subclasses, Worker URL/options conversion and subclassing, classic/module/shared workers, private state, cross-realm stringification, actual repeated-source execution, and CSP/Trusted Types failures. The harness uses both production launch-argument stages so configured software-driver flags actually reach Chrome.

```sh
OPENBROWSER_CHROMIUM_BINARY=/absolute/path/to/chrome npm run selftest -- fpnativecontract
# On Linux with a running display, repeat without headless mode:
OPENBROWSER_CONTRACT_HEADFUL=1 OPENBROWSER_CHROMIUM_BINARY=/absolute/path/to/chrome npm run selftest -- fpnativecontract
```

The worker-boundary gate adds native URL/Blob, rendered AudioBuffer and shader-precision conversion comparisons; SharedWorker reuse across iframes and detached-opener descendants; constructor-failure and revoked-URL reuse; and classic/module grammar, static-dependency identity, import.meta.url and early message delivery. Its fixtures run against a clean copy of the same Chromium binary before Windows and Android injection. A separate resource test checks actual Blob URL allocation and revocation around module load, early termination and constructor failure without starting extra native threads.

```sh
OPENBROWSER_CHROMIUM_BINARY=/absolute/path/to/chrome npm run selftest -- fpworkerboundaries
npm run selftest -- workerresources
```

The general document and worker delivery gate:

```sh
OPENBROWSER_CHROMIUM_BINARY=/absolute/path/to/chrome npm run selftest:fingerprintnative
```

This gate starts actual Chromium with the production page/worker setup against a local HTTP server. It checks inline first-script identity, the first instruction in dedicated/shared/service workers, navigation and worker-fetch UA/Client Hints, network-value parity, native CSS resolution/device-width at host 2x/persona 1x and host 1x/persona 2x, Canvas restart stability and cross-profile separation. Non-test traffic uses a closed loopback proxy. It covers stock Chromium's injection path; custom native kernels, font assets, GPU output, Audio and WebRTC need their own platform gates. Root-only test containers can explicitly set `OPENBROWSER_NATIVE_NO_SANDBOX=1` when their environment requires it.

Missing prerequisites exit 2; runtime/assertion failures exit 1. The aggregate and single-test runners classify skipped browser assertions as `skipped` or `partial`, never `passed`. `OPENBROWSER_REQUIRE_COMPLETE_TESTS=1` makes either classification fail the wrapper command. The reviewed macOS-only cross-surface, worker-scope, UA-iterable and request-header entry points also return 2 when native execution is unavailable.

Native Firefox verification is a separate gate:

```sh
OPENBROWSER_FIREFOX_BINARY=/absolute/path/to/firefox npm run selftest:firefoxfingerprint
```

That gate checks inline first-script observations, iframe observations and HTTP UA against a local server. Other traffic is routed to an unavailable loopback proxy. Missing Firefox exits with code 2 rather than reporting a passed browser test. Native Windows/macOS/Linux checks, GPU/codec/font compatibility and worker-first-instruction delivery still require platform-specific validation.
