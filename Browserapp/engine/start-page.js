'use strict';

/**
 * start-page mixin for BrowserEngine (prototype-assigned by engine.js).
 * Extracted verbatim from engine.js during the decomposition; see the class
 * body in engine.js for the remaining methods and engine/start.js for the
 * startup routine that drives these.
 */

const cdp = require('../cdp');
const { buildFingerprint } = require('../automation/fingerprint');
const { resolveProfileLanguage, resolveProfileTimezone } = require('../automation/locale-from-country');
const { toFileUrl } = require('../automation/protocol/cross-platform');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

// proxy-forwarder is optional: the guarded require keeps a broken optional
// dependency from taking the exit-network geo lookup down (same pattern as engine.js).
let proxyForwarderModule;
try {
  proxyForwarderModule = require('../proxy-forwarder');
} catch (pfErr) {
  console.warn('[BrowserEngine/start-page] Note: proxy-forwarder module load warning:', pfErr.message);
}
const {
  lookupDirectCountry = async () => ({ ip: '', country: '', countryCode: '' }),
} = proxyForwarderModule;

module.exports = {
  async suppressStartupExtensionPages(connection, installed, durationMs = 7000) {
    const popupPaths = new Map();
    for (const extension of installed || []) {
      const chromeId = String(extension.chromeExtensionId || '').toLowerCase();
      if (!chromeId) continue;
      let popup = '';
      try {
        const manifest = JSON.parse(await fsp.readFile(path.join(extension.path, 'manifest.json'), 'utf8'));
        popup = String(manifest.action?.default_popup || manifest.browser_action?.default_popup || '').replace(/^\/+/, '').toLowerCase();
      } catch (_) {}
      popupPaths.set(chromeId, popup);
    }
    if (!popupPaths.size) return { closed: 0 };

    const blockedOpeners = new Set(); const closedTargets = new Set(); const started = Date.now();
    while (Date.now() - started < durationMs) {
      let values;
      try { values = (await connection.command('Target.getTargets', {}, 3000)).targetInfos || []; }
      catch (_) { break; }

      for (const target of values) {
        if (target.type !== 'page' || closedTargets.has(target.targetId)) continue;
        let shouldClose = blockedOpeners.has(String(target.openerId || ''));
        if (!shouldClose) {
          try {
            const url = new URL(String(target.url || ''));
            if (url.protocol === 'chrome-extension:' || url.protocol === 'edge-extension:') {
              const popup = popupPaths.get(url.hostname.toLowerCase());
              if (popup !== undefined) {
                const currentPath = decodeURIComponent(url.pathname).replace(/^\/+/, '').toLowerCase();
                const isToolbarPopup = Boolean(popup) && currentPath === popup;
                shouldClose = !isToolbarPopup;
              }
            }
          } catch (_) {}
        }
        if (!shouldClose) continue;
        blockedOpeners.add(target.targetId); closedTargets.add(target.targetId);
        await connection.command('Target.closeTarget', { targetId: target.targetId }, 3000).catch(() => {});
      }
      await new Promise((resolve) => { const timer = setTimeout(resolve, 120); timer.unref?.(); });
    }
    if (closedTargets.size) this.emit({ type: 'startup-extension-pages-suppressed', count: closedTargets.size });
    return { closed: closedTargets.size };
  },
  isStartPageUrl(url) {
    if (this.startPageServer?.isStartPageUrl?.(url)) return true;
    const s = String(url || '').toLowerCase();
    // 仅识别 OpenBrowser 原生启动页端口 / 本地文件回退，不绑定其它软件端口
    return s.includes('openbrowser-start.html')
      || s.includes('openbrowser-start')
      || s.includes('openbrowser-native')
      || /https?:\/\/127\.0\.0\.1:5032[6-9]\/?/.test(s);
  },
  envWindowTitle(profile) {
    const number = profile.number || profile.name || profile.id || '';
    const title = profile.title && String(profile.title).trim() && String(profile.title) !== String(number)
      ? String(profile.title).trim()
      : '';
    return title ? `环境 ${number} · ${title}` : `环境 ${number}`;
  },
  needsExitNetworkForLocale(profile) {
    const privacy = profile.privacy || {};
    const langMode = privacy.languageMode || (privacy.langFromIp !== false ? 'ip' : '');
    const tzMode = privacy.timezoneMode || 'ip';
    const geoMode = privacy.geoMode || 'ip';
    return langMode === 'ip' || tzMode === 'ip' || geoMode === 'ip' || geoMode === 'allow';
  },
  async ensureExitNetworkForLocale(profile) {
    if (!this.needsExitNetworkForLocale(profile)) return null;
    let network = this.networkInfo.get(profile.id);
    if (network?.countryCode || network?.ip) return network;
    const proxyRaw = String(profile.proxy || '');
    const isDirect = profile.networkMode === 'direct' || !proxyRaw || /^(direct|offline|none)$/i.test(proxyRaw);
    try {
      if (!isDirect) {
        network = await this.checkProxy(profile, { allowExtract: false });
      } else {
        // Local direct exit: geo lookup is best-effort for language/timezone only.
        network = await lookupDirectCountry();
        this.networkInfo.set(profile.id, network);
        this.emit({ type: 'status', id: profile.id, running: this.running.has(profile.id), network });
      }
      if (network) {
        profile.exitIp = network.ip || profile.exitIp;
        profile.exitCountryCode = network.countryCode || profile.exitCountryCode;
        profile.exitTimezone = network.timezone || profile.exitTimezone;
        profile.exitLatitude = network.latitude ?? profile.exitLatitude;
        profile.exitLongitude = network.longitude ?? profile.exitLongitude;
        profile.exitCheckedAt = network.checkedAt || profile.exitCheckedAt;
        profile.exitLatencyMs = network.latencyMs ?? profile.exitLatencyMs;
        profile.exitNetworkType = network.networkType || profile.exitNetworkType;
        this.profiles.set(profile.id, this.sanitizeProfile(profile));
        await this.persist();
      }
      return network;
    } catch (error) {
      // Direct start succeeded without proxy; geo API failure must not surface as proxy error.
      if (!isDirect) {
        this.emit({ type: 'proxy-error', id: profile.id, message: '出口信息检测失败（语言/时区可能回退）：' + error.message });
      }
      return this.networkInfo.get(profile.id) || null;
    }
  },
  applyResolvedLocale(profile) {
    const network = this.networkInfo.get(profile.id) || {
      countryCode: profile.exitCountryCode,
      timezone: profile.exitTimezone,
      latitude: profile.exitLatitude,
      longitude: profile.exitLongitude,
      ip: profile.exitIp,
    };
    const privacy = { ...(profile.privacy || {}) };
    const language = resolveProfileLanguage(profile, network);
    const resolvedTimezone = resolveProfileTimezone(profile, network);
    const tzMode = String(privacy.timezoneMode || 'ip').trim().toLowerCase();
    const next = {
      ...profile,
      language,
      privacy: {
        ...privacy,
        languageMode: privacy.languageMode || (privacy.langFromIp !== false ? 'ip' : (privacy.uiLanguage || 'profile')),
        langFromIp: (privacy.languageMode || 'ip') === 'ip' || privacy.langFromIp !== false,
      },
      exitIp: network.ip || profile.exitIp || '',
      exitCountryCode: network.countryCode || profile.exitCountryCode || '',
      exitTimezone: tzMode === 'real' ? '' : (resolvedTimezone || network.timezone || profile.exitTimezone || ''),
      exitLatitude: network.latitude ?? profile.exitLatitude,
      exitLongitude: network.longitude ?? profile.exitLongitude,
    };
    if ((tzMode === 'ip' || tzMode === 'custom') && resolvedTimezone) {
      next.privacy = { ...next.privacy, timezone: resolvedTimezone };
    }
    if ((privacy.geoMode === 'ip' || privacy.geoMode === 'allow' || !privacy.geoMode)
      && Number.isFinite(Number(network.latitude))
      && Number.isFinite(Number(network.longitude))) {
      next.exitLatitude = Number(network.latitude);
      next.exitLongitude = Number(network.longitude);
    }
    return next;
  },
  async applyEnvWindowTitle(port, profile) {
    if (!port) return;
    const title = this.envWindowTitle(profile);
    const tabs = await cdp.tabs(port).catch(() => []);
    for (const tab of tabs) {
      if (!tab.webSocketDebuggerUrl) continue;
      const url = String(tab.url || '');
      // Only apply to our own internal start page; never overwrite user pages or about:blank document.title
      if (!this.isStartPageUrl(url)) continue;
      await cdp.call(tab.webSocketDebuggerUrl, 'Runtime.evaluate', {
        expression: `(() => { try { document.title = ${JSON.stringify(title)}; } catch (_) {} })()`,
      }).catch(() => {});
    }
  },
  async keepDefaultTab(port, startUrl, options = {}) {
    // Tabs whose URLs the engine opened as real start tabs (CLI positional args
    // for advanced.startUrls 2..N). keepDefaultTab closes every non-kept page;
    // without this list it tore down the extra start tabs seconds after the
    // engine opened them (multi-URL profiles from local API / RPA / cloud
    // import lost every start URL except the first).
    const keepUrls = (Array.isArray(options.keepUrls) ? options.keepUrls : [])
      .map((url) => String(url || '').trim())
      .filter(Boolean);
    const isKeptUrl = (url) => {
      const value = String(url || '').trim();
      if (!value) return false;
      if (keepUrls.includes(value)) return true;
      // The keep-list holds the raw CLI arguments; the tab URL may have been
      // canonicalized by the time keepDefaultTab runs (http→https upgrade,
      // trailing slash, host casing). Compare on trimmed host+path so a
      // redirected extra start tab still survives the sweep.
      try {
        const u = new URL(value);
        for (const keep of keepUrls) {
          try {
            const k = new URL(keep);
            if (u.protocol.replace(':', '') === k.protocol.replace(':', '') || u.host === k.host) {
              if (u.host === k.host && u.pathname.replace(/\/+$/, '') === k.pathname.replace(/\/+$/, '') && u.search === k.search) return true;
            }
          } catch (_) {}
        }
      } catch (_) {}
      return false;
    };
    const values = await cdp.tabs(port); if (!values.length) return;
    const expected = String(startUrl || '').trim();
    let keep = values.find((tab) => this.isStartPageUrl(tab.url)) || values[0];
    const preferredId = keep?.id;
    // Always force-navigate to OpenBrowser start page when provided (148 kernel may open NTP/about:blank).
    if (expected && keep?.webSocketDebuggerUrl) {
      try {
        await cdp.call(keep.webSocketDebuggerUrl, 'Page.enable', {}).catch(() => {});
        const href = String(keep.url || '');
        // about:blank launch or wrong page → navigate; already on start page → reload so
        // document-start fingerprint scripts registered after first paint still run.
        if (this.isStartPageUrl(href) && href.includes(expected.split('?')[0])) {
          await cdp.call(keep.webSocketDebuggerUrl, 'Page.reload', { ignoreCache: true }).catch(async () => {
            await cdp.call(keep.webSocketDebuggerUrl, 'Page.navigate', { url: expected });
          });
        } else {
          await cdp.call(keep.webSocketDebuggerUrl, 'Page.navigate', { url: expected });
        }
        await new Promise((resolve) => { const t = setTimeout(resolve, 400); t.unref?.(); });
      } catch (_) {
        try { await cdp.call(keep.webSocketDebuggerUrl, 'Page.navigate', { url: expected }); } catch (__) {}
      }
    }
    const after = await cdp.tabs(port).catch(() => values);
    // Prefer: current start-page URL → same target we navigated → first tab.
    keep = after.find((tab) => this.isStartPageUrl(tab.url))
      || after.find((tab) => preferredId && tab.id === preferredId)
      || after.find((tab) => isKeptUrl(tab.url)) // keep the first extra start tab too
      || after[0]
      || keep;
    for (const tab of after) {
      if (tab.id === keep.id) continue;
      if (isKeptUrl(tab.url)) continue; // a start-URL tab the engine opened on purpose
      await cdp.closeTab(port, tab.id).catch(() => {});
    }
    await cdp.activateTab(port, keep.id).catch(() => {});
  },
  /**
   * OpenBrowser 原生启动页 URL：http://127.0.0.1:50326/?pid=...&id=...&name=...
   * 会话与网络信息由本引擎写入启动页服务，不依赖其它指纹浏览器。
   */
  async buildStartPageUrl(profile, root, browserName, extensionCount) {
    let pageNetwork = this.networkInfo.get(profile.id) || null;
    // 启动前尽量补全出口信息，启动页打开即可显示 IP（直连/代理同理）
    const hasProxy = profile.proxy && !/^(direct|offline|none)$/i.test(String(profile.proxy));
    if (!pageNetwork?.ip) {
      try {
        if (hasProxy) {
          pageNetwork = await this.checkProxy(profile);
        } else {
          pageNetwork = await lookupDirectCountry();
          if (pageNetwork) {
            pageNetwork = { ...pageNetwork, protocol: 'direct' };
            this.networkInfo.set(profile.id, pageNetwork);
          }
        }
      } catch (_) {
        pageNetwork = this.networkInfo.get(profile.id) || null;
      }
    }
    const timezone = profile.exitTimezone
      || pageNetwork?.timezone
      || (profile.privacy?.timezoneMode === 'custom' ? profile.privacy.timezone : '')
      || '';
    const fpForStart = (() => {
      try {
        return buildFingerprint({
          ...profile,
          kernelVersion: this.kernelStatus()?.kernel?.version || profile.kernelVersion,
          exitTimezone: timezone,
          exitLatitude: pageNetwork?.latitude ?? profile.exitLatitude,
          exitLongitude: pageNetwork?.longitude ?? profile.exitLongitude,
        });
      } catch (_) {
        return null;
      }
    })();
    const uaFromFp = fpForStart?.userAgent || profile.userAgent || '';
    try {
      const server = await this.ensureStartPage();
      const url = server.registerSession({
        ...profile,
        exitTimezone: timezone,
        exitIp: pageNetwork?.ip || profile.exitIp || '',
        exitCountryCode: pageNetwork?.countryCode || profile.exitCountryCode || '',
        userAgent: profile.userAgent || uaFromFp,
        group_name: profile.group_name || profile.groupName || '',
        privacy: {
          ...(profile.privacy || {}),
          // Prefer resolved fingerprint surfaces for welcome-page expected checks
          fingerprint: {
            ...(profile.privacy?.fingerprint || {}),
            hardwareConcurrency: fpForStart?.hardwareConcurrency ?? profile.privacy?.fingerprint?.hardwareConcurrency,
            deviceMemory: fpForStart?.deviceMemory ?? profile.privacy?.fingerprint?.deviceMemory,
          },
        },
      }, {
        timezone,
        network: pageNetwork,
        userAgent: profile.userAgent || uaFromFp,
        group_name: profile.group_name || profile.groupName || '',
        browserName,
        extensionCount,
        time: Math.floor(Date.now() / 1000),
        expectedFingerprint: fpForStart ? {
          language: (fpForStart.languages && fpForStart.languages[0]) || profile.language || '',
          userAgent: fpForStart.userAgent || uaFromFp,
          platform: fpForStart.platform || '',
          timezone,
          screenWidth: fpForStart.screen?.width || Number(profile.width) || null,
          screenHeight: fpForStart.screen?.height || Number(profile.height) || null,
          webrtc: String(profile.privacy?.webrtc || ''),
          canvas: String(fpForStart.canvas?.mode || profile.privacy?.canvas || ''),
          webgl: String(fpForStart.webgl?.mode || profile.privacy?.webgl || ''),
          webglVendor: fpForStart.webgl?.vendor || '',
          webglRenderer: fpForStart.webgl?.renderer || '',
          audio: String(fpForStart.audio?.mode || profile.privacy?.audio || ''),
          hardwareConcurrency: fpForStart.hardwareConcurrency,
          deviceMemory: fpForStart.deviceMemory,
        } : undefined,
      });
      await fsp.writeFile(
        path.join(root, 'openbrowser-start.url.txt'),
        url + '\n# OpenBrowser 原生启动页（非其它软件）\n',
        'utf8'
      ).catch(() => {});
      return url;
    } catch (error) {
      // 最后回退：写本地 HTML，仍标 OpenBrowser 原生
      const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
      const number = escape(profile.number || profile.name || profile.id);
      const name = escape(profile.name || number);
      const ip = escape(pageNetwork?.ip || profile.exitIp || '未检测');
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="openbrowser-native" content="1"><title>环境 ${number}</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#12141a;color:#e8eaf0;display:grid;place-items:center;min-height:100vh}
.card{width:min(720px,94vw);background:#1c1f28;border-radius:14px;overflow:hidden;border:1px solid #2a3040;box-shadow:0 20px 50px rgba(0,0,0,.35)}
.brand{display:flex;align-items:center;gap:14px;padding:22px 22px 8px}
.badge{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;font-size:22px;font-weight:800;color:#fff;background:linear-gradient(145deg,#2563eb,#1d4ed8)}
.head{background:linear-gradient(90deg,#1e3a5f,#243b55);color:#fff;text-align:center;padding:28px 16px;font-size:28px;font-weight:600;letter-spacing:.02em}
.body{padding:18px 22px 24px;line-height:1.8}.k{color:#8b93a7;display:inline-block;width:88px;text-align:right;margin-right:12px}</style></head>
<body><div class="card">
<div class="brand"><div class="badge">${number}</div><div><div style="font-size:18px;font-weight:700">环境 ${number}</div><div style="color:#8b93a7;font-size:12px">OpenBrowser · 本地环境标识</div></div></div>
<div class="head">${ip}</div><div class="body">
<div><span class="k">环境</span>环境 ${number}</div>
<div><span class="k">窗口名称</span>${name}</div>
<div><span class="k">说明</span>启动页服务异常：${escape(error.message)}（仍为 OpenBrowser 本地页）</div>
</div></div></body></html>`;
      const file = path.join(root, 'openbrowser-start.html');
      await fsp.writeFile(file, html, 'utf8');
      return toFileUrl(file);
    }
  },
  assignedExtensions(profileId) {
    const ids = this.assignments.get(profileId) || new Set();
    return [...ids].map((id) => this.extensions.get(id)).filter((item) => item && fs.existsSync(item.path));
  },
};
