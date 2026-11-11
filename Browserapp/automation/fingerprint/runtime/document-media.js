'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
module.exports = `  // --- media capture policy ---
  if (CFG.mediaDevices && (CFG.mediaDevices.blockCapture || CFG.mediaDevices.mode === 'empty')) {
    try {
      const receiver = navigator.mediaDevices;
      const proto = typeof MediaDevices !== 'undefined' ? MediaDevices.prototype : receiver;
      const denied = function getUserMedia() {
        return Promise.reject(new DOMException('Media capture is unavailable for this profile', CFG.mediaDevices.blockCapture ? 'NotAllowedError' : 'NotFoundError'));
      };
      if (receiver && proto) replaceMethod(proto, 'getUserMedia', (original) => guardReceiver(original, (value) => value === receiver, denied));
    } catch (_) {}
  }
  // --- mediaDevices ---
  if (CFG.mediaDevices && CFG.mediaDevices.mode && CFG.mediaDevices.mode !== 'real' && Array.isArray(CFG.mediaDevices.devices)) {
    try {
      const devProto = typeof MediaDeviceInfo !== "undefined" ? MediaDeviceInfo.prototype : Object.prototype;
      const deviceStates = new WeakMap();
      const patchedDeviceKeys = new Set();
      let deviceToJSONPatched = false;
      // A native device carries no own members: its four fields and toJSON live on the prototype.
      // Keep that shape and answer only the synthetic instances from a WeakMap; every other receiver
      // is forwarded to the original accessor so its brand checks stay intact.
      const patchDeviceAccessor = (key) => {
        if (!devProto || patchedDeviceKeys.has(key)) return true;
        const descriptor = Object.getOwnPropertyDescriptor(devProto, key);
        if (!descriptor || typeof descriptor.get !== 'function') return false;
        const nativeGet = descriptor.get;
        Object.defineProperty(devProto, key, {
          configurable: descriptor.configurable,
          enumerable: descriptor.enumerable,
          get: nativeLike(function deviceValue() {
            const state = deviceStates.get(this);
            if (state) return state[key];
            return nativeGet.call(this);
          }, nativeGet, 'get ' + key, 0),
          set: descriptor.set,
        });
        patchedDeviceKeys.add(key);
        return true;
      };
      const patchDeviceToJSON = () => {
        if (deviceToJSONPatched || !devProto) return;
        const descriptor = Object.getOwnPropertyDescriptor(devProto, 'toJSON');
        if (!descriptor || typeof descriptor.value !== 'function') return;
        const nativeToJSON = descriptor.value;
        Object.defineProperty(devProto, 'toJSON', {
          configurable: descriptor.configurable,
          enumerable: descriptor.enumerable,
          writable: descriptor.writable,
          value: nativeLike(function toJSON() {
            const state = deviceStates.get(this);
            if (state) return { deviceId: state.deviceId, kind: state.kind, label: state.label, groupId: state.groupId };
            return nativeToJSON.apply(this, arguments);
          }, nativeToJSON, 'toJSON', nativeToJSON.length),
        });
        deviceToJSONPatched = true;
      };
      const makeDevice = (kind, label, deviceId, groupId) => {
        const item = Object.create(devProto);
        const state = {
          deviceId: String(deviceId || ''),
          kind: String(kind || ''),
          label: String(label || ''),
          groupId: String(groupId || ''),
        };
        deviceStates.set(item, state);
        for (const key of Object.keys(state)) {
          if (!patchDeviceAccessor(key)) {
            Object.defineProperty(item, key, { value: state[key], enumerable: false, writable: false, configurable: true });
          }
        }
        patchDeviceToJSON();
        return item;
      };
      const devices = CFG.mediaDevices.devices.map((d) => makeDevice(d.kind, d.label, d.deviceId, d.groupId));
      // Chrome only publishes identifiers and labels once the user has granted a capture
      // permission; before that the same three entries come back with every field empty. Handing
      // out ids up front both diverged from the real surface and made the synthetic identifiers
      // readable without any permission prompt.
      const withheldDevices = CFG.mediaDevices.devices.map((d) => makeDevice(d.kind, "", "", ""));
      const enumerateForPermission = (nativeDevices) => {
        // The native enumeration already applies per-kind permission, document
        // visibility and Permissions Policy. Use only its exposure decisions;
        // never return host labels or identifiers to the caller.
        const present = new Set(), exposed = new Set(), withheld = new Set();
        for (const device of nativeDevices) {
          present.add(device.kind);
          if (device.label) exposed.add(device.kind);
        }
        return devices.flatMap((device, index) => {
          if (!present.has(device.kind)) return [];
          if (exposed.has(device.kind)) return [device];
          if (withheld.has(device.kind)) return [];
          withheld.add(device.kind);
          return [withheldDevices[index]];
        });
      };
      const mdProto = typeof MediaDevices !== 'undefined' ? MediaDevices.prototype : null;
      const realMediaDevices = (() => { try { return navigator.mediaDevices || null; } catch (_) { return null; } })();
      const isRealMediaDevices = (receiver) => receiver === realMediaDevices;
      const wrapEnumeration = (original) => guardReceiver(original, isRealMediaDevices, async function enumerateDevices(...args) {
        return enumerateForPermission(await original.apply(this, args));
      });
      if (mdProto && mdProto.enumerateDevices) {
        replaceMethod(mdProto, 'enumerateDevices', wrapEnumeration);
      } else if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        replaceMethod(navigator.mediaDevices, 'enumerateDevices', wrapEnumeration);
      }

      // MediaStreamTrack label & getSettings shielding:
      // Prevent getUserMedia from leaking native hardware device labels or deviceIds.
      const trackInfoMap = new WeakMap();
      const trackProto = typeof MediaStreamTrack !== 'undefined' ? MediaStreamTrack.prototype : null;
      if (trackProto) {
        const origLabelDesc = Object.getOwnPropertyDescriptor(trackProto, 'label');
        if (origLabelDesc && typeof origLabelDesc.get === 'function') {
          const nativeLabelGet = origLabelDesc.get;
          Object.defineProperty(trackProto, 'label', {
            configurable: origLabelDesc.configurable,
            enumerable: origLabelDesc.enumerable,
            get: nativeLike(function label() {
              const info = trackInfoMap.get(this);
              if (info && info.label !== undefined) return info.label;
              return nativeLabelGet.call(this);
            }, nativeLabelGet, 'get label', 0),
          });
        }

        const origGetSettings = trackProto.getSettings;
        if (typeof origGetSettings === 'function') {
          Object.defineProperty(trackProto, 'getSettings', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: nativeLike(function getSettings() {
              const settings = origGetSettings.apply(this, arguments);
              const info = trackInfoMap.get(this);
              if (info && settings && typeof settings === 'object') {
                if (info.deviceId !== undefined) settings.deviceId = info.deviceId;
                if (info.groupId !== undefined) settings.groupId = info.groupId;
              }
              return settings;
            }, origGetSettings, 'getSettings', 0),
          });
        }

        const origTrackClone = trackProto.clone;
        if (typeof origTrackClone === 'function') {
          Object.defineProperty(trackProto, 'clone', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: nativeLike(function clone() {
              const cloned = origTrackClone.apply(this, arguments);
              const info = trackInfoMap.get(this);
              if (info && cloned) trackInfoMap.set(cloned, info);
              return cloned;
            }, origTrackClone, 'clone', 0),
          });
        }
      }

      if (typeof MediaStream !== 'undefined' && MediaStream.prototype) {
        const origStreamClone = MediaStream.prototype.clone;
        if (typeof origStreamClone === 'function') {
          Object.defineProperty(MediaStream.prototype, 'clone', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: nativeLike(function clone() {
              const clonedStream = origStreamClone.apply(this, arguments);
              if (clonedStream && typeof clonedStream.getTracks === 'function') {
                const origTracks = typeof this.getTracks === 'function' ? this.getTracks() : [];
                const newTracks = clonedStream.getTracks();
                for (let i = 0; i < newTracks.length; i += 1) {
                  const origT = origTracks[i];
                  const info = origT ? trackInfoMap.get(origT) : null;
                  if (info && newTracks[i]) trackInfoMap.set(newTracks[i], info);
                }
              }
              return clonedStream;
            }, origStreamClone, 'clone', 0),
          });
        }
      }

      const audioDevices = CFG.mediaDevices.devices.filter((d) => d.kind === 'audioinput');
      const videoDevices = CFG.mediaDevices.devices.filter((d) => d.kind === 'videoinput');
      const nativeToSpoofedMap = new Map();

      const assignTrackInfo = (track, constraints) => {
        if (!track || typeof track.kind !== 'string') return;
        const isAudio = track.kind === 'audio';
        const candidates = isAudio ? audioDevices : videoDevices;
        if (!candidates.length) return;

        let reqId = null;
        try {
          const trackConstraint = isAudio ? constraints?.audio : constraints?.video;
          if (trackConstraint && typeof trackConstraint === 'object') {
            reqId = trackConstraint.deviceId?.exact || trackConstraint.deviceId?.ideal || trackConstraint.deviceId;
            if (typeof reqId === 'object' && reqId) reqId = reqId.exact || reqId.ideal;
          }
        } catch (_) {}

        let matched = null;
        if (reqId && typeof reqId === 'string') {
          matched = candidates.find((c) => c.deviceId === reqId);
        }

        if (!matched) {
          let nativeDevId = '';
          try {
            const settings = trackProto?.getSettings ? trackProto.getSettings.call(track) : {};
            nativeDevId = settings.deviceId || '';
          } catch (_) {}
          const mapKey = track.kind + ':' + nativeDevId;
          if (nativeToSpoofedMap.has(mapKey)) {
            matched = nativeToSpoofedMap.get(mapKey);
          } else {
            const usedCount = Array.from(nativeToSpoofedMap.keys()).filter((k) => k.startsWith(track.kind + ':')).length;
            matched = candidates[usedCount % candidates.length];
            nativeToSpoofedMap.set(mapKey, matched);
          }
        }

        if (matched) {
          trackInfoMap.set(track, {
            label: String(matched.label || ''),
            deviceId: String(matched.deviceId || ''),
            groupId: String(matched.groupId || ''),
          });
        }
      };

      const wrapGetUserMedia = (origGUM) => {
        if (typeof origGUM !== 'function') return origGUM;
        return nativeLike(async function getUserMedia(constraints) {
          const stream = await origGUM.call(this, constraints);
          try {
            if (stream && typeof stream.getTracks === 'function') {
              for (const track of stream.getTracks()) {
                assignTrackInfo(track, constraints);
              }
            }
          } catch (_) {}
          return stream;
        }, origGUM, 'getUserMedia', origGUM.length);
      };

      if (mdProto && mdProto.getUserMedia) {
        replaceMethod(mdProto, 'getUserMedia', (original) => wrapGetUserMedia(original));
      } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        replaceMethod(navigator.mediaDevices, 'getUserMedia', (original) => wrapGetUserMedia(original));
      }
    } catch (_) {}
  }

  // --- speech voices ---
  if (CFG.speech && CFG.speech.mode === "blocked") {
    try {
      const mainSpProto = typeof SpeechSynthesis !== "undefined" ? SpeechSynthesis.prototype : null;
      const mainPausedDesc = mainSpProto ? Object.getOwnPropertyDescriptor(mainSpProto, "paused") : null;
      const patchSpeechBlockedForWindow = (targetWin) => {
        if (!targetWin) return;
        try {
          const spProto = targetWin.SpeechSynthesis ? targetWin.SpeechSynthesis.prototype : mainSpProto;
          if (!spProto && !targetWin.speechSynthesis) return;
          const targetPausedDesc = spProto ? Object.getOwnPropertyDescriptor(spProto, "paused") : mainPausedDesc;
          const isSpeechReceiver = (receiver) => {
            if (!receiver || typeof receiver !== "object") return false;
            if (targetPausedDesc && typeof targetPausedDesc.get === "function") {
              try {
                targetPausedDesc.get.call(receiver);
                return true;
              } catch (_) {
                return false;
              }
            }
            return receiver === targetWin.speechSynthesis || receiver === globalThis.speechSynthesis;
          };
          const serveEmpty = function getVoices() { return []; };
          if (spProto && spProto.getVoices) {
            replaceMethod(spProto, "getVoices", (original) => guardReceiver(original, isSpeechReceiver, serveEmpty));
          } else if (targetWin.speechSynthesis) {
            replaceMethod(targetWin.speechSynthesis, "getVoices", (original) => guardReceiver(original, isSpeechReceiver, serveEmpty));
          }
        } catch (_) {}
      };
      patchSpeechBlockedForWindow(globalThis);
      subWindowSyncHooks.push((subWin) => { patchSpeechBlockedForWindow(subWin); });
    } catch (_) {}
  } else if (CFG.speech && CFG.speech.mode === "noise" && Array.isArray(CFG.speech.voices)) {
    try {
      const mockVoiceSet = new WeakSet();
      const patchStructuredCloneForWindow = (targetWin) => {
        if (!targetWin || typeof targetWin.structuredClone !== "function") return;
        const origStructuredClone = targetWin.structuredClone;
        const checkVoiceClone = (val, seen = new WeakSet()) => {
          if (!val || typeof val !== "object") return;
          if (mockVoiceSet.has(val)) {
            const DOMEx = targetWin.DOMException || DOMException;
            throw new DOMEx("Failed to execute 'structuredClone' on 'Window': SpeechSynthesisVoice object could not be cloned.", "DataCloneError");
          }
          if (seen.has(val)) return;
          seen.add(val);
          if (Array.isArray(val)) {
            for (let i = 0; i < val.length; i++) checkVoiceClone(val[i], seen);
          } else if (Object.prototype.toString.call(val) === "[object Object]") {
            for (const k of Object.keys(val)) checkVoiceClone(val[k], seen);
          }
        };
        const patchedStructuredClone = nativeLike(function structuredClone(value, options) {
          checkVoiceClone(value);
          return origStructuredClone.apply(this, arguments);
        }, origStructuredClone, "structuredClone", 1);
        try {
          Object.defineProperty(targetWin, "structuredClone", {
            configurable: true,
            writable: true,
            enumerable: true,
            value: patchedStructuredClone,
          });
        } catch (_) {}
      };
      patchStructuredCloneForWindow(globalThis);
      subWindowSyncHooks.push((subWin) => { patchStructuredCloneForWindow(subWin); });

      const voiceProto = typeof SpeechSynthesisVoice !== "undefined" ? SpeechSynthesisVoice.prototype : Object.prototype;
      const voiceStates = new WeakMap();
      const patchedVoiceProtos = new WeakSet();
      // Native voices keep their fields on the prototype as well. Use the same synthetic-instance
      // WeakMap pattern so the table cannot be distinguished by an own-property scan.
      const patchVoiceAccessor = (proto, key) => {
        if (!proto) return true;
        const descriptor = Object.getOwnPropertyDescriptor(proto, key);
        if (!descriptor || typeof descriptor.get !== "function") return false;
        const nativeGet = descriptor.get;
        Object.defineProperty(proto, key, {
          configurable: descriptor.configurable,
          enumerable: descriptor.enumerable,
          get: nativeLike(function voiceValue() {
            const state = voiceStates.get(this);
            if (state) return state[key];
            return nativeGet.call(this);
          }, nativeGet, "get " + key, 0),
          set: descriptor.set,
        });
        return true;
      };
      const patchVoiceProto = (proto) => {
        if (!proto || patchedVoiceProtos.has(proto)) return;
        patchedVoiceProtos.add(proto);
        for (const key of ["name", "lang", "default", "localService", "voiceURI"]) {
          patchVoiceAccessor(proto, key);
        }
      };
      patchVoiceProto(voiceProto);

      const createVoicesForProto = (proto) => {
        return CFG.speech.voices.map((v) => {
          const voice = Object.create(proto);
          const state = {
            name: String(v.name || ""),
            lang: String(v.lang || "en-US"),
            default: Boolean(v.default),
            localService: v.localService !== false,
            voiceURI: String(v.voiceURI || v.name || ""),
          };
          mockVoiceSet.add(voice);
          voiceStates.set(voice, state);
          for (const key of Object.keys(state)) {
            if (!patchVoiceAccessor(proto, key)) {
              Object.defineProperty(voice, key, { value: state[key], enumerable: false, writable: false, configurable: true });
            }
          }
          return voice;
        });
      };

      const voices = createVoicesForProto(voiceProto);

      // The table is published asynchronously by the engine: the first synchronous call answers with
      // an empty list and the populated one only becomes observable once the engine announces the
      // load. Returning the table straight away left a timing signal, so it is withheld until the
      // engine reports readiness - the same signal a genuine build waits for, which also keeps the
      // release instant aligned with the native one instead of being pinned to a fixed delay.
      // Nothing is synthesised: a fabricated event would carry isTrusted === false and be a tell of
      // its own. A bounded fallback releases the table on a build that never reports readiness.
      let voicesReady = false;
      const markVoicesReady = () => { voicesReady = true; };
      try {
        const sp = globalThis.speechSynthesis;
        if (sp && typeof sp.addEventListener === "function") {
          sp.addEventListener('voiceschanged', markVoicesReady, { once: true });
        }
      } catch (_) {}
      try {
        setTimeout(markVoicesReady, 1000);
      } catch (_) { markVoicesReady(); }
      const readVoices = () => (voicesReady ? voices.slice() : []);

      const mainSpProto = typeof SpeechSynthesis !== "undefined" ? SpeechSynthesis.prototype : null;
      const mainPausedDesc = mainSpProto ? Object.getOwnPropertyDescriptor(mainSpProto, "paused") : null;

      const windowVoicesMap = new WeakMap();
      windowVoicesMap.set(globalThis, voices);

      const patchSpeechForWindow = (targetWin) => {
        if (!targetWin) return;
        try {
          const spProto = targetWin.SpeechSynthesis ? targetWin.SpeechSynthesis.prototype : mainSpProto;
          if (!spProto && !targetWin.speechSynthesis) return;

          const targetVoiceProto = targetWin.SpeechSynthesisVoice ? targetWin.SpeechSynthesisVoice.prototype : voiceProto;
          if (targetVoiceProto) {
            patchVoiceProto(targetVoiceProto);
          }

          let winVoices = windowVoicesMap.get(targetWin);
          if (!winVoices) {
            winVoices = targetVoiceProto ? createVoicesForProto(targetVoiceProto) : voices;
            windowVoicesMap.set(targetWin, winVoices);
          }

          const targetReadVoices = () => (voicesReady ? winVoices.slice() : []);
          const targetPausedDesc = spProto ? Object.getOwnPropertyDescriptor(spProto, "paused") : mainPausedDesc;

          const isSpeechReceiver = (receiver) => {
            if (!receiver || typeof receiver !== "object") return false;
            if (targetPausedDesc && typeof targetPausedDesc.get === "function") {
              try {
                targetPausedDesc.get.call(receiver);
                return true;
              } catch (_) {
                return false;
              }
            }
            return receiver === targetWin.speechSynthesis || receiver === globalThis.speechSynthesis;
          };

          const serveVoices = function getVoices() { return targetReadVoices(); };
          if (spProto && spProto.getVoices) {
            replaceMethod(spProto, "getVoices", (original) => guardReceiver(original, isSpeechReceiver, serveVoices));
          } else if (targetWin.speechSynthesis) {
            replaceMethod(targetWin.speechSynthesis, "getVoices", (original) => guardReceiver(original, isSpeechReceiver, serveVoices));
          }

          if (targetWin.speechSynthesis && typeof targetWin.speechSynthesis.addEventListener === "function") {
            try {
              targetWin.speechSynthesis.addEventListener('voiceschanged', markVoicesReady, { once: true });
            } catch (_) {}
          }
        } catch (_) {}
      };

      patchSpeechForWindow(globalThis);
      subWindowSyncHooks.push((subWin) => { patchSpeechForWindow(subWin); });
    } catch (_) {}
  }

  // --- battery ---
  if (CFG.battery && CFG.battery.mode === 'blocked') {
    try {
      const blocked = function getBattery() {
        return Promise.reject(new DOMException('Battery status is not allowed by Permissions Policy', 'NotAllowedError'));
      };
      const navProto = typeof Navigator !== "undefined" ? Navigator.prototype : null;
      const isNavigatorReceiver = (receiver) => receiver === navigator;
      if (navProto && navProto.getBattery) {
        replaceMethod(navProto, 'getBattery', (original) => guardReceiver(original, isNavigatorReceiver, blocked));
      } else if (navigator.getBattery) {
        replaceMethod(navigator, 'getBattery', (original) => guardReceiver(original, isNavigatorReceiver, blocked));
      }
    } catch (_) {}
  } else if (CFG.battery && CFG.battery.mode === 'noise' && CFG.battery.value && !CFG.battery.value.blocked) {
    try {
      const snap = CFG.battery.value;
      const state = {
        charging: Boolean(snap.charging),
        chargingTime: snap.chargingTime == null ? Infinity : Number(snap.chargingTime),
        dischargingTime: snap.dischargingTime == null ? Infinity : Number(snap.dischargingTime),
        level: Math.min(1, Math.max(0, Number(snap.level) || 0)),
      };
      const battProto = typeof BatteryManager !== 'undefined' ? BatteryManager.prototype : null;
      const spoofedStates = new WeakMap();
      const patchedKeys = new Set();
      // A real manager keeps all four values on the prototype; defining them on the instance is an
      // own-property shape that no stock build has. Install the replacement accessors on the native
      // prototype and delegate every receiver we did not issue back to the original getter.
      const patchBatteryAccessor = (key) => {
        if (!battProto || patchedKeys.has(key)) return;
        const descriptor = Object.getOwnPropertyDescriptor(battProto, key);
        if (!descriptor || typeof descriptor.get !== 'function') return;
        const nativeGet = descriptor.get;
        const wrappedGet = nativeLike(function batteryValue() {
          const value = spoofedStates.get(this);
          if (value && Object.prototype.hasOwnProperty.call(value, key)) return value[key];
          return nativeGet.call(this);
        }, nativeGet, 'get ' + key, 0);
        Object.defineProperty(battProto, key, {
          configurable: descriptor.configurable,
          enumerable: descriptor.enumerable,
          get: wrappedGet,
          set: descriptor.set,
        });
        patchedKeys.add(key);
      };
      const serveBattery = (original) => function getBattery() {
        return Promise.resolve(original.call(this)).then((manager) => {
          if (!manager) return manager;
          spoofedStates.set(manager, state);
          for (const key of Object.keys(state)) patchBatteryAccessor(key);
          return manager;
        });
      };
      const navProto = typeof Navigator !== "undefined" ? Navigator.prototype : null;
      const isNavigatorReceiver = (receiver) => receiver === navigator;
      if (navProto && navProto.getBattery) {
        replaceMethod(navProto, 'getBattery', (original) => guardReceiver(original, isNavigatorReceiver, serveBattery(original)));
      } else if (navigator.getBattery) {
        replaceMethod(navigator, 'getBattery', (original) => guardReceiver(original, isNavigatorReceiver, serveBattery(original)));
      }
    } catch (_) {}
  }

  // --- navigator.connection persona ---
  // Real desktop Chrome always ships NetworkInformation; its effectiveType/downlink/rtt answer
  // from the host NIC, a stable cross-API contradiction once UA/screen claim another machine
  // class. Persona values ride the native prototype accessors (battery pattern): receivers we
  // issued get the profile answer, anything else falls through to the native getter. iOS
  // personas delete navigator.connection upstream, so the presence check keeps them intact.
  if (CFG.connection && typeof navigator !== "undefined" && navigator.connection
    && typeof NetworkInformation !== "undefined" && NetworkInformation.prototype) {
    try {
      const netProto = NetworkInformation.prototype;
      const realConnection = navigator.connection;
      const netState = CFG.connection;
      const patchedNetKeys = new Set();
      const patchNetworkAccessor = (key) => {
        if (patchedNetKeys.has(key)) return;
        const descriptor = Object.getOwnPropertyDescriptor(netProto, key);
        if (!descriptor || typeof descriptor.get !== "function") return;
        const nativeGet = descriptor.get;
        const wrappedGet = nativeLike(function networkValue() {
          const original = nativeGet.call(this);
          if (this === realConnection && Object.prototype.hasOwnProperty.call(netState, key)) return netState[key];
          return original;
        }, nativeGet, "get " + key, 0);
        Object.defineProperty(netProto, key, {
          configurable: descriptor.configurable,
          enumerable: descriptor.enumerable,
          get: wrappedGet,
          set: descriptor.set,
        });
        patchedNetKeys.add(key);
      };
      for (const key of ["type", "effectiveType", "downlink", "rtt", "saveData"]) patchNetworkAccessor(key);
    } catch (_) {}
  }

  // --- bluetooth adapter ---
  // Keep the native interface and prototype shape, but answer as a machine without an adapter.
  // Hiding the whole interface would itself diverge from a desktop Chrome secure context.
  if (CFG.bluetooth && CFG.bluetooth.mode === 'blocked') {
    try {
      const receiver = navigator.bluetooth;
      const btProto = typeof Bluetooth !== 'undefined' ? Bluetooth.prototype : null;
      const isBluetoothReceiver = (value) => value === receiver;
      if (receiver && btProto && typeof btProto.getAvailability === 'function') {
        replaceMethod(btProto, 'getAvailability', (original) => guardReceiver(original, isBluetoothReceiver, function getAvailability() {
          return Promise.resolve(false);
        }));
      }
      if (receiver && btProto && typeof btProto.requestDevice === 'function') {
        replaceMethod(btProto, 'requestDevice', (original) => guardReceiver(original, isBluetoothReceiver, function requestDevice() {
          return Promise.reject(new DOMException('Bluetooth adapter not available.', 'NotFoundError'));
        }));
      }
    } catch (_) {}
  }

`;
