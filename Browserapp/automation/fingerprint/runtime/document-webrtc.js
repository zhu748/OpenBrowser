'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
module.exports = `  // --- webrtc ---
  if (CFG.webrtc === 'disabled') {
    try {
      const blocked = nativeLike(function RTCPeerConnection() {
        throw new DOMException('WebRTC is disabled by permissions policy', 'NotAllowedError');
      }, globalThis.RTCPeerConnection, 'RTCPeerConnection', 0, true);
      if (globalThis.RTCPeerConnection) window.RTCPeerConnection = blocked;
      if (globalThis.webkitRTCPeerConnection) window.webkitRTCPeerConnection = blocked;
    } catch (_) {}
  } else if (CFG.webrtc === 'proxy' && CFG.webrtcAddress) {
    // NOTE: the bundled 148 kernel refuses to construct a peer connection at all (NotSupportedError,
    // for every webrtc_policy value), so this layer is only ever observed through a stock Chromium
    // kernel. Its prototype surface is still reachable on the bundled kernel - a page can inspect the
    // accessors without constructing anything - which is why the shapes below have to be exact.
    try {
      const targetIp = String(CFG.webrtcAddress || '');
      // A candidate address names either this machine (host), the address this machine's traffic is
      // observed from (srflx/prflx) or the TURN server that will relay the media (relay). Only the
      // relay address belongs to a third party and has to survive untouched. Every other type
      // identifies the machine or its exit, so it is replaced: restricting the rewrite to private
      // addresses left a public host candidate (a machine with a routable address) and a public
      // reflexive candidate (an exit that differs from the profile proxy) on screen, which is
      // exactly the address a detector looks for.
      const candidatePattern = /^(a=)?candidate:(\\S+) (\\d+) (\\S+) (\\d+) (\\S+) (\\d+) typ (\\S+)([\\s\\S]*)$/;
      const isRelayType = (type) => String(type || '') === 'relay';
      const rewriteCandidateLine = (line) => {
        if (typeof line !== 'string' || !targetIp) return line;
        // The ICE event hands out "candidate:..." while the SDP line carries "a=candidate:...",
        // so the prefix is optional and has to be preserved on the way out.
        const m = line.match(candidatePattern);
        if (!m) return line;
        let changed = false;
        let addr = m[6];
        if (!isRelayType(m[8]) && addr !== targetIp) { addr = targetIp; changed = true; }
        // raddr names the base address the candidate was observed from, which is this machine even
        // when the candidate itself is a relay allocation. Masking it only when it looked private
        // left the base address of a public host next to the rewritten candidate.
        const tail = m[9].replace(/ raddr (\\S+)/, (whole, base) => {
          if (base === '0.0.0.0' || base === '::') return whole;
          changed = true;
          return ' raddr 0.0.0.0';
        });
        if (!changed) return line;
        return (m[1] || '') + 'candidate:' + m[2] + ' ' + m[3] + ' ' + m[4] + ' ' + m[5] + ' ' + addr
          + ' ' + m[7] + ' typ ' + m[8] + tail;
      };
      // The media connection line names the address the agent would use by default. It is not a
      // candidate, but it carries the same address and survives every candidate rewrite, so it is
      // mapped the same way - except for an address a relay candidate in the same description
      // holds, because that one belongs to the TURN server rather than to this machine.
      const rewriteConnectionLine = (line, relayAddresses) => {
        if (typeof line !== 'string' || !targetIp) return line;
        const m = line.match(/^(c=IN IP[46] )([^\\s]+)([\\s]*)$/);
        if (!m) return line;
        if (relayAddresses && relayAddresses.has(m[2])) return line;
        // 0.0.0.0 and :: are the placeholders the engine writes when nothing was gathered yet; they
        // name no address at all, so replacing them would only make the description look unnatural.
        if (m[2] === '0.0.0.0' || m[2] === '::' || m[2] === targetIp) return line;
        return 'c=IN IP4 ' + targetIp + m[3];
      };
      const rewriteSdp = (desc) => {
        if (!desc || typeof desc.sdp !== 'string' || !targetIp) return desc;
        try {
          const nl = String.fromCharCode(10);
          const lines = desc.sdp.split(nl);
          const relayAddresses = new Set();
          for (const line of lines) {
            const m = line.match(candidatePattern);
            if (m && isRelayType(m[8])) relayAddresses.add(m[6]);
          }
          let changed = false;
          const mapped = lines.map((line) => {
            const candidate = rewriteCandidateLine(line);
            const next = candidate === line ? rewriteConnectionLine(line, relayAddresses) : candidate;
            if (next !== line) changed = true;
            return next;
          });
          if (!changed) return desc;
          return Object.assign({}, desc, { sdp: mapped.join(nl) });
        } catch (_) { return desc; }
      };
      // Descriptions the page reads have to stay brand-checkable, or instanceof becomes a tell.
      const rewriteDescription = (desc) => {
        const next = rewriteSdp(desc);
        if (next === desc) return desc;
        try { return new RTCSessionDescription({ type: next.type, sdp: next.sdp }); } catch (_) { return next; }
      };
      // Candidates reach the page as engine objects. Rebuilding the event that delivered one would
      // hand the page a script-constructed event instead of the engine's own - isTrusted false,
      // target/currentTarget null and eventPhase 0 are far stronger tells than the address the
      // rebuild was hiding. The rewrite therefore happens on the candidate the event carries: the
      // event object stays the one the engine dispatched, and only the candidate it hands out is
      // replaced, with the engine's own constructor so the brand check still passes.
      const eventCandidates = new WeakMap();
      const iceEventDescriptor = (() => {
        try {
          const proto = typeof RTCPeerConnectionIceEvent !== 'undefined' ? RTCPeerConnectionIceEvent.prototype : null;
          const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'candidate') : null;
          return descriptor && typeof descriptor.get === 'function' ? { proto: proto, descriptor: descriptor } : null;
        } catch (_) { return null; }
      })();
      if (iceEventDescriptor && iceEventDescriptor.descriptor.configurable !== false) {
        const proto = iceEventDescriptor.proto;
        const descriptor = iceEventDescriptor.descriptor;
        const nativeGet = descriptor.get;
        try {
          Object.defineProperty(proto, 'candidate', {
            configurable: descriptor.configurable,
            enumerable: descriptor.enumerable,
            get: nativeLike(function candidate() {
              const original = nativeGet.call(this);
              if (!original || typeof original !== 'object') return original;
              // Only an event the engine dispatched carries a candidate produced by the ICE agent.
              // A page-built event has to keep handing back exactly the object it was given, or the
              // accessor itself becomes the tell.
              if (!this || this.isTrusted !== true) return original;
              let cached;
              try { cached = eventCandidates.get(this); } catch (_) { return original; }
              if (cached !== undefined) return cached;
              let rebuilt = null;
              try {
                const raw = original.candidate;
                const line = rewriteCandidateLine(raw);
                if (line !== raw) {
                  rebuilt = new RTCIceCandidate({
                    candidate: line,
                    sdpMid: original.sdpMid,
                    sdpMLineIndex: original.sdpMLineIndex,
                    usernameFragment: original.usernameFragment,
                  });
                }
              } catch (_) { rebuilt = null; }
              try { eventCandidates.set(this, rebuilt || original); } catch (_) {}
              return rebuilt || original;
            }, nativeGet, 'get candidate', 0),
          });
        } catch (_) {}
      }
      const pcProto = globalThis.RTCPeerConnection && RTCPeerConnection.prototype;
      if (pcProto) {
        // The engine's own description accessors are read first, so the wrappers installed below can
        // still reach the raw descriptions the engine stored.
        const nativeDescriptionDescriptors = new Map();
        for (const key of ['localDescription', 'currentLocalDescription', 'pendingLocalDescription',
          'remoteDescription', 'currentRemoteDescription', 'pendingRemoteDescription']) {
          try {
            const descriptor = Object.getOwnPropertyDescriptor(pcProto, key);
            if (descriptor && typeof descriptor.get === 'function') nativeDescriptionDescriptors.set(key, descriptor);
          } catch (_) {}
        }
        const rawDescription = (key, pc) => {
          const descriptor = nativeDescriptionDescriptors.get(key);
          if (!descriptor) return null;
          try { return descriptor.get.call(pc); } catch (_) { return null; }
        };
        if (pcProto.createOffer) {
          replaceMethod(pcProto, 'createOffer', (orig) => async function createOffer(...args) {
            return rewriteSdp(await orig.apply(this, args));
          });
        }
        if (pcProto.createAnswer) {
          replaceMethod(pcProto, 'createAnswer', (orig) => async function createAnswer(...args) {
            return rewriteSdp(await orig.apply(this, args));
          });
        }
        // Descriptions the page hands in come back exactly as they went in. Rewriting them would let
        // a page detect the rewrite in three lines - set an SDP of its own, read it back, compare -
        // and nothing is leaked by leaving them alone, because the addresses in a description the
        // page built are the page's own. Only descriptions the engine produced are rewritten, so
        // the page-supplied ones are recorded here and handed back untouched by the getters.
        const verbatimDescriptions = new WeakSet();
        if (pcProto.setLocalDescription) {
          replaceMethod(pcProto, 'setLocalDescription', (orig) => async function setLocalDescription(desc, ...args) {
            // setLocalDescription() with no argument is the documented modern form: the engine
            // builds and applies the offer itself, so there is nothing to record.
            const supplied = Boolean(desc) && typeof desc.sdp === 'string';
            const result = await orig.call(this, desc, ...args);
            if (supplied) {
              for (const key of ['localDescription', 'pendingLocalDescription', 'currentLocalDescription']) {
                try {
                  const raw = rawDescription(key, this);
                  if (raw && typeof raw === 'object') verbatimDescriptions.add(raw);
                } catch (_) {}
              }
            }
            return result;
          });
        }
        // The engine-produced descriptions funnel through the local getters: the no-argument form and
        // the createOffer/createAnswer results. Reading is the only place that covers all of them, so
        // the raw stored SDP never reaches the page. One wrapper is cached per stored description,
        // which keeps the engine's own identity relationships intact - while gathering,
        // localDescription and pendingLocalDescription are the same object and must stay that way.
        //
        // The remote getters are deliberately left alone. A remote description is what the peer sent,
        // it never carries this machine's address, and rewriting it changes what the page reads back
        // from setRemoteDescription - the cheapest rewrite detector there is. The same argument holds
        // for a description the page supplied itself, which is why those are returned verbatim.
        const descriptionCache = new WeakMap();
        for (const key of ['localDescription', 'currentLocalDescription', 'pendingLocalDescription']) {
          try {
            const descriptor = nativeDescriptionDescriptors.get(key);
            if (!descriptor || typeof descriptor.get !== 'function' || descriptor.configurable === false) continue;
            const nativeGet = descriptor.get;
            Object.defineProperty(pcProto, key, {
              configurable: true,
              enumerable: descriptor.enumerable,
              get: makeNativeGetter(key, function () {
                const raw = nativeGet.call(this);
                if (!raw || typeof raw !== 'object') return raw;
                try { if (verbatimDescriptions.has(raw)) return raw; } catch (_) {}
                let hit = null;
                try { hit = descriptionCache.get(raw); } catch (_) { hit = null; }
                if (hit) return hit;
                const wrapped = rewriteDescription(raw);
                try { descriptionCache.set(raw, wrapped); } catch (_) {}
                return wrapped;
              }),
            });
          } catch (_) {}
        }
        // RTCIceTransport hands the same candidates out a second time, and getLocalCandidates()
        // answers from gathering alone - no connection, no event listener, no statistics call - so it
        // is a first-class surface rather than a corner case. The engine's candidate objects stay the
        // engine's; a candidate this machine owns is rebuilt with the engine's own constructor, and
        // one rebuild is cached per engine candidate so repeated reads hand back the same object.
        const iceTransportProto = typeof RTCIceTransport !== 'undefined' ? RTCIceTransport.prototype : null;
        if (iceTransportProto) {
          const transportCandidates = new WeakMap();
          const rewriteTransportCandidate = (candidate) => {
            if (!candidate || typeof candidate !== 'object') return candidate;
            let cached;
            try { cached = transportCandidates.get(candidate); } catch (_) { return candidate; }
            if (cached !== undefined) return cached;
            let rebuilt = null;
            try {
              const raw = String(candidate.candidate || '');
              const line = rewriteCandidateLine(raw);
              if (line !== raw) {
                rebuilt = new RTCIceCandidate({
                  candidate: line,
                  sdpMid: candidate.sdpMid,
                  sdpMLineIndex: candidate.sdpMLineIndex,
                  usernameFragment: candidate.usernameFragment,
                });
              }
            } catch (_) { rebuilt = null; }
            try { transportCandidates.set(candidate, rebuilt || candidate); } catch (_) {}
            return rebuilt || candidate;
          };
          if (typeof iceTransportProto.getLocalCandidates === 'function') {
            replaceMethod(iceTransportProto, 'getLocalCandidates', (orig) => function getLocalCandidates(...args) {
              const list = orig.apply(this, args);
              if (!Array.isArray(list)) return list;
              return list.map(rewriteTransportCandidate);
            });
          }
          if (typeof iceTransportProto.getSelectedCandidatePair === 'function') {
            replaceMethod(iceTransportProto, 'getSelectedCandidatePair', (orig) => function getSelectedCandidatePair(...args) {
              const pair = orig.apply(this, args);
              if (!pair || typeof pair !== 'object') return pair;
              // Only the local half of the pair names this machine; the remote candidate belongs to
              // the peer and stays the engine's own object.
              const local = rewriteTransportCandidate(pair.local);
              if (local === pair.local) return pair;
              try {
                const copy = Object.create(Object.getPrototypeOf(pair));
                for (const key of Object.getOwnPropertyNames(pair)) copy[key] = pair[key];
                copy.local = local;
                return copy;
              } catch (_) { return pair; }
            });
          }
        }
        // Local candidate statistics carry the same host addresses the SDP rewrite removes, so a
        // detector that gathers without ever reading a candidate event would still see the machine.
        // The report itself stays the engine's object - brand, toString tag and size are untouched -
        // and only the entries it hands out are replaced, through a per-report map.
        const statsEntries = new WeakMap();
        const statsIteratorReports = new WeakMap();
        let statsProto = null;
        let statsNativeForEach = null;
        try {
          statsProto = typeof RTCStatsReport !== 'undefined' ? RTCStatsReport.prototype : null;
          const forEachDescriptor = statsProto ? Object.getOwnPropertyDescriptor(statsProto, 'forEach') : null;
          statsNativeForEach = forEachDescriptor && typeof forEachDescriptor.value === 'function'
            ? forEachDescriptor.value : null;
        } catch (_) { statsProto = null; }
        const rewriteStatsEntry = (entry) => {
          try {
            if (!entry || entry.type !== 'local-candidate') return entry;
            // A relay allocation names the TURN server, so its own address stays; every other type
            // names this machine or its exit.
            const relay = String(entry.candidateType || '') === 'relay';
            const address = String(entry.address || entry.ip || '');
            const related = String(entry.relatedAddress || '');
            const needsAddress = !relay && Boolean(address) && address !== targetIp;
            // relatedAddress holds the base address the candidate was observed from - this machine
            // even for a relay allocation - so it is masked next to the rewritten address.
            const needsRelated = Boolean(related) && related !== '0.0.0.0';
            if (!needsAddress && !needsRelated) return entry;
            const copy = {};
            for (const key of Object.keys(entry)) copy[key] = entry[key];
            if (needsAddress) {
              if ('address' in copy) copy.address = targetIp;
              if ('ip' in copy) copy.ip = targetIp;
            }
            if (needsRelated && ('relatedAddress' in copy)) copy.relatedAddress = '0.0.0.0';
            // The engine derives a candidate foundation from its address, so the entry has to carry
            // the foundation that belongs to the address the page is being shown.
            if (needsAddress) {
              try {
                const probe = new RTCIceCandidate({
                  candidate: 'candidate:' + String(entry.foundation || '1') + ' 1 udp '
                    + String(entry.priority || 0) + ' ' + targetIp + ' ' + String(entry.port || 0)
                    + ' typ ' + String(entry.candidateType || 'host'),
                });
                if (probe && probe.foundation) copy.foundation = probe.foundation;
              } catch (_) {}
            }
            return copy;
          } catch (_) { return entry; }
        };
        const statsEntryFor = (map, value) => {
          if (!map || !map.size) return value;
          try {
            if (Array.isArray(value)) {
              const entry = map.get(value[0]);
              return entry ? [value[0], Object.assign({}, entry)] : value;
            }
            const id = value && value.id;
            if (id === undefined) return value;
            const entry = map.get(id);
            return entry ? Object.assign({}, entry) : value;
          } catch (_) { return value; }
        };
        const statsReplacements = new Map();
        const patchStatsMethod = (key, factory) => {
          try {
            if (!statsProto) return;
            const descriptor = Object.getOwnPropertyDescriptor(statsProto, key);
            if (!descriptor || typeof descriptor.value !== 'function' || descriptor.configurable === false) return;
            const native = descriptor.value;
            let replacement = statsReplacements.get(native);
            if (!replacement) {
              replacement = nativeLike(factory(native), native, native.name, native.length);
              statsReplacements.set(native, replacement);
            }
            Object.defineProperty(statsProto, key, {
              configurable: descriptor.configurable,
              enumerable: descriptor.enumerable,
              writable: descriptor.writable,
              value: replacement,
            });
          } catch (_) {}
        };
        let iteratorNextPatched = false;
        const wrapStatsIterator = (native) => function values() {
          const iterator = native.call(this);
          try {
            const map = statsEntries.get(this);
            if (map && map.size && iterator && typeof iterator === 'object') {
              statsIteratorReports.set(iterator, map);
              if (!iteratorNextPatched) {
                const iteratorProto = Object.getPrototypeOf(iterator);
                const nextDescriptor = iteratorProto ? Object.getOwnPropertyDescriptor(iteratorProto, 'next') : null;
                if (nextDescriptor && typeof nextDescriptor.value === 'function' && nextDescriptor.configurable !== false) {
                  const nativeNext = nextDescriptor.value;
                  iteratorNextPatched = true;
                  Object.defineProperty(iteratorProto, 'next', {
                    configurable: nextDescriptor.configurable,
                    enumerable: nextDescriptor.enumerable,
                    writable: nextDescriptor.writable,
                    value: nativeLike(function next() {
                      const result = nativeNext.call(this);
                      try {
                        const reportMap = statsIteratorReports.get(this);
                        if (!reportMap || !reportMap.size || !result || typeof result !== 'object' || result.done) return result;
                        const substituted = statsEntryFor(reportMap, result.value);
                        if (substituted === result.value) return result;
                        const copy = {};
                        for (const field of Object.keys(result)) copy[field] = field === 'value' ? substituted : result[field];
                        return copy;
                      } catch (_) { return result; }
                    }, nativeNext, nativeNext.name, nativeNext.length),
                  });
                }
              }
            }
          } catch (_) {}
          return iterator;
        };
        patchStatsMethod('get', (native) => function get(id) {
          const map = statsEntries.get(this);
          const entry = map && map.size ? map.get(id) : null;
          return entry ? Object.assign({}, entry) : native.call(this, id);
        });
        patchStatsMethod('forEach', (native) => function forEach(callback, thisArg) {
          const map = statsEntries.get(this);
          if (typeof callback !== 'function' || !map || !map.size) return native.call(this, callback, thisArg);
          return native.call(this, function (value, key, report) {
            return callback.call(thisArg, statsEntryFor(map, value), key, report);
          }, thisArg);
        });
        patchStatsMethod('values', wrapStatsIterator);
        patchStatsMethod('entries', wrapStatsIterator);
        try {
          if (statsProto && Object.getOwnPropertyDescriptor(statsProto, Symbol.iterator)) {
            patchStatsMethod(Symbol.iterator, wrapStatsIterator);
          }
        } catch (_) {}
        if (pcProto.getStats) {
          replaceMethod(pcProto, 'getStats', (orig) => async function getStats(...args) {
            const report = await orig.apply(this, args);
            try {
              if (report && typeof report === 'object' && statsNativeForEach) {
                const map = new Map();
                statsNativeForEach.call(report, (entry) => {
                  const rewritten = rewriteStatsEntry(entry);
                  if (rewritten !== entry && entry && entry.id !== undefined) map.set(entry.id, rewritten);
                });
                if (map.size) statsEntries.set(report, map);
              }
            } catch (_) {}
            return report;
          });
        }
      }
    } catch (_) {}
  }

`;
