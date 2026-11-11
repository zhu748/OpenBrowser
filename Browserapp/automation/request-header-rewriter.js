'use strict';

/**
 * Chromium canonical request-header rewriter.
 *
 * Extracted verbatim from engine.js: the wire-order table (JA4H/Akamai
 * defence), the RequestHeaderRewriter class that reorders and rewrites
 * request headers per persona, and the pure UA/timezone/language helpers it
 * shares with delivery evaluation. No CDP, no Electron, no engine state —
 * the only outside dependency is buildUaProfile from ./user-agent.
 */

const { buildUaProfile, cdpUserAgentOverride, buildAcceptLanguageHeader } = require('./user-agent');

const CHROMIUM_CANONICAL_HEADER_ORDER = Object.freeze([
  "host",
  "connection",
  "cache-control",
  "pragma",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "sec-ch-ua-arch",
  "sec-ch-ua-bitness",
  "sec-ch-ua-model",
  "sec-ch-ua-platform-version",
  "sec-ch-ua-full-version",
  "sec-ch-ua-full-version-list",
  "sec-ch-ua-form-factors",
  "sec-ch-ua-wow64",
  "upgrade-insecure-requests",
  "user-agent",
  "accept",
  "accept-language",
  "sec-fetch-site",
  "sec-fetch-mode",
  "sec-fetch-user",
  "sec-fetch-dest",
  "sec-fetch-storage-access",
  "referer",
  "origin",
  "accept-encoding",
  "cookie",
  "priority",
]);

const CHROMIUM_CANONICAL_HEADER_INDEX = Object.freeze(
  new Map(CHROMIUM_CANONICAL_HEADER_ORDER.map((name, i) => [name, i]))
);

class RequestHeaderRewriter {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.logger = typeof options.logger === "function" ? options.logger : null;
    this.inFlight = new Set();
    this.inFlightBySession = new Map();
    this.profile = options.profile || {};
    this.fingerprint = options.fingerprint || null;
    this.setPersona(options.profile, options.fingerprint);
  }

  setPersona(profile = {}, fingerprint = {}) {
    const fp = fingerprint || {};
    const prof = profile || {};
    const ua = fp.userAgent || prof.userAgent || "";
    const rawOs = String(fp.os || prof.os || fp.platform || prof.platform || "").toLowerCase();
    const osKey = rawOs.includes("win") ? "windows"
      : rawOs.includes("andr") ? "android"
      : rawOs.includes("mac") ? "macos"
      : rawOs.includes("ios") ? "ios"
      : rawOs.includes("lin") ? "linux"
      : (ua ? undefined : "windows");

    const platformNav = osKey === "windows" ? "Win32"
      : osKey === "android" ? "Linux armv8l"
      : osKey === "macos" ? "MacIntel"
      : osKey === "ios" ? "iPhone"
      : osKey === "linux" ? "Linux x86_64"
      : undefined;

    const uaProfile = fp.uaProfile || buildUaProfile({
      userAgent: ua,
      os: osKey,
      platformNav,
    });

    const langs = (Array.isArray(fp.languages) && fp.languages.length)
      ? fp.languages
      : (Array.isArray(prof.languages) && prof.languages.length)
        ? prof.languages
        : prof.language
          ? [prof.language]
          : [];

    const acceptLanguageHeader = langs.length
      ? buildAcceptLanguageHeader(langs)
      : (uaProfile.language || "en-US,en;q=0.9");

    const override = cdpUserAgentOverride(uaProfile, acceptLanguageHeader);

    const meta = override.userAgentMetadata || {};
    const metaFormFactors = fp.formFactors || prof.formFactors || fp.clientHints?.formFactors || prof.clientHints?.formFactors || fp.form_factors || prof.form_factors;
    if (metaFormFactors && !meta.formFactors) {
      meta.formFactors = metaFormFactors;
    }

    this.persona = {
      userAgent: override.userAgent || uaProfile.userAgent || ua,
      acceptLanguage: acceptLanguageHeader || override.acceptLanguage,
      platformNav: override.platform || uaProfile.platform || platformNav || "Win32",
      platform: meta.platform || uaProfile.metadata?.platform || (osKey === "android" ? "Android" : "Windows"),
      mobile: Boolean(meta.mobile),
      brands: meta.brands || [],
      metadata: meta,
    };

    if (Array.isArray(this.persona.brands) && this.persona.brands.length) {
      this.secChUa = this.persona.brands
        .map((b) => "\"" + b.brand + "\";v=\"" + b.version + "\"")
        .join(", ");
    } else {
      this.secChUa = "\"Chromium\";v=\"148\", \"Google Chrome\";v=\"148\"";
    }

    const fvl = this.persona.metadata?.fullVersionList;
    if (Array.isArray(fvl) && fvl.length) {
      this.secChUaFullVersionList = fvl
        .map((b) => "\"" + b.brand + "\";v=\"" + b.version + "\"")
        .join(", ");
    } else {
      const fv = this.persona.metadata?.fullVersion || "148.0.0.0";
      if (Array.isArray(this.persona.brands) && this.persona.brands.length) {
        this.secChUaFullVersionList = this.persona.brands
          .map((b) => "\"" + b.brand + "\";v=\"" + fv + "\"")
          .join(", ");
      } else {
        this.secChUaFullVersionList = "\"Chromium\";v=\"" + fv + "\", \"Google Chrome\";v=\"" + fv + "\"";
      }
    }
  }

  async _sendCommand(connection, method, params = {}, options = {}) {
    if (!connection) throw new Error("No CDP connection available");
    if (typeof connection.command === "function") {
      return connection.command(method, params, options);
    }
    if (typeof connection.call === "function") {
      return connection.call(method, params, options);
    }
    if (typeof connection.send === "function") {
      return connection.send(method, params, options);
    }
    throw new Error("Unsupported connection object (missing command/call/send)");
  }

  cleanupSession(sessionId) {
    if (!sessionId) return;
    const reqs = this.inFlightBySession.get(sessionId);
    if (reqs) {
      for (const rid of reqs) {
        this.inFlight.delete(rid);
      }
      this.inFlightBySession.delete(sessionId);
    }
  }

  destroy() {
    this.inFlight.clear();
    this.inFlightBySession.clear();
  }

  handleEvent(event, connection) {
    if (!event || event.method !== "Fetch.requestPaused" || !event.params) return;
    const { requestId, request, responseStatusCode } = event.params;
    const sessionId = event.sessionId;

    // Only process requests at Request stage (where responseStatusCode is null/undefined)
    if (!requestId || responseStatusCode != null) return;

    // CDP requestIds (`interception-job-<N>`) restart from 1 for every newly
    // attached target session, so a bare requestId collides across sessions
    // sharing this rewriter. Key the in-flight set by sessionId:requestId so a
    // concurrent first request from another session is still header-rewritten
    // instead of being silently passed through unmodified.
    const inFlightKey = sessionId ? `${sessionId}:${requestId}` : requestId;
    // Prevent duplicate in-flight processing for the same requestId across sessions
    if (this.inFlight.has(inFlightKey)) {
      this._sendCommand(connection, "Fetch.continueRequest", { requestId }, { sessionId, timeout: 3000 }).catch(() => {});
      return;
    }
    this.inFlight.add(inFlightKey);
    if (sessionId) {
      if (!this.inFlightBySession.has(sessionId)) {
        this.inFlightBySession.set(sessionId, new Set());
      }
      this.inFlightBySession.get(sessionId).add(inFlightKey);
    }

    (async () => {
      let settled = false;
      let safetyTimer = null;

      const doContinue = async (headers) => {
        if (settled) return;
        settled = true;
        if (safetyTimer) {
          clearTimeout(safetyTimer);
          safetyTimer = null;
        }
        this.inFlight.delete(inFlightKey);
        if (sessionId && this.inFlightBySession.has(sessionId)) {
          const s = this.inFlightBySession.get(sessionId);
          s.delete(inFlightKey);
          if (s.size === 0) this.inFlightBySession.delete(sessionId);
        }

        try {
          const params = { requestId };
          if (headers && Array.isArray(headers)) params.headers = headers;
          await this._sendCommand(connection, "Fetch.continueRequest", params, { sessionId, timeout: 6000 });
        } catch (_) {
          // If continuing with modified headers was rejected by CDP, fallback to raw continueRequest to avoid hanging
          try {
            await this._sendCommand(connection, "Fetch.continueRequest", { requestId }, { sessionId, timeout: 3000 });
          } catch (_) {}
        }
      };

      // Fail-open timeout guard: if anything stalls, resume after 7 seconds
      safetyTimer = setTimeout(() => {
        if (!settled) {
          doContinue().catch(() => {});
        }
      }, 7000);
      if (typeof safetyTimer.unref === "function") safetyTimer.unref();

      try {
        if (!this.enabled || !this.persona) {
          return await doContinue();
        }

        const url = String(request?.url || "");
        // Filter internal browser schemes: chrome, devtools, data, blob, about, etc.
        if (/^(chrome|chrome-extension|edge|edge-extension|devtools|data|blob|about|javascript|filesystem|view-source|isolated-app):/i.test(url)) {
          return await doContinue();
        }

        const reqHeaders = request?.headers || {};
        const method = String(request?.method || "GET").toUpperCase();

        // Filter WebSocket upgrades: modifying headers can break native WebSocket handshake
        let isWs = false;
        for (const [hk, hv] of Object.entries(reqHeaders)) {
          if (hk.toLowerCase() === "upgrade" && String(hv).toLowerCase() === "websocket") {
            isWs = true;
            break;
          }
        }
        if (isWs) {
          return await doContinue();
        }

        const otherHeaders = [];
        const existingKeys = new Set();
        const seenNames = new Set();

        for (const [k, v] of Object.entries(reqHeaders)) {
          const lk = k.toLowerCase();
          existingKeys.add(lk);
          // Strip all host User-Agent, Accept-Language, and any Client Hints (sec-ch-ua*)
          if (
            lk === "user-agent" ||
            lk === "accept-language" ||
            lk.startsWith("sec-ch-ua")
          ) {
            continue;
          }
          if (seenNames.has(lk)) continue;
          seenNames.add(lk);
          otherHeaders.push({ name: k, value: String(v) });
        }

        // Real iOS WebKit never implements or sends User-Agent Client Hints (sec-ch-ua*).
        // Sending sec-ch-ua-platform: "iOS" is an immediate adversarial red-team dead giveaway.
        const isIos = this.persona.platform === "iOS"
          || this.persona.platformNav === "iPhone"
          || this.persona.platformNav === "iPad"
          || /iphone|ipad|ipod|ios/i.test(this.persona.platformNav || "")
          || /iphone|ipad|ipod/i.test(this.persona.userAgent || "");

        const secChUaHeaders = [];
        if (!isIos) {
          if (this.secChUa) {
            secChUaHeaders.push({ name: "sec-ch-ua", value: this.secChUa });
          }
          secChUaHeaders.push({ name: "sec-ch-ua-mobile", value: this.persona.mobile ? "?1" : "?0" });
          if (this.persona.platform) {
            secChUaHeaders.push({ name: "sec-ch-ua-platform", value: "\"" + this.persona.platform + "\"" });
          }

          // High-entropy User-Agent Client Hints (ONLY populated if server requested via Accept-CH)
          const meta = this.persona.metadata || {};

          if (existingKeys.has("sec-ch-ua-arch")) {
            const arch = meta.architecture !== undefined ? meta.architecture : (this.persona.platform === "Android" ? "" : "x86");
            secChUaHeaders.push({ name: "sec-ch-ua-arch", value: "\"" + arch + "\"" });
          }
          if (existingKeys.has("sec-ch-ua-bitness")) {
            const bitness = meta.bitness !== undefined ? meta.bitness : (this.persona.platform === "Android" ? "" : "64");
            secChUaHeaders.push({ name: "sec-ch-ua-bitness", value: "\"" + bitness + "\"" });
          }
          if (existingKeys.has("sec-ch-ua-model")) {
            const model = meta.model !== undefined ? meta.model : "";
            secChUaHeaders.push({ name: "sec-ch-ua-model", value: "\"" + model + "\"" });
          }
          if (existingKeys.has("sec-ch-ua-platform-version")) {
            const pv = meta.platformVersion !== undefined ? meta.platformVersion : "15.0.0";
            secChUaHeaders.push({ name: "sec-ch-ua-platform-version", value: "\"" + pv + "\"" });
          }
          if (existingKeys.has("sec-ch-ua-full-version")) {
            const fv = meta.fullVersion || meta.uaFullVersion || "148.0.0.0";
            secChUaHeaders.push({ name: "sec-ch-ua-full-version", value: "\"" + fv + "\"" });
          }
          if (existingKeys.has("sec-ch-ua-full-version-list")) {
            secChUaHeaders.push({ name: "sec-ch-ua-full-version-list", value: this.secChUaFullVersionList });
          }
          if (existingKeys.has("sec-ch-ua-form-factors")) {
            const ff = meta.formFactors || meta.form_factors;
            if (ff) {
              const val = Array.isArray(ff) ? ff.map((f) => "\"" + f + "\"").join(", ") : "\"" + ff + "\"";
              secChUaHeaders.push({ name: "sec-ch-ua-form-factors", value: val });
            } else if (this.persona.mobile) {
              secChUaHeaders.push({ name: "sec-ch-ua-form-factors", value: "\"Mobile\"" });
            }
          }
          if (existingKeys.has("sec-ch-ua-wow64")) {
            secChUaHeaders.push({ name: "sec-ch-ua-wow64", value: meta.wow64 ? "?1" : "?0" });
          }
        }

        let userAgentHeader = null;
        if (this.persona.userAgent) {
          userAgentHeader = { name: "User-Agent", value: this.persona.userAgent };
        }

        let acceptLanguageHeader = null;
        if (this.persona.acceptLanguage && (method !== "OPTIONS" || existingKeys.has("accept-language"))) {
          acceptLanguageHeader = { name: "Accept-Language", value: this.persona.acceptLanguage };
        }

        const newHeaders = [...otherHeaders];
        if (secChUaHeaders.length > 0) {
          newHeaders.push(...secChUaHeaders);
        }
        if (userAgentHeader) {
          newHeaders.push(userAgentHeader);
        }
        if (acceptLanguageHeader) {
          newHeaders.push(acceptLanguageHeader);
        }

        const indexedHeaders = newHeaders.map((h, idx) => {
          const lk = (h && typeof h.name === "string") ? h.name.toLowerCase() : "";
          const canonicalRank = CHROMIUM_CANONICAL_HEADER_INDEX.has(lk)
            ? CHROMIUM_CANONICAL_HEADER_INDEX.get(lk)
            : (1000 + idx);
          return { header: h, rank: canonicalRank, originalIndex: idx };
        });

        indexedHeaders.sort((a, b) => {
          if (a.rank !== b.rank) return a.rank - b.rank;
          return a.originalIndex - b.originalIndex;
        });

        const sortedHeaders = indexedHeaders.map((item) => item.header);

        await doContinue(sortedHeaders);
      } catch (err) {
        if (this.logger) {
          try { this.logger({ type: "request-rewrite-error", error: err.message, url: request?.url }); } catch (_) {}
        }
        await doContinue();
      }
    })();
  }
}

function createRequestHeaderRewriter(options = {}) {
  return new RequestHeaderRewriter(options);
}


function normalizePlatformFamily(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim().toLowerCase();
  if (s.includes('win')) return 'windows';
  if (s.includes('mac') || s.includes('darwin')) return 'macos';
  if (s.includes('android')) return 'android';
  if (s.includes('linux') || s.includes('x11')) return 'linux';
  if (s.includes('iphone') || s.includes('ipad') || s.includes('ipod') || s.includes('ios')) return 'ios';
  return s;
}

function detectUaPlatform(ua) {
  if (!ua || typeof ua !== 'string') return null;
  const s = ua.toLowerCase();
  if (s.includes('windows nt') || s.includes('win64') || s.includes('wow64') || s.includes('windows')) return 'windows';
  if (s.includes('macintosh') || s.includes('mac os x') || s.includes('macos')) return 'macos';
  if (s.includes('android')) return 'android';
  if (s.includes('linux') || s.includes('x11')) return 'linux';
  if (s.includes('iphone') || s.includes('ipad') || s.includes('cpu os')) return 'ios';
  return null;
}

function extractChromeMajor(ua) {
  if (!ua || typeof ua !== 'string') return null;
  const m = String(ua).match(/Chrome\/(\d+)/i);
  return m ? Number(m[1]) : null;
}

function extractGpuBrand(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.toLowerCase();
  if (s.includes('nvidia') || s.includes('geforce') || s.includes('quadro') || s.includes('rtx') || s.includes('gtx')) return 'nvidia';
  if (s.includes('apple') || /\bm[1-9]\b/i.test(s) || s.includes('apple m')) return 'apple';
  if (s.includes('amd') || s.includes('radeon')) return 'amd';
  if (s.includes('intel') || s.includes('iris') || s.includes('arc') || s.includes('uhd') || s.includes('hd graphics')) return 'intel';
  if (s.includes('qualcomm') || s.includes('adreno')) return 'qualcomm';
  if (s.includes('mali')) return 'mali';
  if (s.includes('swiftshader') || s.includes('llvmpipe')) return 'software';
  return null;
}

function normalizeTimezone(tz) {
  if (!tz || typeof tz !== 'string') return '';
  let s = tz.trim().toLowerCase();
  if (s.startsWith('etc/')) s = s.slice(4);
  if (s === 'gmt' || s === 'utc' || s === 'z') return 'utc';
  return s;
}

function extractPrimaryLanguage(val) {
  if (Array.isArray(val)) {
    for (const item of val) {
      const res = extractPrimaryLanguage(item);
      if (res) return res;
    }
    return null;
  }
  if (!val || typeof val !== 'string') return null;
  const first = val.split(/[,;]/)[0].trim();
  if (!first || first.toLowerCase() === 'system' || first.toLowerCase() === 'real') return null;
  return first.toLowerCase().replace(/_/g, '-');
}

function backgroundNetworkFlagsForProfile(profile) {
  const flags = [
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-client-side-phishing-detection',
    '--disable-domain-reliability',
    '--disable-breakpad',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--metrics-recording-only',
    '--no-pings',
    '--dns-prefetch-disable',
  ];
  if (profile?.advanced?.blockNotifications !== false) {
    flags.unshift('--disable-background-networking');
  }
  return flags;
}

function evaluateFingerprintDelivery(profile = {}, fingerprint = {}, liveProbe = null) {
  const mismatches = [];
  const warnings = [];

  // 1. Probe error or missing live data: WARN only, do not fail
  if (!liveProbe || liveProbe.probeError) {
    warnings.push(liveProbe?.probeError ? ("探针返回异常: " + liveProbe.probeError) : "探针未返回数据 (undefined)");
    return { ok: true, mismatches: [], warnings };
  }

  const privacy = profile?.privacy || {};

  // 2. Platform / OS verification
  const expectedPlatform = fingerprint?.platform || profile?.platform || '';
  const expectedOs = profile?.os || fingerprint?.uaProfile?.os || '';
  const expectedFamily = normalizePlatformFamily(expectedOs) || normalizePlatformFamily(expectedPlatform);

  if (expectedFamily && liveProbe.platform) {
    const liveFamily = normalizePlatformFamily(liveProbe.platform);
    if (liveFamily && liveFamily !== expectedFamily) {
      mismatches.push({
        field: 'platform',
        expected: expectedFamily,
        actual: liveProbe.platform,
        message: "平台不符：期望 " + expectedFamily + " (" + (expectedPlatform || expectedOs) + ")，实际交付 " + liveProbe.platform,
      });
    }
  }

  // 3. User-Agent verification (Key fragments: platform segment, Chrome major)
  const expectedUa = String(fingerprint?.userAgent || profile?.userAgent || '').trim();
  const liveUa = String(liveProbe.userAgent || '').trim();

  if (expectedUa && liveUa) {
    const expectedUaPlat = detectUaPlatform(expectedUa);
    const liveUaPlat = detectUaPlatform(liveUa);
    if (expectedUaPlat && liveUaPlat && expectedUaPlat !== liveUaPlat) {
      mismatches.push({
        field: 'userAgent.platform',
        expected: expectedUaPlat,
        actual: liveUaPlat,
        message: "UA 平台段不符：期望包含 " + expectedUaPlat + "，实际交付 " + liveUaPlat,
      });
    }

    const expectedMajor = extractChromeMajor(expectedUa);
    const liveMajor = extractChromeMajor(liveUa);
    if (expectedMajor != null && liveMajor != null && expectedMajor !== liveMajor) {
      mismatches.push({
        field: 'userAgent.chromeMajor',
        expected: expectedMajor,
        actual: liveMajor,
        message: "UA Chrome 主版本不符：期望 Chrome/" + expectedMajor + "，实际交付 Chrome/" + liveMajor,
      });
    }
  }

  // 4. navigator.userAgentData?.platform vs UA / configured platform
  if (liveProbe.uaDataPlatform) {
    const liveUaDataFamily = normalizePlatformFamily(liveProbe.uaDataPlatform);
    const uaOrConfigFamily = detectUaPlatform(expectedUa) || expectedFamily;
    if (uaOrConfigFamily && liveUaDataFamily && uaOrConfigFamily !== liveUaDataFamily) {
      mismatches.push({
        field: 'userAgentData.platform',
        expected: uaOrConfigFamily,
        actual: liveProbe.uaDataPlatform,
        message: "Client Hints 平台与 UA 不符：期望 " + uaOrConfigFamily + "，实际交付 " + liveProbe.uaDataPlatform,
      });
    }
  }

  // 5. Timezone verification
  const isRealTimezone = privacy.timezoneMode === 'real' || profile?.timezoneMode === 'real';
  if (!isRealTimezone) {
    const expectedTz = String(fingerprint?.timezone || profile?.exitTimezone || privacy.timezone || '').trim();
    const liveTz = String(liveProbe.timezone || '').trim();
    if (expectedTz && liveTz && expectedTz.toLowerCase() !== 'real') {
      if (normalizeTimezone(expectedTz) !== normalizeTimezone(liveTz)) {
        mismatches.push({
          field: 'timezone',
          expected: expectedTz,
          actual: liveTz,
          message: "时区不符：期望 " + expectedTz + "，实际交付 " + liveTz,
        });
      }
    }
  }

  // 6. WebGL Vendor & Renderer
  const webglMode = String(privacy.webgl || fingerprint?.webgl?.mode || '').toLowerCase();
  const webglMetaMode = String(privacy.webglMeta || fingerprint?.webgl?.metaMode || '').toLowerCase();
  const isRealWebgl = webglMode === 'real' || webglMode === 'off' || webglMetaMode === 'real' || webglMetaMode === 'off';

  if (!isRealWebgl) {
    const liveRenderer = liveProbe.webglRenderer;
    const liveVendor = liveProbe.webglVendor;

    if (!liveRenderer && !liveVendor) {
      // No WebGL context (headless / no GPU) -> WARN ONLY
      warnings.push("WebGL 无可用上下文 (可能为无头环境或无GPU加速)，跳过 WebGL 交付校验");
    } else {
      const expectedRenderer = String(fingerprint?.webgl?.renderer || profile?.webglRenderer || '').trim();
      const expectedVendor = String(fingerprint?.webgl?.vendor || profile?.webglVendor || '').trim();

      if (expectedRenderer || expectedVendor) {
        const expBrand = extractGpuBrand(expectedRenderer) || extractGpuBrand(expectedVendor);
        const liveBrand = extractGpuBrand(liveRenderer) || extractGpuBrand(liveVendor);

        if (expBrand && liveBrand && expBrand !== liveBrand) {
          mismatches.push({
            field: 'webgl',
            expected: expBrand + " (" + (expectedRenderer || expectedVendor) + ")",
            actual: liveBrand + " (" + (liveRenderer || liveVendor) + ")",
            message: "WebGL GPU 身份不符：期望 " + expBrand + "，实际交付 " + liveBrand,
          });
        }
      }
    }
  }

  // 7. Languages (first language)
  // The language mode may arrive either as privacy.languageMode or as a profile.language
  // sentinel ('system'/'real'); a resolved profile.language value (e.g. 'ja-JP') must NOT be
  // treated as a mode. Recognise the mode from either source without letting a real value in.
  const profileLangField = String(profile?.language || '').trim().toLowerCase();
  const explicitLangMode = String(privacy.languageMode || '').trim().toLowerCase();
  const isSystemLanguage = explicitLangMode === 'system' || explicitLangMode === 'real'
    || profileLangField === 'system' || profileLangField === 'real';

  if (!isSystemLanguage) {
    const expectedLang = extractPrimaryLanguage(fingerprint?.languages || profile?.language);
    const liveLang = extractPrimaryLanguage(liveProbe.languages || liveProbe.language);

    if (expectedLang && liveLang) {
      if (expectedLang !== liveLang) {
        const expBase = expectedLang.split('-')[0];
        const liveBase = liveLang.split('-')[0];
        if (expBase !== liveBase) {
          mismatches.push({
            field: 'languages',
            expected: expectedLang,
            actual: liveLang,
            message: "首选语言不符：期望 " + expectedLang + "，实际交付 " + liveLang,
          });
        }
      }
    }
  }

  // 8. Hardware Concurrency & Device Memory (explicitly specified only)
  const rawCores = privacy.cores ?? profile?.cores ?? privacy.fingerprint?.cores;
  const explicitCores = (rawCores !== '' && rawCores !== null && rawCores !== undefined) ? Number(rawCores) : NaN;
  if (Number.isFinite(explicitCores) && explicitCores > 0) {
    const liveCores = Number(liveProbe.hardwareConcurrency);
    if (Number.isFinite(liveCores) && liveCores !== Math.round(explicitCores)) {
      mismatches.push({
        field: 'hardwareConcurrency',
        expected: Math.round(explicitCores),
        actual: liveCores,
        message: "CPU 核心数不符：期望 " + Math.round(explicitCores) + "，实际交付 " + liveCores,
      });
    }
  }

  const rawMemory = privacy.memory ?? profile?.memory ?? privacy.fingerprint?.memory;
  const explicitMemory = (rawMemory !== '' && rawMemory !== null && rawMemory !== undefined) ? Number(rawMemory) : NaN;
  if (Number.isFinite(explicitMemory) && explicitMemory > 0) {
    const liveMemory = Number(liveProbe.deviceMemory);
    if (Number.isFinite(liveMemory) && liveMemory !== Number(explicitMemory)) {
      mismatches.push({
        field: 'deviceMemory',
        expected: explicitMemory,
        actual: liveMemory,
        message: "设备内存不符：期望 " + explicitMemory + "GB，实际交付 " + liveMemory + "GB",
      });
    }
  }

  return {
    ok: mismatches.length === 0,
    mismatches,
    warnings,
  };
}


module.exports = {
  CHROMIUM_CANONICAL_HEADER_ORDER,
  CHROMIUM_CANONICAL_HEADER_INDEX,
  RequestHeaderRewriter,
  createRequestHeaderRewriter,
  normalizePlatformFamily,
  detectUaPlatform,
  extractChromeMajor,
  extractGpuBrand,
  normalizeTimezone,
  extractPrimaryLanguage,
  backgroundNetworkFlagsForProfile,
  evaluateFingerprintDelivery,
};
