'use strict';

// M-1/M-2 (wave 4): document-timezone-audio.js and worker-timezone.js were
// same-source twins of the timezone core (426/417 lines, byte-identical
// after comment normalization) already drifting apart in the replace helper
// name and header docs. One factory renders the shared core parameterized
// on the realm's replace helper and per-realm header comment; the document
// realm additionally appends the audio-context perturbation block (workers
// expose no AudioContext). The core literals below are template literals
// carrying the original source bytes verbatim (only backtick and ${ are
// escaped), so evaluation reproduces the original fragments exactly — the
// only edits are two embedded comments whose document/worker phrasings had
// drifted while saying the same thing, now unified. The __REPLACE_HELPER__(
// placeholder is substituted with split/join; String.prototype.replace
// calls inside the emitted code are never touched because the placeholder
// is a full identifier token, not a bare method name.
const TZ_CORE = `  const engineReportsTargetZone = (() => {
    try {
      const want = new Intl.DateTimeFormat('en-US', { timeZone: String(CFG.timezone).trim() }).resolvedOptions().timeZone;
      return new Intl.DateTimeFormat().resolvedOptions().timeZone === want;
    } catch (_) { return false; }
  })();
  if (CFG.timezone && !engineReportsTargetZone) {
    try {
      const targetTz = String(CFG.timezone).trim();
      new Intl.DateTimeFormat('en-US', { timeZone: targetTz }).format();

      const OrigDateTimeFormat = Intl.DateTimeFormat;
      const DateTimeFormatProto = OrigDateTimeFormat.prototype;

      const origSetTime = Date.prototype.setTime;
      const origGetTzOffset = Date.prototype.getTimezoneOffset;
      const origGetTime = Date.prototype.getTime;
      // Native getTime is the brand check: a receiver that is not a Date has to throw exactly the
      // TypeError the engine throws rather than answer with a coerced value.
      const asDate = (self) => { origGetTime.call(self); return self; };
      // The zone offset for an instant comes straight from ICU numeric long-offset form. Rebuilding
      // the wall clock through Date.UTC is not equivalent: that route cannot represent years outside
      // 1..9999 or before the common era, and it drops the sub-minute offsets some zones had.
      const offsetFormatter = new OrigDateTimeFormat('en-US', { timeZone: targetTz, timeZoneName: 'longOffset' });
      const getOffsetMinutes = (date) => {
        try {
          const ts = date.getTime();
          if (isNaN(ts)) return NaN;
          const raw = (offsetFormatter.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value || '').replace(/^GMT/, '');
          const m = raw.match(/^([+-])(\\d{1,2})(?::(\\d{2}))?(?::(\\d{2}))?$/);
          if (!m) return 0;
          const seconds = Number(m[2]) * 3600 + Number(m[3] || 0) * 60 + Number(m[4] || 0);
          return (m[1] === '-' ? 1 : -1) * (seconds / 60);
        } catch (_) {
          return 0;
        }
      };
      // ICU has no long zone name for every instant, while V8 still prints one: outside the modern
      // metazone range the long form degrades to a numeric offset. A reference instant in the same
      // standard/daylight state supplies the name V8 prints, chosen by nearest offset.
      const zoneNameRefs = (() => {
        const nameAt = (ms) => new OrigDateTimeFormat(undefined, { timeZone: targetTz, timeZoneName: 'long' })
          .formatToParts(new Date(ms)).find((p) => p.type === 'timeZoneName')?.value || '';
        const winter = Date.UTC(2026, 0, 15, 12);
        const summer = Date.UTC(2026, 6, 15, 12);
        return [{ offset: getOffsetMinutes(new Date(winter)), name: nameAt(winter) }, { offset: getOffsetMinutes(new Date(summer)), name: nameAt(summer) }];
      })();
      const zoneNameFor = (date) => {
        const name = new OrigDateTimeFormat(undefined, { timeZone: targetTz, timeZoneName: 'long' })
          .formatToParts(date).find((p) => p.type === 'timeZoneName')?.value || '';
        const offset = getOffsetMinutes(date);
        const exact = zoneNameRefs.find((ref) => ref.offset === offset);
        if (exact) return /^GMT/.test(name) ? (exact.name || name) : name;
        let best = zoneNameRefs[0];
        for (const ref of zoneNameRefs) if (Math.abs(ref.offset - offset) < Math.abs(best.offset - offset)) best = ref;
        return best.name || name;
      };

      const getLocalComponents = (date) => {
        const off = getOffsetMinutes(date);
        const shifted = new Date(date.getTime() - off * 60000);
        if (!isNaN(shifted.getTime())) return shifted;
        // ICU still answers at the domain edges, where the shifted instant is not representable, and
        // the wall clock there can itself sit past the Date domain, so the fields are handed back as
        // a read-only view instead of a Date that cannot exist.
        const parts = new OrigDateTimeFormat('en-US', {
          timeZone: targetTz, era: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        }).formatToParts(date);
        const get = (type) => parts.find((p) => p.type === type)?.value || '';
        // Self-contained year read: the old branch referenced an undeclared identifier, so any
        // Date at the domain edge threw a ReferenceError through to the page.
        const year = /BC/i.test(get('era')) ? 1 - parseInt(get('year'), 10) : parseInt(get('year'), 10);
        const month = parseInt(get('month'), 10) - 1;
        const day = parseInt(get('day'), 10);
        const hour = parseInt(get('hour'), 10) % 24;
        const minute = parseInt(get('minute'), 10);
        const second = parseInt(get('second'), 10);
        const millisecond = ((date.getTime() % 1000) + 1000) % 1000;
        const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();
        const invalid = () => NaN;
        return {
          getUTCFullYear: () => year,
          getUTCMonth: () => month,
          getUTCDate: () => day,
          getUTCDay: () => weekday,
          getUTCHours: () => hour,
          getUTCMinutes: () => minute,
          getUTCSeconds: () => second,
          getUTCMilliseconds: () => millisecond,
          getTime: invalid,
          setUTCFullYear: invalid,
          setUTCMonth: invalid,
          setUTCDate: invalid,
          setUTCHours: invalid,
          setUTCMinutes: invalid,
          setUTCSeconds: invalid,
          setUTCMilliseconds: invalid,
        };
      };

      // Reading timeZone here would add an access the engine already makes, and copying the options
      // would read every other option a second time, so a prototype-chained copy carries the default
      // zone while the page options stay the only source for everything else. A null argument has to
      // reach the engine unchanged, because the TypeError it raises is part of the surface.
      const withDefaultTimeZone = (options) => {
        if (options === undefined) return { timeZone: targetTz };
        if (options === null) return options;
        const boxed = Object(options);
        const opts = Object.create(boxed);
        // The engine reads timeZone exactly once, so the substitute is a lazy accessor rather than a
        // value: it forwards to the page options on the engine read and answers the target zone when
        // the page left the option absent or undefined. Copying the options would instead read every
        // other option a second time.
        let read = false;
        let resolved = targetTz;
        Object.defineProperty(opts, 'timeZone', {
          enumerable: true,
          configurable: true,
          get() {
            if (!read) {
              read = true;
              const fromPage = boxed.timeZone;
              resolved = fromPage === undefined ? targetTz : fromPage;
            }
            return resolved;
          },
        });
        return opts;
      };
      const PatchedDateTimeFormat = function DateTimeFormat(locales, options) {
        const opts = withDefaultTimeZone(options);
        if (!(this instanceof PatchedDateTimeFormat)) {
          return Reflect.construct(OrigDateTimeFormat, [locales, opts]);
        }
        return Reflect.construct(OrigDateTimeFormat, [locales, opts], new.target);
      };
      Object.defineProperty(PatchedDateTimeFormat, 'prototype', {
        value: DateTimeFormatProto,
        writable: false,
        enumerable: false,
        configurable: false,
      });
      // Without this the prototype's constructor still points at the original, so the one-line
      // check Intl.DateTimeFormat.prototype.constructor === Intl.DateTimeFormat returns false.
      try {
        Object.defineProperty(DateTimeFormatProto, 'constructor', {
          configurable: true, writable: true, enumerable: false, value: PatchedDateTimeFormat,
        });
      } catch (_) {}
      if (OrigDateTimeFormat.supportedLocalesOf) {
        PatchedDateTimeFormat.supportedLocalesOf = nativeLike(
          function supportedLocalesOf(...args) { return OrigDateTimeFormat.supportedLocalesOf.apply(OrigDateTimeFormat, args); },
          OrigDateTimeFormat.supportedLocalesOf,
          'supportedLocalesOf',
          1
        );
      }
      nativeLike(PatchedDateTimeFormat, OrigDateTimeFormat, 'DateTimeFormat', 0, true);
      Intl.DateTimeFormat = PatchedDateTimeFormat;

      __REPLACE_HELPER__(Date.prototype, 'getTimezoneOffset', () => function getTimezoneOffset() {
        const minutes = getOffsetMinutes(asDate(this));
        if (!isFinite(minutes)) return NaN;
        const whole = Math.trunc(minutes);
        return whole === 0 ? 0 : whole;
      });



      // Hottest path in the injection: Date.prototype.toString previously built
      // TWO ICU formatters per call (this one plus the offset probe). The options
      // are fixed for the injection lifetime, so build once and reuse.
      let toPartsFormatter = null;
      const getToPartsFormatter = () => {
        if (!toPartsFormatter) {
          // en-US on purpose: the weekday and month abbreviations V8 prints are fixed English,
          // while the zone name in the parenthetical follows the default locale (zoneNameFor).
          toPartsFormatter = new OrigDateTimeFormat('en-US', {
            timeZone: targetTz,
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZoneName: 'long'
          });
        }
        return toPartsFormatter;
      };
      const formatTzDate = (date) => {
        try {
          const parts = getToPartsFormatter().formatToParts(date);
          const get = (type) => parts.find(p => p.type === type)?.value || '';
          const weekday = get('weekday');
          const month = get('month');
          const day = get('day');
          const localYear = getLocalComponents(date).getUTCFullYear();
          const year = localYear < 0 ? '-' + String(-localYear).padStart(4, '0') : String(localYear).padStart(4, '0');
          const hour = (get('hour') === '24' ? '00' : get('hour')).padStart(2, '0');
          const minute = get('minute').padStart(2, '0');
          const second = get('second').padStart(2, '0');
          const tzName = zoneNameFor(date);
          const diffMins = getOffsetMinutes(date);
          const sign = diffMins <= 0 ? '+' : '-';
          const absMins = Math.trunc(Math.abs(diffMins));
          const offH = String(Math.floor(absMins / 60)).padStart(2, '0');
          const offM = String(absMins % 60).padStart(2, '0');
          const gmt = 'GMT' + sign + offH + offM;
          return weekday + ' ' + month + ' ' + day + ' ' + year + ' ' + hour + ':' + minute + ':' + second + ' ' + gmt + ' (' + tzName + ')';
        } catch (_) {
          return date.toISOString();
        }
      };

      __REPLACE_HELPER__(Date.prototype, 'toString', () => function toString() {
        if (isNaN(asDate(this).getTime())) return 'Invalid Date';
        return formatTzDate(this);
      });

      __REPLACE_HELPER__(Date.prototype, 'toTimeString', () => function toTimeString() {
        if (isNaN(asDate(this).getTime())) return 'Invalid Date';
        const full = formatTzDate(this);
        const match = full.match(/[0-9]{4}[ ]+(.*)/);
        return match ? match[1] : full;
      });

      __REPLACE_HELPER__(Date.prototype, 'toDateString', () => function toDateString() {
        if (isNaN(asDate(this).getTime())) return 'Invalid Date';
        const full = formatTzDate(this);
        return full.split(' ').slice(0, 4).join(' ');
      });

      __REPLACE_HELPER__(Date.prototype, 'toLocaleString', (orig) => function toLocaleString(locales, options) {
        const opts = options && options.timeZone ? options : Object.assign({}, options, { timeZone: targetTz });
        return orig.call(this, locales, opts);
      });

      __REPLACE_HELPER__(Date.prototype, 'toLocaleDateString', (orig) => function toLocaleDateString(locales, options) {
        const opts = options && options.timeZone ? options : Object.assign({}, options, { timeZone: targetTz });
        return orig.call(this, locales, opts);
      });

      __REPLACE_HELPER__(Date.prototype, 'toLocaleTimeString', (orig) => function toLocaleTimeString(locales, options) {
        const opts = options && options.timeZone ? options : Object.assign({}, options, { timeZone: targetTz });
        return orig.call(this, locales, opts);
      });

      __REPLACE_HELPER__(Date.prototype, 'getHours', () => function getHours() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCHours();
      });

      __REPLACE_HELPER__(Date.prototype, 'getDate', () => function getDate() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCDate();
      });

      __REPLACE_HELPER__(Date.prototype, 'getDay', () => function getDay() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCDay();
      });

      __REPLACE_HELPER__(Date.prototype, 'getFullYear', () => function getFullYear() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCFullYear();
      });

      __REPLACE_HELPER__(Date.prototype, 'getMonth', () => function getMonth() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCMonth();
      });

      __REPLACE_HELPER__(Date.prototype, 'getMinutes', () => function getMinutes() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCMinutes();
      });

      __REPLACE_HELPER__(Date.prototype, 'getSeconds', () => function getSeconds() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCSeconds();
      });

      __REPLACE_HELPER__(Date.prototype, 'getMilliseconds', () => function getMilliseconds() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCMilliseconds();
      });

      __REPLACE_HELPER__(Date.prototype, 'getYear', () => function getYear() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCFullYear() - 1900;
      });

      // Local-time setters must land in the spoofed zone too. Reading a component through the
      // patched getters while writing it through the host zone leaves the two disagreeing,
      // which is a stronger signal than not spoofing at all.
      const setLocal = (self, mutate) => {
        if (isNaN(asDate(self).getTime())) return NaN;
        const shifted = getLocalComponents(self);
        mutate(shifted);
        // Resolve the offset twice: the write may have crossed a DST boundary.
        let guess = shifted.getTime() + getOffsetMinutes(self) * 60000;
        guess = shifted.getTime() + getOffsetMinutes(new Date(guess)) * 60000;
        return origSetTime.call(self, guess);
      };
      __REPLACE_HELPER__(Date.prototype, 'setFullYear', () => function setFullYear(y, m, d) {
        return setLocal(this, (x) => {
          x.setUTCFullYear(y);
          if (m !== undefined) x.setUTCMonth(m);
          if (d !== undefined) x.setUTCDate(d);
        });
      });
      __REPLACE_HELPER__(Date.prototype, 'setMonth', () => function setMonth(m, d) {
        return setLocal(this, (x) => { x.setUTCMonth(m); if (d !== undefined) x.setUTCDate(d); });
      });
      __REPLACE_HELPER__(Date.prototype, 'setDate', () => function setDate(d) {
        return setLocal(this, (x) => x.setUTCDate(d));
      });
      __REPLACE_HELPER__(Date.prototype, 'setHours', () => function setHours(h, mi, sec, ms) {
        return setLocal(this, (x) => {
          x.setUTCHours(h);
          if (mi !== undefined) x.setUTCMinutes(mi);
          if (sec !== undefined) x.setUTCSeconds(sec);
          if (ms !== undefined) x.setUTCMilliseconds(ms);
        });
      });
      __REPLACE_HELPER__(Date.prototype, 'setMinutes', () => function setMinutes(mi, sec, ms) {
        return setLocal(this, (x) => {
          x.setUTCMinutes(mi);
          if (sec !== undefined) x.setUTCSeconds(sec);
          if (ms !== undefined) x.setUTCMilliseconds(ms);
        });
      });
      __REPLACE_HELPER__(Date.prototype, 'setSeconds', () => function setSeconds(sec, ms) {
        return setLocal(this, (x) => { x.setUTCSeconds(sec); if (ms !== undefined) x.setUTCMilliseconds(ms); });
      });
      __REPLACE_HELPER__(Date.prototype, 'setMilliseconds', () => function setMilliseconds(ms) {
        return setLocal(this, (x) => x.setUTCMilliseconds(ms));
      });

      // new Date(y, m, d, ...) and Date.parse('2026-01-15 12:00:00') are defined against the
      // *local* zone. Left alone they resolve against the host zone while every getter above
      // reports the spoofed one, so a two-line script recovers the real timezone.
      try {
        const OrigDate = Date;
        const localToUtc = (ms) => {
          if (isNaN(ms)) return NaN;
          // getOffsetMinutes keeps the JS sign convention (UTC+05:30 reports -330), so shifting
          // a wall-clock reading in the spoofed zone back to a real instant means adding it.
          let out = ms + getOffsetMinutes(new OrigDate(ms)) * 60000;
          out = ms + getOffsetMinutes(new OrigDate(out)) * 60000;
          return out;
        };
        // Matches ES2015+ "date-time forms without a timezone offset", which parse as local.
        const NO_TZ = new RegExp('^[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}(:[0-9]{2}([.][0-9]+)?)?$');
        const parseLocal = (value) => {
          const raw = OrigDate.parse(value);
          if (isNaN(raw)) return raw;
          if (!NO_TZ.test(String(value).trim())) return raw;
          // OrigDate.parse resolved these fields against the host zone. Undo that with the
          // engine's own offset, then re-apply the spoofed zone's.
          const undo = raw - origGetTzOffset.call(new OrigDate(raw)) * 60000;
          return localToUtc(undo);
        };
        const PatchedDate = function Date(...args) {
          if (!new.target) return OrigDate();
          if (args.length === 0) return Reflect.construct(OrigDate, [], new.target);
          if (args.length === 1) {
            const only = args[0];
            if (typeof only === 'string') {
              return Reflect.construct(OrigDate, [parseLocal(only)], new.target);
            }
            return Reflect.construct(OrigDate, args, new.target);
          }
          // Interpret the fields as wall-clock time in the *spoofed* zone. Letting the engine
          // parse them first would apply the host zone's offset, which the correction below
          // would then apply a second time.
          const y = Number(args[0]);
          // undefined means "default"; anything else is coerced the way the engine would, so a NaN
          // field leaves the whole date Invalid instead of folding to 0.
          const field = (value, fallback) => (value === undefined ? fallback : Number(value));
          const wall = OrigDate.UTC(
            y >= 0 && y <= 99 ? y + 1900 : y,
            field(args[1], 0),
            field(args[2], 1),
            field(args[3], 0),
            field(args[4], 0),
            field(args[5], 0),
            field(args[6], 0)
          );
          return Reflect.construct(OrigDate, [localToUtc(wall)], new.target);
        };
        Object.defineProperty(PatchedDate, 'prototype', {
          value: OrigDate.prototype,
          writable: false,
          enumerable: false,
          configurable: false,
        });
        try {
          Object.defineProperty(OrigDate.prototype, 'constructor', {
            configurable: true, writable: true, enumerable: false, value: PatchedDate,
          });
        } catch (_) {}
        PatchedDate.now = OrigDate.now;
        PatchedDate.parse = nativeLike(
          function parse(value) { return parseLocal(value); },
          OrigDate.parse, 'parse', 1
        );
        PatchedDate.UTC = OrigDate.UTC;
        nativeLike(PatchedDate, OrigDate, 'Date', 7, true);
        globalThis.Date = PatchedDate;
      } catch (_) {}
    } catch (_) {}
  }


`;
const AUDIO_CORE = `  // --- audio ---
  // A buffer the engine rendered from the profile graph is a stable per-machine value, so it
  // needs the same per-profile perturbation the canvas gets. Silent buffers are left untouched:
  // a page that renders nothing expects exact zeros, and dithering them is itself the tell.
  if (CFG.audio && CFG.audio.mode === 'noise') {
    try {
      const mark = Number(CFG.audio.mark) || 1;
      const renderedBuffers = new WeakSet();
      const authoredSpans = new WeakMap();
      const markRendered = (value) => {
        try { if (value && typeof value === 'object') renderedBuffers.add(value); } catch (_) {}
        return value;
      };
      const spanFor = (buffer, channel) => {
        try {
          const channels = authoredSpans.get(buffer);
          if (!channels) return null;
          return channels.get(channel) || null;
        } catch (_) { return null; }
      };
      const recordSpan = (buffer, channelNumber, start, length) => {
        try {
          if (!buffer || typeof buffer !== 'object' || !renderedBuffers.has(buffer)) return;
          const channel = Number(channelNumber) || 0;
          const from = Math.max(0, Number(start) || 0);
          const cover = Number(length) || 0;
          if (cover <= 0) return;
          let channels = authoredSpans.get(buffer);
          if (!channels) { channels = new Map(); authoredSpans.set(buffer, channels); }
          const spans = channels.get(channel) || [];
          spans.push([from, from + cover]);
          channels.set(channel, spans);
        } catch (_) {}
      };
      const inAuthoredSpan = (spans, index) => {
        if (!spans) return false;
        for (const span of spans) { if (index >= span[0] && index < span[1]) return true; }
        return false;
      };
      const hookOwn = (proto, key, factory) => {
        try {
          if (!proto || !Object.prototype.hasOwnProperty.call(proto, key) || typeof proto[key] !== 'function') return null;
          return __REPLACE_HELPER__(proto, key, factory);
        } catch (_) { return null; }
      };

      const patchedAudioWindows = new WeakSet();
      const patchAudioForWindow = (targetWin) => {
        if (!targetWin || patchedAudioWindows.has(targetWin)) return;
        const audioProtos = [];
        for (const ctor of [targetWin.BaseAudioContext, targetWin.AudioContext, targetWin.OfflineAudioContext, targetWin.webkitAudioContext, targetWin.webkitOfflineAudioContext]) {
          try { if (ctor && ctor.prototype && audioProtos.indexOf(ctor.prototype) === -1) audioProtos.push(ctor.prototype); } catch (_) {}
        }
        if (adoptNativeBridgeWrappers(audioProtos, targetWin.AudioBuffer?.prototype, targetWin.OfflineAudioCompletionEvent?.prototype)) {
          try { patchedAudioWindows.add(targetWin); } catch (_) {}
          return;
        }
        try { patchedAudioWindows.add(targetWin); } catch (_) {}
        for (const proto of audioProtos) {
          hookOwn(proto, 'startRendering', (original) => function startRendering(...args) {
            const result = original.apply(this, args);
            try { if (result && typeof result.then === 'function') return result.then(markRendered); } catch (_) {}
            return result;
          });
        }
        const audioClaimedOs = String(CFG.os || '').toLowerCase();
        const isWinAudio = audioClaimedOs.includes('win');
        const isLinuxAudio = audioClaimedOs.includes('linux');
        const isMacAudio = audioClaimedOs.includes('mac');

        // Every claimed OS gets a native-looking default: Windows/Linux devices run
        // 48 kHz (baseLatency 128/48000 — 512 samples is a Firefox-style block, not what
        // Chrome's AudioDestination reports), while every Mac since 10.6 answers 44.1 kHz.
        // macOS previously fell through unmocked, so a 48 kHz host leaked through verbatim.
        if (isWinAudio || isLinuxAudio || isMacAudio) {
          const mockSampleRate = isMacAudio ? 44100 : 48000;
          const mockBaseLatency = 128 / mockSampleRate;

          for (const ctor of [targetWin.AudioContext, targetWin.webkitAudioContext].filter(Boolean)) {
            if (ctor && ctor.prototype) {
              const proto = ctor.prototype;
              const baseProto = targetWin.BaseAudioContext?.prototype;
              const descRate = Object.getOwnPropertyDescriptor(proto, 'sampleRate') || (baseProto && Object.getOwnPropertyDescriptor(baseProto, 'sampleRate'));
              const descLat = Object.getOwnPropertyDescriptor(proto, 'baseLatency');

              if (descRate && typeof descRate.get === 'function') {
                const origGetRate = descRate.get;
                const rateGetter = function sampleRate() {
                  if (!this || this === proto || (baseProto && this === baseProto)) {
                    throw new TypeError('Illegal invocation');
                  }
                  if (targetWin.OfflineAudioContext && this instanceof targetWin.OfflineAudioContext) {
                    return origGetRate.call(this);
                  }
                  return mockSampleRate;
                };
                const cleanRateGetter = nativeGetter('sampleRate', rateGetter);
                try {
                  Object.defineProperty(proto, 'sampleRate', {
                    configurable: true,
                    enumerable: descRate.enumerable !== false,
                    get: cleanRateGetter,
                    set: undefined,
                  });
                } catch (_) {}
              }

              if (descLat && typeof descLat.get === 'function') {
                const origGetLat = descLat.get;
                const latGetter = function baseLatency() {
                  if (!this || this === proto || (baseProto && this === baseProto)) {
                    throw new TypeError('Illegal invocation');
                  }
                  return mockBaseLatency;
                };
                const cleanLatGetter = nativeGetter('baseLatency', latGetter);
                try {
                  Object.defineProperty(proto, 'baseLatency', {
                    configurable: true,
                    enumerable: descLat.enumerable !== false,
                    get: cleanLatGetter,
                    set: undefined,
                  });
                } catch (_) {}
              }
            }
          }
        }
        try {
          const completionProto = targetWin.OfflineAudioCompletionEvent ? targetWin.OfflineAudioCompletionEvent.prototype : null;
          const descriptor = completionProto ? Object.getOwnPropertyDescriptor(completionProto, 'renderedBuffer') : null;
          if (descriptor && typeof descriptor.get === 'function' && descriptor.configurable !== false) {
            const nativeGet = descriptor.get;
            Object.defineProperty(completionProto, 'renderedBuffer', {
              configurable: descriptor.configurable,
              enumerable: descriptor.enumerable,
              get: makeNativeGetter('renderedBuffer', function () {
                return markRendered(nativeGet.call(this));
              }, 'OfflineAudioCompletionEvent'),
            });
          }
        } catch (_) {}
        if (targetWin.AudioBuffer && targetWin.AudioBuffer.prototype.getChannelData) {
          const processed = new WeakMap();
          const nativeGetChannel = targetWin.AudioBuffer.prototype.getChannelData;
          const nativeLength = targetWin.Float32Array
            ? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(targetWin.Float32Array.prototype), 'length')?.get
            : null;
          const applyRenderedNoise = (buffer, channel, data) => {
            if (!renderedBuffers.has(buffer)) return data;
            let channels = processed.get(buffer);
            if (!channels) { channels = new Set(); processed.set(buffer, channels); }
            if (channels.has(channel)) return data;
            let silent = true;
            for (let i = 0; i < data.length; i++) if (data[i] !== 0) { silent = false; break; }
            if (!silent) {
              const spans = spanFor(buffer, channel);
              for (let i = 0; i < data.length; i++) {
                if (inAuthoredSpan(spans, i)) continue;
                data[i] += (noise(i + channel * 4099 + mark) - 0.5) * 1e-7;
              }
            }
            channels.add(channel);
            return data;
          };
          if (targetWin.AudioBuffer.prototype.copyToChannel) {
            hookOwn(targetWin.AudioBuffer.prototype, 'copyToChannel', (original) => function copyToChannel(source, channelNumber, startInChannel) {
              const call = invokeNativeUnsigned(original, this, arguments, [1, 2]);
              try {
                const length = nativeLength ? nativeLength.call(source) : source.length;
                recordSpan(this, call.values[1], call.values[2], length);
              } catch (_) {}
              return call.value;
            });
          }
          __REPLACE_HELPER__(targetWin.AudioBuffer.prototype, 'getChannelData', (original) => function getChannelData(channelIndex) {
            const call = invokeNativeUnsigned(original, this, arguments, [0]);
            try { applyRenderedNoise(this, call.values[0], call.value); } catch (_) {}
            return call.value;
          });
          if (targetWin.AudioBuffer.prototype.copyFromChannel) {
            __REPLACE_HELPER__(targetWin.AudioBuffer.prototype, 'copyFromChannel', (original) => function copyFromChannel(destination, channelNumber, startInChannel) {
              // Validate and convert before touching the render buffer. Repeat the
              // native copy only with already-converted primitive indices.
              const call = invokeNativeUnsigned(original, this, arguments, [1, 2]);
              if (renderedBuffers.has(this)) {
                const channel = call.values[1];
                const data = nativeGetChannel.call(this, channel);
                applyRenderedNoise(this, channel, data);
                return original.call(this, destination, channel, call.values[2] ?? 0);
              }
              return call.value;
            });
          }

        }
        if (targetWin.AnalyserNode) {
          const patchFreq = (name) => {
            if (!targetWin.AnalyserNode.prototype || !targetWin.AnalyserNode.prototype[name]) return;
            __REPLACE_HELPER__(targetWin.AnalyserNode.prototype, name, (original) => function(...args) {
              const res = original.apply(this, args);
              try {
                const array = args[0];
                if (array && array.length) {
                  const step = Math.max(1, Math.floor(array.length / 32));
                  if (name.includes('Byte')) {
                    for (let i = 0; i < array.length; i += step) {
                      if (array[i] > 0 && array[i] < 255) {
                        const delta = noise(i + mark) > 0.5 ? 1 : -1;
                        array[i] = Math.max(0, Math.min(255, array[i] + delta));
                      }
                    }
                  } else {
                    const amp = 1e-5;
                    for (let i = 0; i < array.length; i += step) {
                      if (array[i] !== 0 && !isNaN(array[i]) && isFinite(array[i])) {
                        array[i] += (noise(i + mark) - 0.5) * amp;
                      }
                    }
                  }
                }
              } catch (_) {}
              return res;
            });
          };
          patchFreq('getFloatFrequencyData');
          patchFreq('getByteFrequencyData');
          patchFreq('getFloatTimeDomainData');
          patchFreq('getByteTimeDomainData');
        }
      };

      patchAudioForWindow(globalThis);
      subWindowSyncHooks.push((subWin) => { patchAudioForWindow(subWin); });
    } catch (_) {}
  }

`;

function substituteHelper(core, replaceHelper) {
  return core.split('__REPLACE_HELPER__(').join(replaceHelper + '(');
}

function timezoneFragment({ replaceHelper, headerComment }) {
  return headerComment + substituteHelper(TZ_CORE, replaceHelper);
}

function audioFragment({ replaceHelper }) {
  return substituteHelper(AUDIO_CORE, replaceHelper);
}

module.exports = { timezoneFragment, audioFragment };
