# Fingerprint delivery and Firefox

## Identity generation

Both editors display effective legacy device overrides. Saving an edited WebRTC, hostname, MAC, CPU or memory setting clears the corresponding old override. Explicit CPU settings accept 1–64 logical processors. The memory selector includes Chromium's fractional tiers, and the native init writer preserves them. Returning to host hardware removes previous native overrides from a reused init file.

Location source and permission are independent. Denying permission retains any saved custom position, so allowing it later restores the same coordinates. The Workbench carries the current source, permission, coordinates and accuracy into the preview.

Profiles keep a `fingerprintSeed` alongside their ID. The editor's randomize action generates a new 128-bit seed in the draft, clears old overrides, and selects a coherent device persona. Saving commits the new identity; reopening an unchanged profile keeps it stable. Refresh-on-start uses an additional launch seed independently of the sampling stability mode.

The Local API and Workbench also allocate and store a seed when creating profiles without a preview. Local API updates preserve omitted fingerprint fields and supplied object fields such as network settings support partial updates. An explicit `fingerprint: null` clears the override object.

New-profile previews allocate the UUID that creation will use, because all identity versions hash the profile ID together with its seed. An engine-scoped HMAC binds that UUID to the generated seed and fingerprint version. Creation accepts it only while unused, including within a staged batch or import. Replayed templates and clones receive distinct IDs. Existing editors preview against their persisted ID, and restoring an editor invalidates older pending previews. Preview builds the proposed configuration in isolation from the running snapshot. IP-derived values and explicit user overrides still resolve independently of this handoff.

Profiles also persist `fingerprintVersion`. Missing versions mean **1**, including old backups and sync records. New profiles created through the API, single/batch creation dialogs, and the tabular importer use **5**. Templates and clones inherit their source version. A full fingerprint reroll switches the draft to the current generation and saving commits the seed and version. A UA-only refresh retains the draft seed and generation version. API create accepts `fingerprintVersion` or `fingerprint_version`. Unsupported versions are rejected.

Version 2 derives random fields using domain-separated SHA-256 (`seed + field name`), replacing version 1's overlapping seed offsets. Its default hardware path selects one coherent CPU/memory/screen/DPR/GPU template; new single-profile creation no longer pins 12 cores/8 GB over that template. Selection is independent of the host OS, while version 1 retains its historical host gating. Configured identity can be reproduced across hosts, but rendering pixels and usable limits still depend on the kernel, driver and fonts. Reusing a common hardware template is expected; this is not a guarantee of globally unique identities.

Version 3 samples [42 desktop configurations](../Browserapp/automation/data/desktop-personas-v3.json) across Windows, Linux, Intel Macs and Apple silicon, plus [15 Android and 22 iPhone models](../Browserapp/automation/data/mobile-personas-v3.json). The source references document listed hardware, model identifiers and released OS combinations. CSS screen dimensions come from the physical panel and selected scale. WebGL renderer strings are derived from the listed GPU and the configured graphics backend. Neither these strings nor the relative catalogue frequencies come from device telemetry. Current desktop data emphasizes laptops and the Android catalogue covers Google, Samsung and Motorola.

Version 4 adds [26 desktop configurations](../Browserapp/automation/data/desktop-personas-v4.json) and [13 mobile models](../Browserapp/automation/data/mobile-personas-v4.json). Desktop builds with external monitors carry a monitor specification, and foldables carry their unfolded panel geometry. GPU metadata follows the same sampled CPU, memory and screen. Camera and audio labels follow the platform and device class. Generated device names use a platform-specific prefix and seven alphanumeric characters. A blank custom MAC derives a locally administered unicast address from the saved profile seed. Explicit addresses retain their value, and real mode uses the native address. The name and MAC are profile settings and are serialized into compatible native kernel init fields.

Version 5 adds [18 desktop configurations](../Browserapp/automation/data/desktop-personas-v5.json) and [10 mobile models](../Browserapp/automation/data/mobile-personas-v5.json). The totals are 86 desktop configurations across Windows, Linux, Intel Macs and Apple silicon, plus 26 Android and 34 iPhone models. The additions cover business laptops, mini PCs, workstations, the RTX 5080, the Arc 140V, OnePlus and Xiaomi handsets, the Galaxy Z Fold7 unfolded display, and older iPhones. V1–V4 keep their own device pools and seed behavior. Android model codes use the Google Play supported device list. The physical panel sizes come from hardware specifications. Where a source supplies no browser DPR, the catalogue uses an explicit reference scale and derives CSS dimensions. Catalogue RAM describes the hardware, and `navigator.deviceMemory` still uses the engine's supported tiers. GPU limits use the existing conservative vendor fallback when an architecture has no dedicated table entry, and live queries honor native driver bounds.

The Workbench displays sampled V4 names and MAC addresses in previews. Saving automatic values retains their seed-based behavior. Typing or using an individual field's shuffle stores the chosen value. A UA-only refresh uses the active draft seed, including after an unsaved device reroll. It carries saved device constraints only when refreshing the committed identity with the same OS selection.

The Workbench keeps automatic CPU, memory and WebGL values tied to the selected fingerprint seed. Its CPU and memory selectors support automatic, host and explicit values. Existing saved numbers still count as explicit because older records did not store how those numbers were selected. A full preview reroll resamples WebGL in random mode. Preview also rejects the same incompatible Chromium UA and OS combinations checked at launch.

The dedicated Chromium UA randomization action draws a full Chrome version for the selected OS and the installed kernel's major. The bundled pool combines Chrome Version History with official Chrome for Testing browser builds for each desktop download platform. Version History supplies Stable, Beta, Dev and Canary, plus Extended Stable where available, and is the source for Android and iOS. [Bundled version pool](../Browserapp/automation/data/chrome-release-versions.json)

Each draw excludes the displayed version when the pool has multiple entries. If the pool is empty, randomization varies the patch number within eight of the installed build's patch while keeping its build branch. Launch keeps a saved published version or a valid fallback in both the UA and Client Hints. If a kernel major upgrade supersedes a saved draw, launch uses the installed kernel version. Automatic UA generation uses Chrome's normal reduction policy.

Run `python3 Browserapp/scripts/refresh-chrome-ua-versions.py` from the repository root to refresh the snapshot. The script keeps previously published versions so saved draws remain valid after refreshes.

Bulk kernel upgrades validate every selected profile against its target kernel before committing the batch. Generated UA versions follow the new kernel. The upgrade retains the saved seed, device and manual hardware choices, and a conflicting custom UA rejects the batch. UA-only refresh in both editors retains a saved mobile device when the selected OS and release are unchanged. Tabular import uses each row's engine and OS selection for preview and storage. A missing release inherits a form default only when it belongs to the same operating system.

Preview and launch use the same installed version lookup. Launch validates the assembled configuration before applying browser data retention and startup cleanup. Chromium CDP and Firefox BiDi also compare the running browser's reported major version with the selected major before registering the document script.

Fingerprint inspection through the local API and desktop IPC uses that same version lookup for stopped profiles. The `delivery` field reports `configured` for a prepared configuration and `verified-document` after document delivery has been checked. Profiles following the system language resolve their language chain from the host locale while retaining the configured list for a later switch back to custom language.

When WebGL metadata follows the host, the WebGPU setting that follows WebGL also uses the host adapter. Document and worker scripts consume the same resolved WebGPU mode. An explicit system timezone clears emulation even if a legacy dynamic snapshot still contains an exit timezone.

Network-information values follow Chromium's exposed bounds and buckets: downlink is 0–10 Mbps in 0.05 Mbps steps; RTT is 0–3000 ms in 50 ms steps. Version 2 corrects the old 10.1 Mbps draw to 10 without changing the seed or other draw slots. This changes that field for affected existing V2 profiles. Version 1 retains its serialized historical draw (the 240 replay fixtures remain unchanged), while document/worker delivery projects it onto the native bound and reports a consistency warning. Both versions' live readings can therefore change from 10.1 to 10 after this correction. Explicit overrides use the same bounds/buckets; null, blanks and booleans are not numeric zero. Delivery verification compares the effective values. V2 selects default throughput and RTT from the resolved 3g, 2g or slow-2g range. The 4g range and explicit numeric overrides retain their previous values. Existing V2 profiles in the slower ranges can therefore report new values from the same seed. The ranges are heuristics.

Custom battery snapshots use one normalizer during profile save/load and fingerprint construction. Zero remains zero. JSON null durations remain unknown/Infinity instead of becoming zero; charging batteries have infinite dischargingTime, discharging batteries have infinite chargingTime, and a fully charged charging battery has chargingTime zero. The editor renders null durations as blank and retains their null representation on save. These are deterministic API snapshots, not a simulation of battery drain or charging events.

Document and worker WebGL wrappers query the actual context before applying persona limits. Maximum capabilities are bounded by native values, uniform-buffer alignment retains the native minimum requirement, typed-array range types are preserved, and native invalid-enum/null/receiver behavior is retained. OS constants are not measurements of GPU capability. These corrections apply to **both** versions: affected live readings change after upgrade even when the saved identity stays version 1. This bounds capability claims without virtualizing the driver or making every operation match a different GPU.

Version 2 iOS templates use `Apple Inc.` / `Apple GPU` instead of a desktop ANGLE wrapper. This does not turn Chromium into WebKit or certify a catalogue device as real hardware. Older iOS identities retain their generation behavior and report the wrapper as a consistency warning. Mobile window metrics preserve native outer-window dimensions and layout-viewport rounding, including pages without a viewport meta tag; screen, layout viewport and visual viewport are distinct quantities.

Custom mobile screen dimensions survive save and reload, including profiles that declare their OS on the profile itself. Native device metrics use the configured screen size and calculate the layout viewport from that size and the persona's original browser UI inset.

The Workbench includes the current resolution selection in its fingerprint preview. Switching to the system option keeps the custom dimensions in storage and deactivates them. Desktop preview, inspection and launch use the primary display dimensions when the Electron display service is available. Mobile profiles and desktop runs without that service use the selected virtual panel.

Legacy seed migration must persist successfully before either engine launches. A failed write blocks startup and keeps the selected seed pending in memory; retries flush that same identity instead of treating an uncommitted seed as saved or drawing another one. Concurrent migrations share one flush. Migration merges only the seed into the latest profile row and rejects a profile deleted or re-seeded during the write.

Chromium UA generation uses the selected kernel's major/full version. Generated Client Hints are saved with the UA. An explicit custom UA takes precedence over the OS-version selector.

Editor UA generation reuses the saved OS and release when they are omitted from the request. An explicit OS switch does not inherit the previous OS's release. Random-UA pools normalize OS aliases, reject empty/sparse/invalid OS or version pools, and require an unsigned 32-bit seed. Valid seeds retain their existing draw order and OS weights. Brand/version arrays are independent of the shared GREASE catalogue and caller-supplied arrays.

Navigator platform (`Win32`, `MacIntel`, `Linux x86_64`) and Client Hints platform (`Windows`, `macOS`, `Linux`) are separate fields. `platformNav` and `chPlatform` are the explicit overrides; the legacy `platform` option accepts either known representation without copying it into the other field. Explicit contradictory metadata remains visible to configuration validation.

`fingerprint/persona-ua.js` resolves custom, generated and strict UA intent before device projection. It normalizes `platformVersion` to `platform_version` and `uaFullVersion` / `fullVersion` to `ua_full_version` for Client Hints from `privacy.fingerprint`, `privacy` or the profile. Existing canonical fields retain precedence; strict mode follows the selected kernel. Saved objects are not mutated. Previously ignored camel-case overrides now take effect and contradictory OS/browser versions can fail validation; regenerate the UA, clear the custom override, or use strict mode as appropriate.

`user-agent.js` builds host-side profiles, CDP payloads and launch flags. The browser installer is authored JavaScript in `fingerprint/runtime/ua-bootstrap.js`, serialized as a function receiving only its JSON payload and private token. It has its own lint scope, including WorkerNavigator declarations and a ban on host APIs. Emitted-script parsing, VM contracts and native realm checks remain required: source lint alone cannot validate browser delivery.

Editor-generated UA profiles retain `privacy.fingerprint.uaGenerated` and follow the installed kernel on later launches. New Chromium desktop and Android UA generation uses the reduced `major.0.0.0` string with the actual full kernel version in Client Hints. Linux V3 leaves the platform version hint empty, following [Chromium's platform-version implementation](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/components/embedder_support/user_agent_utils.cc). A refresh can yield the same reduced string. Previously saved generated patch values still replay until the UA is refreshed. Editing the UA text makes it custom. Strict mode updates the UA token, brands, full version and full-version list together. A custom UA that contradicts its navigator platform, Client Hints or actual Chromium major version fails configuration validation before Chromium is spawned.

Canvas and WebGL stability use one host policy in documents and workers. Stable mode uses sparse, seeded +/-1 pixel deltas; normal mode retains its -1/0/+1 distribution. Repeated reads of unchanged input keep the same deltas. Stable mode no longer reduces the entire delta distribution to zero. Auto mode resolves amplitude and sample density against the current realm's host instead of reusing the pre-navigation snapshot; prefix exceptions such as `cdn.` have the same meaning in both realms. This correction changes affected stable-mode pixel fingerprints once after upgrading.

Mobile UA generation and runtime construction resolve one device identity. Client Hints persist its device selector and OS release so a saved UA cannot be paired with a second random phone. Unknown model selectors and unsupported model/OS combinations are rejected with an actionable error. The UA's reduced `Android 10; K` token is never used as its real Client Hints model or release.

The historical imported catalogue continues to back V1/V2 profiles. It excludes 447 Android records that shared the unverified `360 × 592` fallback geometry. Existing Android seeds retain their original catalogue device when it remains eligible. V3 automatic generation uses the sourced catalogue. Explicit historical model selections can still use an eligible record from the imported catalogue. Android 17 and iOS 27 are sampled only for listed models with official support.

Firefox defaults to a Firefox/Gecko UA generated from its actual kernel version. Custom Firefox product and Gecko rv tokens must match the selected kernel major. Custom patch versions within the same major still work. Its random-UA button is disabled. Device identities can still change through the profile seed. Firefox preserves its native absence of Chromium-only APIs such as `navigator.deviceMemory` and Client Hints; it does not receive `window.chrome` from the shared injection script.

## Native API behavior and worker delivery

WebGL enum arguments pass through native WebIDL conversion once, after native receiver validation. Numeric, string, boxed and unsigned-long-wrapped arguments resolve to the same persona metadata in WebGL1/2, documents and workers, including shader precision queries. Context-loss nulls and native invalid-argument errors are retained. Reported shader precision and runtime capability bounds cannot exceed the actual driver.

Rendered AudioBuffer reads and copies also delegate argument validation and unsigned-long conversion to the native method. User conversion hooks run once, invalid destination buffers fail before channel conversion, and explicit samples written through copyToChannel remain exact after subsequent reads. The Blob font gate reads the native Blob type getter only after successful native URL creation; custom type getters and failed arguments gain no extra reads. Object URL revocation converts its argument once across both the font and worker layers.

Worker and SharedWorker constructors proxy the native constructor, retain its prototype and subclass construction, and preserve the original observable WorkerLocation. The Blob font gate uses the same native construction rules; optional CSS bookkeeping does not replay custom Blob iterators, element getters or options getters. Ordinary Function.prototype.toString calls do not access or execute a function's custom toString property. Wrapped callable proxies prevent foreign-realm stringification from exposing those wrapper bodies.

Inline-worker preparation reads immutable local Blob bytes and uses a private Acorn tokenizer/parser to preserve hashbangs and genuine directive prologues. A continued string expression is not split into a directive and a second statement. Module entries receive a first static side-effect import that installs the configured identity before the original static dependencies execute. This retains the native module graph and startup-message delivery rather than delaying user code behind a dynamic import. The entry's import.meta.url and WorkerLocation retain the original URL. This is covered for Blob and data entries; cyclic graphs and arbitrary module loaders still need separate compatibility validation.

Child-worker installation is reconstructed from a private named function, including the font-presence layer. Installation checks and runtime revision checks use the private function bridge rather than public WorkerGlobalScope flags or source-passing hooks. Replaying the complete document source checks completion before its UA layer runs; installation-status messages pass through the UA, font and WebRTC layers. This prevents repeated wrapping when the complete source is executed again.

Chromium 143+ Service Workers additionally use a first-script execution gate, including scripts restored from the persistent script cache. Startup queues Debugger.enable, the beforeScriptExecution breakpoint and Runtime.runIfWaitingForDebugger in protocol order. Awaiting Debugger.enable before releasing startup deadlocks on Chrome 157. At the script breakpoint, the gate verifies UA, platform, core count, language order, exposed device memory and network values, and timezone equivalence before resuming application code and disabling Debugger. An IANA alias such as `Etc/UTC` can match the browser's `UTC` reading.

Only one session owns this gate per Service Worker target. Browser-level auto-attach owns Service Workers; page/iframe auto-attach filters exclude them before creation. If an extra session is nevertheless announced, it releases its startup latch only after the owner's breakpoint commands have been queued, then detaches through its actual parent after verification. Detaching it earlier can release the worker before the owner's breakpoint exists. The gate recognizes complete historical injection-prefix expressions in cached scripts, including parsed static module dependencies, and retires their exact token/revision checks through the private bridge so an old prefix cannot reinstall the previous persona. It does not clear registrations, cookies, application caches or browsing data. An unrecognized cached prefix, incompatible same-token revision, failed probe or timeout rejects delivery and follows target/browser shutdown. Already-running workers whose first execution cannot be verified are rejected rather than labelled protected. The gate bounds individual source at 16 MiB and a parsed graph at 512 scripts/32 MiB.

Native Chrome 157 on Linux covers classic/module Service Workers at network registration, restart with a changed persona using persisted scripts, static dependency first reads and unprefixed background updates. Windows/macOS kernels, arbitrary module graphs and Firefox still need their separate native validation; these results are not a claim of perfect fingerprint emulation.

Related same-origin documents coordinate rewritten SharedWorker Blob URLs through that private bridge, including iframes and opener chains. Only successful native construction publishes a prepared Blob entry; failed constructors cannot displace a live worker. Entries are retained for the original Blob URL's lifetime rather than evicted at an arbitrary thread count. Prepared Blob resources use the original creator's realm and are revoked with the original URL or a non-BFCache pagehide. A revoked canonical URL is retained for native reconnection to an already-live SharedWorker. Data entries are deterministic and need no document cache. Dedicated module helper URLs are released after a private initialization message, native error or termination; entry URLs are released as soon as the native constructor captures them.

The registry covers participating related same-origin documents; unrelated tabs and URLs created in another agent are not globally coordinated. A pure JavaScript registry does not replace the browser's own global SharedWorker identity store. Retaining many original Blob URLs also retains their prepared mappings until those URLs or their creator are released.

Inline worker preparation deliberately fails with SecurityError when CSP blocks reading the Blob source. Trusted inline script URLs are also rejected when preparation would require bypassing Trusted Types. The runtime creates no permissive Trusted Types policy. This protects identity delivery at the cost of compatibility with those inline-worker configurations; network-worker delivery retains the existing transport. Software rendering, strict-CSP workers and iOS emulation must not be labelled indistinguishable from native hardware or WebKit.

Window metrics retain the native descriptor owner, enumerability, setter and illegal-receiver checks. Native outer-window dimensions replace fixed desktop border estimates. iOS CSS.supports uses the actual CSS parser, so JS queries, declaration acceptance and stylesheet @supports agree; Chromium-only and WebKit-only capabilities still require their real engines.

## Startup barrier

Both engines launch on `about:blank`. External startup URLs are opened only after document-start injection has been registered and the initial document's identity has been verified. Missing probes, script exceptions, and registration failures are failures. Native-kernel init write failures also stop Chromium startup.

Chromium waits for `DOMContentLoaded` from the main frame and loader returned by each startup navigation. The post-navigation probe checks the new document and launch requires at least one successful page verification. Browser-reported network errors still produce startup warnings.

The document probe verifies explicit Do Not Track settings against `navigator.doNotTrack` and accepts each engine's native inactive value. The default setting follows the browser's policy.

Verification on the controlled startup document also confirms that the installer for the selected identity finished in that realm. This distinguishes native settings that already match from an executed document script. After startup navigation, both engines compare the live document values. That comparison is independent of the private installation check, since website code can replace the function used to read it.

Proxy and locale discovery stage their results before publishing to the saved profile. Publication requires the source revision to remain current, including after seed migration and before spawning either engine. An edit, deletion, recreation or restore during preparation stops that launch with `PROFILE_STALE_REV` or `PROFILE_MAINTENANCE`; retry launches the latest configuration. Successful publication includes the resolved locale and exit metadata in the actual persisted map. Forced connectivity guards bypass both the engine's locale cache and the direct-exit lookup cache.

Cleanup is idempotent per running item. Profile-wide helper draining, singleton removal and named IPC cleanup require current generation and directory-lock ownership. A failed lock acquisition and a late callback from an older generation cannot clean a replacement's resources. Unknown helper scans retain the lock and singleton state until an explicit retry confirms exit; there is no synchronous process-kill fallback. Old private connections and proxies still close independently of directory ownership.

For Chromium, late page/iframe targets finish injection and response setup before resuming. A failed target is closed; when target closure cannot be confirmed, its browser is stopped. Worker evaluation exceptions are inspected instead of being treated as successful protocol calls.

The full document probe reads WebGL1 and WebGL2 on separate canvases. It checks blocked contexts and hidden debug metadata across both versions, and can report a renderer or vendor mismatch specific to WebGL2.

Startup injection or verification failures now reject startup and terminate the browser through its normal lifecycle cleanup. A failed browser is not left running on an error page. Runtime checks only mark targets successful after a valid probe; timeouts and script errors on targets that still exist are failures. The post-navigation pass verifies all current startup tabs without stacking a second injection or automatically reloading an external site. This pass observes the current documents; it does not establish what a site observed before that probe.

On secure Chromium documents the live probe also reads low- and high-entropy Client Hints with a bounded wait. Delivery checks compare brands, mobile, architecture, bitness, model, platform version, full browser version and the full-version list. Missing APIs or failed entropy probes cannot pass a secure-document check. Strict delivery rejects an active `navigator.webdriver`, a missing configured Network Information object or missing core members, and unexpected Chromium-only navigator APIs on iOS personas. Optional network members retain native availability. Runtime status exposes successful checks with warnings through `fingerprintWarnings`. Opaque initial documents preserve native secure-context gating; configuration validation handles identity contradictions before navigation.

The document media-query wrapper replaces individual persona predicates and delegates the complete expression to the native parser, preserving conjunctions, negation, media types and query lists. This is not certification that injected JS metrics and the renderer's CSS media evaluation agree on every kernel. Native CSS, GPU rendering, Canvas/Audio outputs, WebRTC and worker-first-instruction delivery remain separate platform validation gates.

Desktop target setup applies native device metrics even for DPR=1, using zero layout dimensions to retain live viewport resizing and explicit persona screen dimensions for CSS device queries. Mobile targets retain pinned device viewports. Metric-command failures reject target setup; they cannot be recorded as successful injection. Subframes inherit top-level metrics instead of receiving top-level-only commands.

Resizing a desktop window changes its viewport but no longer grows the persona's `screen.width`, `screen.height` or available display bounds. Keeping the display fixed also keeps it aligned with the native CSS device metrics. A configured geolocation override, a granted location permission, and mobile touch emulation must succeed natively before document registration; unsupported-command errors cannot silently leave the host location or desktop touch behavior active.

## Registration ownership and recovery

A failed CDP apply can leave earlier native commands active. When the target is retried, pending native changes are reconciled before reusing the document registration. A failed geolocation-only update retries the native policy without reapplying the document script. The retry can clear an override even if its first set command took effect but its acknowledgement was lost.

A timed-out document-start registration or a reply without a script identifier leaves the target unconfirmed. The application rejects reuse of that target and follows the existing target cleanup path. A documented successful registration still supports retry after document evaluation fails.

Document registrations and runtime policies are tracked by their actual CDP connection and flat-session identity. Different sessions on the same target have separate registrations. Concurrent applies in one session serialize, and a failed operation does not poison retries. Live registrations are not evicted when the browser exceeds 256 targets. Closing or detaching a session invalidates its state and cancels late/queued setup; an old asynchronous result cannot mark a replacement session successful.

Target setup also has a session cancellation guard around native overrides, Fetch registration, worker evaluation and debugger resume. Detach, destruction, connection closure and late-page injection timeout cancel the remaining setup immediately, even if a protocol command has not returned. Commands already sent cannot be recalled, but their late results cannot issue subsequent commands or republish readiness. A ready flat session lost from a still-live target stops its browser unless another session owns the target. For Worker targets that remain visible across two discovery replies, teardown gets another 250 ms before the last check. Repeated old detach events preserve a verified replacement's readiness.

The initial page path uses a managed persistent WebSocket rather than the idle-evicted command pool or one-command sockets. A blank or debugger-paused target can transfer ownership to the persistent browser flat session: the old page connection is retired before the new native overrides are applied. An active, unpaused document cannot silently transfer ownership. Normal page closure is confirmed against current targets so closing one tab does not stop the other windows; unexpected owner loss on a still-live target stops its browser. Browser cleanup closes both active and still-opening fallback connections.

The periodic sweep snapshots pending targets once. It rechecks the live flat-session owner around direct socket operations so a completed handover cannot trigger a competing fallback or erase the new owner's verified state.

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

Generation and native delivery share coordinate validation and accuracy limits. Chromium applies live coordinate edits through CDP without resending the document script. A grant requires a valid emulated position. On transition to denial or prompt, Chromium updates permission before clearing the previous override. A failed revocation preserves the existing override for retry. Native kernel initialization removes the prior `geoposition` when the current profile resolves no position and verifies the field on readback.

`geoMode: disabled` implies effective denial even when `geoPermission` is absent or prompt. Allow without valid configured coordinates also remains denied. Chromium must successfully apply Browser.setPermission for both grants and denials before document registration; an unsupported denial command stops setup instead of relying on a JavaScript callback facade.

Firefox writes `geo.enabled=false` for effective denial. Its default-deny permission preference alone does not revoke previously stored site grants; disabling the native feature protects even previously authorized origins and unprepared navigations, with native absence of `navigator.geolocation` as an intentional interface change. Prompt/allow launches explicitly restore the preference to true. Managed HTTP(S) startup origins receive the native BiDi permissions.setPermission grant/deny before navigation; failed setup blocks that navigation and is not cached as success. This does not auto-grant arbitrary redirect destinations, later script-driven origins or cross-origin frames; their native permission behavior is retained. Native position overrides remain required before a configured location can be used.

Storage estimates share one document/child/worker implementation. Native estimate performs receiver and argument validation, so genuine StorageManager objects from another same-origin realm are accepted. The wrapper retains the actual native result dictionary, its realm, property flags, optional-member absence and additional fields. It adjusts only a writable native quota value, never above the quota returned in that call. A persona tier is raised to current reported usage where possible, bounded by native quota; an already overcommitted native result remains native rather than inventing capacity. Native errors propagate. Parent synchronization recognizes an existing same-token patch instead of stacking wrappers.

The reported persona ceiling does not replace the native quota manager or enforce a synthetic disk size. Allocation and persistence behavior remain native.

The former unconditional RAM-based quota could exceed native capacity (the Linux Chrome probe returned about 10 GiB while injection claimed 30 GiB). Corrected live quotas can therefore change on existing identities without changing their saved seed or static generation. Chromium's reported quota also reflects current usage: Service Worker script-cache bytes affect it, so native regression comparisons use remaining space and comparable scopes rather than assuming every realm/profile has identical total quota. The VM quota fixture now owns its class/intrinsics per sandbox instead of patching a shared host Function prototype across profiles.

`MediaRecorder.isTypeSupported`, WebCodecs and RTP capability queries keep their native validation, MIME/codec parsing, function descriptors and complete result dictionaries. An OS-based answer cannot provide missing encoders or remove a codec from actual SDP negotiation. The former codec-matrix hooks are removed; the historical table remains in the generated identity object only for legacy replay compatibility and does not override runtime support. Codec support is consequently an explicit limit of cross-OS emulation. Unsupported legacy OS/browser combinations are rejected by the consistency check, including legacy Windows UAs and macOS releases supplied through Client Hints; reduced macOS UA tokens alone are not treated as an OS version.

Document and worker Client Hints accept iterable hint sequences, reject invalid arguments through rejected promises, preserve receiver checks and return independent dictionaries. Mutating returned brands or version lists cannot modify later responses. Unknown and inherited property names are ignored. Workers use the same metadata fallback as documents. Absent Client Hints and device-memory APIs remain absent in insecure worker and child realms instead of being created by parent-frame synchronization.

Native `navigator.userAgentData` can return a fresh object on every access. Document injection validates these receivers with the original native getter rather than object identity or `instanceof`; prototype-only fakes still fail native validation. Optional `formFactors` requests await the native capability probe, including the first call. Supported document and worker APIs return the same Desktop/Mobile classification supplied through CDP and opted-in HTTP headers. Optional hints and headers retain their native absence where unsupported. This delivery correction uses worker runtime revision **9**, independently of persisted fingerprint versions **1/2**; it does not rotate saved seeds or change normal generated identity fields.

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

Managed startup navigation and top-level context-created events share one native emulation task per context. Each extra startup tab waits for that task before navigating, whether its event arrives before or after the create response. Geolocation uses the same explicit context scope as UA and timezone, with the existing fallback for older kernels that reject context parameters. Required location failures reject startup or propagate through BiDi's fatal event/disconnect path. Child contexts inherit their top-level native overrides and do not receive top-level-only commands. Supported Firefox kernels set screen dimensions and DPR before navigation with `emulation.setScreenSettingsOverride` and `browsingContext.setViewport`. The DPR override leaves viewport dimensions free to resize. Older unsupported commands surface a coverage warning. This does not guarantee native emulation before the first script of an independently opened popup; those context events are asynchronous.

Closing a tab during setup leaves the other tabs active once BiDi confirms the context has disappeared. Setup failures on a context that still exists continue to stop the session. The runtime watch also checks for missing or closed BiDi connections and discards poll results from an earlier watch after a stop or restart.

The BiDi connection is part of the running item's lifecycle and is closed on stop. Unexpected disconnects stop the managed browser.
Repeated opens share a single BiDi socket. Firefox liveness checks use BiDi and do not invoke the Chromium runtime-injection sweep.

| Surface | Firefox status |
|---|---|
| UA / platform / languages | Native profile prefs plus document injection; UA tracks the selected Firefox kernel |
| Hardware concurrency / screen / Canvas / WebGL / Audio / ClientRects | Shared document-start injection on APIs the browser exposes |
| Device memory / Client Hints / Chrome namespace | Preserve Firefox's native API shape; no fabricated Chromium interface |
| Timezone | BiDi override where supported, runtime fallback, and process timezone on non-Windows hosts |
| Worker realms | Prefs supply UA, platform, languages and timezone. A temporary browser extension filters newly fetched HTTP(S) Worker script responses after Firefox handles transport. Asynchronous realm injection remains best effort |
| CDP automation / extension hot loading | Remain unsupported on Firefox |

`fingerprintDelivery` and `fingerprintVerification` describe document delivery. A managed Firefox session declares `workerFingerprintDelivery: browser-response-filter` and `externalHttpsTransport: native`. The extension is installed before startup tabs navigate. The response filter matches Worker script requests using browser-supplied fetch metadata and leaves ordinary requests alone. It processes decoded response bytes, bounds concurrent requests and memory, cancels rejected partial responses, and removes stale validators from rewritten bodies. Restricted browser origins, arbitrary CSP and cross-origin module graphs remain outside the tested matrix.

Firefox startup hashes the Worker source and delivery scope while holding the profile lock. Changing either invalidates persisted Service Worker registrations before launch. An unchanged source and scope preserve registrations. Invalidation retains cookies, LocalStorage, IndexedDB and CacheStorage. Sites may need a visit to register Workers again after the upgrade.

Firefox connects directly when no proxy is selected. A configured upstream proxy uses the loopback authentication bridge. The bridge passes the origin TLS session through CONNECT or SOCKS, and upstream credentials stay in the bridge. Inactive Firefox proxy settings are written empty so switching to Direct clears stale endpoints. The managed path keeps Firefox certificate validation and the browser's own TLS and HTTP negotiation. The legacy Worker forwarder remains covered by separate fixtures.

Network-script injection in both engines preserves the hashbang, original directive prologue and automatic semicolon insertion. It does not wrap the application in a function or repair invalid JavaScript. Chromium rewrites only JavaScript responses classified as worker loads (`Other`), preserving successful 2xx status codes and leaving page scripts, redirects, bodyless/error responses and non-JavaScript resources untouched. Partial Worker scripts are aborted instead of being executed without injection. CSP/CORS and other security headers survive rewriting. The obsolete public `__obPersonaUrl` Blob hook is removed; nested workers use the private closure installer. Duplicate response events share one operation, and target detach or network failure cancels tracking and prevents late fulfillment. Rewrite failures abort the paused request; inability to confirm abort stops the browser. Rewriting does not change static module dependency evaluation order, so arbitrary network-module dependency graphs are not certified by classic-worker first-read checks.

Firefox's production startup and per-host certificate generation use asynchronous OpenSSL calls. Per-profile signing has two concurrent jobs, at most 128 queued hosts and a 128-entry LRU cache; same-host requests share a job. Leaf keys/CSRs are removed after signing, and stop cancels active/queued jobs before removing the CA directory. Synchronous certificate helpers remain only for compatibility fixtures. Client cancellation closes pending CONNECT attempts, and direct socket DNS answers are checked against the existing outbound-address policy before connection. Active uploads retain Node's default request deadline rather than a 30-second total upload cutoff.

Official protocol references:

- [Firefox BiDi connection](https://developer.mozilla.org/en-US/docs/Web/WebDriver/How_to/Create_BiDi_connection)
- [BiDi script module and document preload scripts](https://developer.mozilla.org/en-US/docs/Web/WebDriver/Reference/BiDi/Modules/script)
- [BiDi emulation commands and context scope](https://w3c.github.io/webdriver-bidi/#module-emulation)

## Session restoration

Native automatic restore can execute old tabs before the injection barrier. It is disabled. Managed sessions save up to 100 URLs in `OpenBrowserSession.json` and reopen them after verification. Back/forward history, scroll position and unsaved page state are not restored by this URL snapshot.

At the first Chromium restore-mode launch with native session files, the launcher archives them to `OpenBrowserLegacySessions/chromium/`, then clears Chromium's active session files before spawning. Later launches reuse the archive and clear newly generated native session files. The managed URL snapshot remains the source for opening tabs after verification. Without that snapshot, the launcher uses the configured startup URLs. A failed archive or removal stops startup.

Firefox archives existing native session files once to `OpenBrowserLegacySessions/firefox/` when there is no managed snapshot. Both archives retain the original files for manual recovery.

## Generation and delivery review (2026-11-23)

| Area | Behavior and verification scope |
| --- | --- |
| Generated identity | Canvas, WebGL, Audio and ClientRects resolve their marks once for document, worker and native configuration. Blank, boolean and zero overrides fall back to the seed. A valid explicit audio mark retains fractional precision. The 240 legacy fixtures and 2,000 V2 profiles still exercise replay and cross-host generation. |
| Startup document | Chromium and Firefox read the same synchronous snapshot for UA, platform, primary language, language list, screen geometry and exposed network fields. Chromium's paused-page handoff uses that snapshot without awaiting promises. The full probe checks low-entropy Client Hints exactly and checks the high-entropy values in eligible secure documents. |
| WebGL | Verification distinguishes a missing context, a context with hidden debug metadata and an available unmasked renderer. Blocking all contexts and hiding debug metadata are independent policies. When the runtime cannot observe a configured renderer, verification records a warning. |
| Firefox WebRTC | The startup preference follows the resolved policy, including nested profile overrides. Disabled WebRTC and proxy mode without a resolved address disable the native API. Real mode leaves the native API and its error behavior in place. The document fallback runs only for proxy mode and respects Firefox's native disable policy. JavaScript SDP observations alone do not verify network routing. |
| Worker delivery | Chromium tests cover dedicated, Shared and Service Worker entry, plus cached Service Worker restart. Firefox tests cover HTTP(S) through the browser filter, including a controlled CONNECT tunnel. Legacy forwarder and cached registration behavior have separate fixtures. Optional network members are checked when exposed. Unrelated module graphs and independently opened Firefox popup timing remain separate compatibility cases. |

Document assembly uses the same configuration for fragment selection and serialization. With a fixed Linux profile and system fonts, the uncompressed script drops from 599,411 to 565,181 bytes for Chromium real WebRTC, from 624,108 to 599,412 bytes for Chromium proxy mode without an address, and from 622,257 to 563,331 bytes for the equivalent Firefox proxy configuration. These figures measure document source size.

Linux verification used Chromium 156.0.8078.79 and Firefox 159.0 with local fixtures. It passed the 294-script parse matrix, both native WebGL policy cases, document and Worker delivery, cached Service Worker restarts and native geolocation permission checks. Firefox tests hit BiDi session creation timeouts while native suites ran concurrently. Document, Worker and geolocation checks all passed when rerun serially.

## WebGL blocking and Canvas compatibility

With Canvas noise and WebGL blocking both enabled, the document runtime reserves `getContext` for the blocking policy. The same policy runs when an immediate same-origin iframe is accessed and on `OffscreenCanvas` in workers. Firefox also sets the kernel's `webgl.disabled` preference from the resolved mode at launch. Switching to real rendering or noise permits native WebGL initialization again.

The context policy preserves native receiver checks, converts nonprimitive context identifiers once and delegates unsupported identifiers to the browser. Canvas noise uses the context identifier from native conversion when tracking a successfully created WebGL context. HTML canvas keeps its native transferred-canvas error. A blocked OffscreenCanvas WebGL request returns null without attempting GPU creation.

The Chromium capability suite runs the JavaScript policy on the same WebGL-enabled browser used for its unmodified baseline. This exercises blocking independently of the production launch flags. It compares WebGL1, WebGL2, 2D rendering, invalid receivers and argument conversion in the main document, an immediate same-origin iframe, document OffscreenCanvas and a dedicated Worker. The suite also combines WebGL blocking with both Canvas noise and Canvas readback blocking.

## Canvas sampling and readback

Generation, profile save, and delivery normalize the sample width, height, and spacing to integers within the declared limits. Native kernel initialization copies the generated sample dimensions, spacing and Hamming threshold into both Canvas and WebGL settings. Document and Worker scripts embed one copy of the host policy per runtime. Blob Workers and inherited documents use their origin when their URL has no hostname, and hostname matching handles the DNS root dot on visited sites.

The UA and document iframe fallbacks check the child document's completed installation before patching it. The fallback tracks the current document across iframe navigations. Reading `contentWindow` or `contentDocument` after a completed document-start injection applies no additional pixel transform.

Documents, Workers and packed VideoFrame readback use the same byte-pixel sampling policy. Stable plans depend on dimensions and the configured mark. Alpha is checked on each read, so an initially transparent canvas can still receive noise after a later draw. The cache retains at most 64 plans for grids of up to 16,384 candidate pixels. Larger grids compute the same deltas on demand.

Float16 Canvas readback keeps its native sample values. Writeback snapshots use the browser's ImageData accessors and retain the color space, so shadowed JavaScript properties cannot alter the cache or run during a native write. Real and blocked Canvas modes omit the noise, readback, and text-metric helper code from the document and Worker payloads.

HTML canvas encoding coerces MIME values before taking the pixel snapshot and invokes the native encoder once. Native dimension accessors keep invalid receivers and shadowed properties out of the copy path. WebGL export reads the canvas's presented bitmap independently of the application's framebuffer binding. Document and Worker OffscreenCanvas exports share the native-first encoding path, release the decoded bitmap after the copy, and use the original blob if applying the noise policy or re-encoding fails.

## Language, hardware and timezone delivery

The persona resolves a single ordered language list for Chromium profile preferences, launch arguments, document and worker reads, and HTTP headers. Firefox writes the same list to its native language preferences and selects its first tag as the requested locale. Legacy underscore syntax and case differences are canonicalized. Import weights are stripped before delivery, malformed tags are ignored, and duplicates keep their first position. HTTP weighting is generated separately from that list.

Hardware overrides use the same numeric rules during save, generation and injection. Explicit zero on the profile's CPU or memory selector retains the native reading. Invalid inputs fall back to the generated value. The numeric API fields project valid core counts to integers and memory to browser tiers, with six GB resolving to eight GB.

Chromium resolves timezone before building the launch persona. A valid final `--time-zone-for-testing` switch takes precedence over the resolved profile timezone. The resulting value feeds the command line, POSIX process environment, injection and strict verification. An invalid setting falls back to a valid profile or exit timezone when available.

## Do Not Track

An explicit Do Not Track mode takes precedence over the legacy boolean. Chromium writes `enable_do_not_track` before launch and clears the previous preference in default mode. Firefox writes `privacy.donottrackheader.enabled` on every launch to reset a stored setting. Both engines use the native preference to expose `navigator.doNotTrack` and send `DNT: 1` when enabled. Off and default omit the HTTP signal and use the engine's native inactive DOM value. The Workbench boolean preserves a saved default when an unchanged inactive value is resubmitted.

## Firefox preference restoration

Firefox persists launch overrides from `user.js` in `prefs.js`. Startup now clears the stored override when the profile releases its CPU cap, minimum font size, autoplay option, or default permissions for notifications, microphones and cameras. The engine holds the profile lock while updating the preference files atomically. Firefox supplies the defaults for the installed version. Other preferences and per-site permissions are preserved.

## WebGPU and optional runtime code

WebGPU feature filtering keeps the browser's collection and iterator objects. Feature-name conversion, invalid callbacks and invalid receivers follow the native bindings. Size, membership, entries and callbacks observe the same filtered set. Blocking adapter requests preserves the browser's promise rejections. Native capability and device allocation remain under the browser's control.

Chromium's audio mute and WebGPU launch settings follow the resolved fingerprint. Firefox writes the volume scale at launch so turning mute off also resets a previously saved mute preference.

The document includes audio wrappers only in noise mode. Both the document and Worker omit timezone fallback code when the profile follows the native timezone. With the same Windows sample, system fonts, and native audio and timezone settings, uncompressed source measured 566,643 → 511,099 bytes for the document and 299,387 → 278,880 bytes for the Worker. These measurements describe script size.

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
npm run selftest -- uarandomcontracts
npm run selftest -- uarealmsnative
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

That gate checks inline first-script observations, iframe observations and HTTP UA against a local server. Other traffic is routed to an unavailable loopback proxy. Missing Firefox exits with code 2 rather than reporting a passed browser test. The separate worker matrix exercises the browser filter on loopback, and the legacy HTTPS forwarder for proxy chaining and cached-worker restarts:

```sh
OPENBROWSER_FIREFOX_BINARY=/absolute/path/to/firefox npm run selftest -- ffworker
npm run selftest -- fpreviewidentity
npm run selftest -- ffworkercache
```

Native Windows/macOS/Linux GPU/codec/font compatibility and broader worker/CSP graphs still require their platform-specific validation.

### TLS and HTTP/2 wire verification

`transportwire` starts the production browser engine with a disposable profile. A loopback origin records the ClientHello, negotiated TLS and ALPN, actual HTTP/2 SETTINGS and WINDOW_UPDATE frames, and decoded pseudo-header order. It calculates JA3, JA4 and the Akamai fingerprint. The test repeats the connection through an authenticated CONNECT fixture, compares the native JA4 and HTTP/2 fingerprint against the direct connection, and checks the first Worker instruction on both routes. Chromium can permute TLS extensions between connections, which can change JA3.

```sh
OPENBROWSER_CHROMIUM_BINARY=/path/to/chromium npm run selftest -- transportwire
OPENBROWSER_FIREFOX_BINARY=/path/to/firefox npm run selftest -- transportwire --firefox
```

For an online observation, set `OPENBROWSER_TRANSPORT_URL` to a credential-free HTTPS endpoint that returns the tls.peet.ws JSON schema. Set `OPENBROWSER_TRANSPORT_PROXY` explicitly when the route requires a proxy. For Firefox, `OPENBROWSER_TRANSPORT_CA_FILE` can point to the approved proxy CA PEM for the disposable test profile. The observer retains certificate verification for online requests. A TLS-terminating gateway can change the values observed by the external server even when Chromium or Firefox owns transport to the gateway. Compare the online result with the local wire result and record the route before attributing the fingerprint to a browser.
