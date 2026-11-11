'use strict';

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 简化国旗（32×32 圆形裁剪，纯本机渲染，不发任何外部请求）。
// 覆盖常见出口地区；未收录的地区回退为 ISO 码圆形徽章。
const FLAG_SVGS = {
  CN: '<rect width="32" height="32" fill="#de2910"/><polygon fill="#ffde00" points="10,7 11.41,11.06 15.71,11.15 12.28,13.74 13.53,17.85 10,15.4 6.47,17.85 7.72,13.74 4.29,11.15 8.59,11.06"/><g fill="#ffde00"><circle cx="19" cy="6.5" r="0.9"/><circle cx="21.5" cy="9" r="0.9"/><circle cx="21.5" cy="12.5" r="0.9"/><circle cx="19" cy="15" r="0.9"/></g>',
  US: '<rect width="32" height="32" fill="#b22234"/><g fill="#fff"><rect y="3" width="32" height="2.2"/><rect y="7.4" width="32" height="2.2"/><rect y="11.8" width="32" height="2.2"/><rect y="16.2" width="32" height="2.2"/><rect y="20.6" width="32" height="2.2"/><rect y="25" width="32" height="2.2"/></g><rect width="15" height="13" fill="#3c3b6e"/><g fill="#fff"><circle cx="3.5" cy="3" r="0.8"/><circle cx="7.5" cy="3" r="0.8"/><circle cx="11.5" cy="3" r="0.8"/><circle cx="5.5" cy="6" r="0.8"/><circle cx="9.5" cy="6" r="0.8"/><circle cx="3.5" cy="9" r="0.8"/><circle cx="7.5" cy="9" r="0.8"/><circle cx="11.5" cy="9" r="0.8"/></g>',
  GB: '<rect width="32" height="32" fill="#012169"/><path d="M0 0l32 32M32 0L0 32" stroke="#fff" stroke-width="4"/><path d="M0 0l32 32M32 0L0 32" stroke="#c8102e" stroke-width="1.8"/><path d="M16 0v32M0 16h32" stroke="#fff" stroke-width="6"/><path d="M16 0v32M0 16h32" stroke="#c8102e" stroke-width="3.4"/>',
  HK: '<rect width="32" height="32" fill="#de2910"/><g fill="#fff"><ellipse cx="16" cy="11" rx="2.4" ry="5"/><ellipse cx="16" cy="11" rx="2.4" ry="5" transform="rotate(72 16 16)"/><ellipse cx="16" cy="11" rx="2.4" ry="5" transform="rotate(144 16 16)"/><ellipse cx="16" cy="11" rx="2.4" ry="5" transform="rotate(216 16 16)"/><ellipse cx="16" cy="11" rx="2.4" ry="5" transform="rotate(288 16 16)"/></g><circle cx="16" cy="16" r="1.6" fill="#de2910"/>',
  TW: '<rect width="32" height="32" fill="#fe0000"/><rect width="16" height="16" fill="#000095"/><circle cx="8" cy="8" r="3.4" fill="#fff"/><circle cx="8" cy="8" r="1.7" fill="#000095"/>',
  JP: '<rect width="32" height="32" fill="#fff"/><circle cx="16" cy="16" r="8" fill="#bc002d"/>',
  KR: '<rect width="32" height="32" fill="#fff"/><path d="M7 16a9 9 0 0 1 18 0z" fill="#cd2e3a"/><path d="M25 16a9 9 0 0 1-18 0z" fill="#0047a0"/>',
  SG: '<rect width="32" height="32" fill="#fff"/><rect width="32" height="16" fill="#ed2939"/><circle cx="10" cy="8" r="5" fill="#fff"/><circle cx="12.2" cy="8" r="4.4" fill="#ed2939"/><g fill="#fff"><circle cx="15.5" cy="5.5" r="0.9"/><circle cx="18.5" cy="7.5" r="0.9"/><circle cx="17.3" cy="11" r="0.9"/><circle cx="13.7" cy="11" r="0.9"/><circle cx="12.5" cy="7.5" r="0.9"/></g>',
  MY: '<rect width="32" height="32" fill="#fff"/><g fill="#cc0001"><rect width="32" height="3.6"/><rect y="7.2" width="32" height="3.6"/><rect y="14.4" width="32" height="3.6"/><rect y="21.6" width="32" height="3.6"/><rect y="28.8" width="32" height="3.6"/></g><rect width="17" height="18" fill="#010066"/><circle cx="7" cy="9" r="4.6" fill="#ffcc00"/><circle cx="9" cy="9" r="3.9" fill="#010066"/><circle cx="12.6" cy="9" r="2" fill="#ffcc00"/>',
  TH: '<rect width="32" height="32" fill="#a51931"/><rect y="5.3" width="32" height="21.4" fill="#f4f5f8"/><rect y="10.7" width="32" height="10.6" fill="#2d2a4a"/>',
  VN: '<rect width="32" height="32" fill="#da251d"/><polygon fill="#ff0" points="16,9 17.64,14.06 22.94,14.15 18.68,17.28 20.24,22.35 16,19.3 11.76,22.35 13.32,17.28 9.06,14.15 14.36,14.06"/>',
  PH: '<rect width="32" height="32" fill="#0038a8"/><rect y="16" width="32" height="16" fill="#ce1126"/><path d="M0 0l14 16L0 32z" fill="#fff"/><circle cx="5.5" cy="16" r="2.6" fill="#fcd116"/>',
  ID: '<rect width="32" height="32" fill="#fff"/><rect width="32" height="16" fill="#ce1126"/>',
  IN: '<rect width="32" height="32" fill="#ff9933"/><rect y="10.7" width="32" height="10.6" fill="#fff"/><rect y="21.3" width="32" height="10.7" fill="#138808"/><circle cx="16" cy="16" r="3.4" fill="none" stroke="#000080" stroke-width="1.1"/><circle cx="16" cy="16" r="0.9" fill="#000080"/>',
  DE: '<rect width="32" height="32" fill="#000"/><rect y="10.7" width="32" height="10.6" fill="#dd0000"/><rect y="21.3" width="32" height="10.7" fill="#ffce00"/>',
  FR: '<rect width="32" height="32" fill="#fff"/><rect width="10.7" height="32" fill="#002395"/><rect x="21.3" width="10.7" height="32" fill="#ed2939"/>',
  IT: '<rect width="32" height="32" fill="#fff"/><rect width="10.7" height="32" fill="#009246"/><rect x="21.3" width="10.7" height="32" fill="#ce2b37"/>',
  ES: '<rect width="32" height="32" fill="#aa151b"/><rect y="8" width="32" height="16" fill="#f1bf00"/>',
  NL: '<rect width="32" height="32" fill="#fff"/><rect width="32" height="10.7" fill="#ae1c28"/><rect y="21.3" width="32" height="10.7" fill="#21468b"/>',
  PT: '<rect width="32" height="32" fill="#ff0000"/><rect width="12.8" height="32" fill="#006600"/><circle cx="12.8" cy="16" r="4.6" fill="#ffc400"/><circle cx="12.8" cy="16" r="2.6" fill="#ff0000" stroke="#fff" stroke-width="0.8"/>',
  RU: '<rect width="32" height="32" fill="#fff"/><rect y="10.7" width="32" height="10.6" fill="#0039a6"/><rect y="21.3" width="32" height="10.7" fill="#d52b1e"/>',
  BR: '<rect width="32" height="32" fill="#009c3b"/><polygon fill="#ffdf00" points="16,4 28,16 16,28 4,16"/><circle cx="16" cy="16" r="6.4" fill="#002776"/><path d="M9.9 14.2c3.8-2.4 8.4-2.4 12.2 0" stroke="#fff" stroke-width="1.3" fill="none"/>',
  CA: '<rect width="32" height="32" fill="#fff"/><rect width="8" height="32" fill="#d80621"/><rect x="24" width="8" height="32" fill="#d80621"/><polygon fill="#d80621" points="16,9 17.5,13 21,12 19.5,16 23,17.5 18.5,19.5 19.5,23 16,21 12.5,23 13.5,19.5 9,17.5 12.5,16 11,12 14.5,13"/>',
  AU: '<rect width="32" height="32" fill="#00247d"/><g transform="scale(0.5)"><path d="M0 0l32 32M32 0L0 32" stroke="#fff" stroke-width="4"/><path d="M16 0v32M0 16h32" stroke="#fff" stroke-width="6"/><path d="M16 0v32M0 16h32" stroke="#c8102e" stroke-width="3.4"/></g><g fill="#fff"><circle cx="22" cy="9" r="1.4"/><circle cx="26" cy="14" r="1.4"/><circle cx="20" cy="21" r="1.4"/><circle cx="25" cy="25" r="1.4"/><circle cx="9" cy="24" r="2.2"/></g>',
  TR: '<rect width="32" height="32" fill="#e30a17"/><circle cx="13" cy="16" r="6.4" fill="#fff"/><circle cx="15" cy="16" r="5.2" fill="#e30a17"/><polygon fill="#fff" points="21.5,16 24.5,15 22.6,17.5 22.6,14.5 24.5,17"/>',
  AE: '<rect width="32" height="32" fill="#fff"/><rect width="32" height="10.7" fill="#00732f"/><rect y="21.3" width="32" height="10.7" fill="#000"/><rect width="9" height="32" fill="#ff0000"/>',
  PL: '<rect width="32" height="32" fill="#dc143c"/><rect width="32" height="16" fill="#fff"/>',
  SE: '<rect width="32" height="32" fill="#006aa7"/><rect x="9" width="5.5" height="32" fill="#fecc00"/><rect y="13.2" width="32" height="5.5" fill="#fecc00"/>',
  UA: '<rect width="32" height="32" fill="#ffdd00"/><rect width="32" height="16" fill="#005bbb"/>',
  MX: '<rect width="32" height="32" fill="#fff"/><rect width="10.7" height="32" fill="#006847"/><rect x="21.3" width="10.7" height="32" fill="#ce1126"/><circle cx="16" cy="16" r="3.4" fill="#8c6a3f"/>',
  PK: '<rect width="32" height="32" fill="#01411c"/><rect width="9" height="32" fill="#fff"/><circle cx="19" cy="16" r="6.4" fill="#fff"/><circle cx="21.4" cy="14.6" r="5.6" fill="#01411c"/><polygon fill="#fff" points="24.5,9 25.3,11.2 27.5,10.4 26.2,12.4 28.2,13.6 25.9,13.9 26.2,16.2 24.5,14.5 22.8,16.2 23.1,13.9 20.8,13.6 22.8,12.4 21.5,10.4 23.7,11.2"/>',
  BD: '<rect width="32" height="32" fill="#006a4e"/><circle cx="14" cy="16" r="7" fill="#f42a41"/>',
  MM: '<rect width="32" height="32" fill="#fff"/><rect y="10.7" width="32" height="10.6" fill="#fecb00"/><rect y="21.3" width="32" height="10.7" fill="#ea2839"/><circle cx="16" cy="16" r="4.2" fill="#fff"/><circle cx="16" cy="16" r="2.6" fill="#fecb00"/>',
};

function flagSvg(code) {
  const cc = String(code || '').toUpperCase();
  const inner = FLAG_SVGS[cc];
  if (inner) {
    return `<svg viewBox="0 0 32 32" role="img" aria-label="${esc(cc)}"><g clip-path="url(#flag-clip)">${inner}</g></svg>`;
  }
  if (/^[A-Z]{2}$/.test(cc)) {
    return `<svg viewBox="0 0 32 32" role="img" aria-label="${esc(cc)}"><circle cx="16" cy="16" r="16" fill="#3b82f6"/><text x="16" y="20.5" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff" font-family="Arial,sans-serif">${esc(cc)}</text></svg>`;
  }
  return `<svg viewBox="0 0 32 32" role="img" aria-label="Globe"><circle cx="16" cy="16" r="16" fill="#dfe8f8"/><g fill="none" stroke="#9db4d8" stroke-width="1.2"><circle cx="16" cy="16" r="9"/><ellipse cx="16" cy="16" rx="4.5" ry="9"/><path d="M7 16h18M9 10.5h14M9 21.5h14"/></g></svg>`;
}

function buildStartPageHtml(data = {}) {
  const id = data.serial || data.id || data.number || '';
  const name = data.name || '';
  const pid = data.pid || data.profileId || '';
  const network = data.network || {};
  const title = [id, name].filter(Boolean).join(' ') || 'OpenBrowser 环境检测';
  const boot = {
    pid: String(pid || ''),
    title,
    network,
    timezone: data.timezone || network.timezone || '',
    networkMode: data.networkMode || (network.protocol === 'direct' ? 'direct' : 'proxy'),
    proxyProtocol: data.proxyProtocol || network.protocol || '',
    expected: data.expectedFingerprint || {},
  };
  const note = data.note || '';
  const groupName = data.group_name || data.group || '';
  const tagName = data.tag_name || data.tag || '';
  const username = data.username || data.account || '';
  const dash = '<span class="muted">--</span>';
  const version = '1.0.27';
  const initialFlag = flagSvg(network.countryCode);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="openbrowser-start-page" content="1">
  <meta name="openbrowser-native" content="1">
  <title>${esc(title)}</title>
  <style>
    :root{
      color-scheme:light;
      --bg-a:#f7f9fd;--bg-b:#f1f4fb;--bg-c:#e9edf9;
      --card:#ffffff;--line:#e7eaf1;--ink:#1f2329;--muted:#8a919c;
      --blue:#2f7af0;--blue-deep:#1f66dd;--blue-soft:#eaf2fe;
      --green:#21a45d;--green-soft:#e6f6ee;
      --amber:#d98a00;--amber-soft:#fdf3dd;
      --red:#e5484d;--red-soft:#fdeaea;
      --gray-soft:#f2f4f9;--track:#a9b1bf;
      --shadow:0 1px 2px rgba(31,35,41,.05),0 10px 30px rgba(47,84,155,.07);
    }
    @media (prefers-color-scheme: dark){:root{
      color-scheme:dark;
      --bg-a:#14171f;--bg-b:#161a24;--bg-c:#181c28;
      --card:#1e2330;--line:#2c3344;--ink:#e7eaf1;--muted:#98a0b0;
      --blue:#6b97ff;--blue-deep:#8dafff;--blue-soft:#24304a;
      --green:#3fce86;--green-soft:#1c3a2b;
      --amber:#eab54d;--amber-soft:#3d3018;
      --red:#f47b7e;--red-soft:#452124;
      --gray-soft:#272e3e;--track:#59637a;
      --shadow:0 1px 2px rgba(0,0,0,.3),0 10px 30px rgba(0,0,0,.25);
    }}
    @media (prefers-color-scheme: dark){.globe{color:#2c3a56}}
    *{box-sizing:border-box}
    html{min-height:100%}
    body{margin:0;color:var(--ink);font-size:14px;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",Roboto,"Helvetica Neue",Arial,sans-serif;background:linear-gradient(180deg,var(--bg-a) 0%,var(--bg-b) 46%,var(--bg-c) 100%);background-attachment:fixed;min-height:100vh}
    button{font-family:inherit}
    .shell{width:min(1120px,calc(100% - 40px));margin:0 auto}
    .topbar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:20px 6px 16px;flex-wrap:wrap}
    .tb-left{display:flex;align-items:center;gap:10px;min-width:0}
    .serial-pill{flex:none;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:var(--green);color:#fff;font-size:13px;font-weight:600;padding:3px 11px;border-radius:999px;letter-spacing:.02em}
    .tb-name{font-size:17px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .tb-right{display:flex;align-items:center;gap:7px;color:var(--muted);font-size:13px;white-space:nowrap}
    #tb-clock{color:var(--ink);font-weight:500;font-variant-numeric:tabular-nums}
    .card{background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow)}
    section.card{padding:22px 24px;margin-bottom:16px}
    .ip-card{position:relative;overflow:hidden;padding:24px 26px 26px}
    .globe{position:absolute;top:-34px;right:-30px;width:430px;height:230px;pointer-events:none;opacity:.85;color:#c9dcf8}
    .ip-head{position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
    .flag-slot{flex:none;width:46px;height:46px;border-radius:50%;overflow:hidden;box-shadow:0 2px 10px rgba(31,35,41,.16);background:#dfe8f8}
    .flag-slot svg{display:block;width:100%;height:100%}
    .ip-actions{display:flex;gap:10px;flex-wrap:wrap;position:relative}
    .btn{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:9px 18px;font-size:13.5px;font-weight:600;cursor:pointer;border:1px solid transparent;line-height:1.2;transition:background .15s,color .15s,border-color .15s}
    .btn svg{flex:none}
    .btn.solid{background:var(--blue);color:#fff}
    .btn.solid:hover{background:var(--blue-deep)}
    .btn.ghost{background:var(--blue-soft);color:var(--blue)}
    .btn.ghost:hover{border-color:var(--blue)}
    .btn:disabled{opacity:.55;cursor:wait}
    .ip-loc{position:relative;margin-top:30px;font-size:22px;font-weight:600;display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-height:30px}
    .ip-loc i{font-style:normal;color:var(--muted);font-weight:400}
    .ip-value{position:relative;margin-top:10px;font-size:30px;font-weight:700;color:var(--blue);letter-spacing:.01em;overflow-wrap:anywhere}
    #ip-ip{font-size:inherit}
    #ip-ip.small{font-size:20px}
    .error{display:none;position:relative;color:var(--red);margin-top:10px;line-height:1.5}
    .error.show{display:block}
    #country-note{display:none;position:relative;color:var(--amber);margin-top:10px;line-height:1.5;font-size:13px}
    #country-note.show{display:block}
    .card-title{margin:0 0 16px;font-size:16px;font-weight:700}
    .kv{display:grid;gap:13px;margin:0}
    .kv>div{display:grid;grid-template-columns:96px minmax(0,1fr);gap:12px;align-items:baseline}
    .kv dt{margin:0;color:var(--muted);font-size:14px;white-space:nowrap}
    .kv dd{margin:0;font-size:14px;overflow-wrap:anywhere;min-height:20px}
    .fp-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:24px 0 16px}
    .fp-head .card-title{margin:0}
    .sec-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:16px}
    .sec-head h2{margin:0;font-size:15.5px;font-weight:700}
    .sec-note{font-size:12px;color:var(--muted);text-align:right;overflow-wrap:anywhere}
    .score{min-width:150px;text-align:right;flex:none}
    .score-label{font-size:12px;color:var(--muted)}
    .score-value{font-size:22px;font-weight:700;margin:2px 0}
    .score-note{font-size:11px;color:var(--muted)}
    .score.good .score-value{color:var(--green)}
    .score.warn .score-value{color:var(--amber)}
    .score.bad .score-value{color:var(--red)}
    .health-score-card{border:1px solid var(--line);border-radius:12px;background:var(--gray-soft);padding:18px}
    .health-score-main{display:grid;grid-template-columns:170px minmax(0,1fr);gap:22px;align-items:center}
    .health-score-number{font-size:44px;font-weight:700;color:var(--blue);line-height:1}
    .health-score-number small{font-size:16px;color:var(--muted);font-weight:600}
    .health-score-label{font-size:17px;font-weight:700;margin-top:8px}
    .health-score-confidence{font-size:12px;color:var(--muted);margin-top:5px}
    .health-progress{height:14px;border-radius:999px;background:var(--card);border:1px solid var(--line);overflow:hidden}
    .health-progress span{display:block;height:100%;width:0;background:var(--green);transition:width .25s}
    .health-score-card.warn .health-progress span,.health-score-card.review .health-progress span{background:var(--amber)}
    .health-score-card.bad .health-progress span,.health-score-card.risky .health-progress span{background:var(--red)}
    .health-score-card.warn .health-score-number,.health-score-card.review .health-score-number{color:var(--amber)}
    .health-score-card.bad .health-score-number,.health-score-card.risky .health-score-number{color:var(--red)}
    .health-score-card.unknown .health-progress span{background:var(--track)}
    .health-factors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:16px}
    .health-factor{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--track);border-radius:10px;padding:11px 13px}
    .health-factor.good{border-left-color:var(--green)}
    .health-factor.warn{border-left-color:var(--amber)}
    .health-factor.bad{border-left-color:var(--red)}
    .health-factor b{display:block;font-size:13.5px}
    .health-factor p{margin:4px 0 0;color:var(--muted);font-size:12px;line-height:1.5}
    .identity-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}
    .mode-pill{display:inline-block;font-size:12px;font-weight:600;color:var(--blue);background:var(--blue-soft);border-radius:999px;padding:3px 10px}
    #asn-line{color:var(--muted);font-size:13px}
    .summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
    .summary-item{background:var(--gray-soft);border-radius:10px;padding:12px 14px;min-width:0}
    .summary-item span{display:block;font-size:12px;color:var(--muted);margin-bottom:4px}
    .summary-item b{font-size:14px;overflow-wrap:anywhere}
    .check-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
    .check{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--track);border-radius:10px;padding:12px 14px;min-width:0}
    .check.good{border-left-color:var(--green)}
    .check.warn{border-left-color:var(--amber)}
    .check.bad{border-left-color:var(--red)}
    .check-title{display:flex;align-items:center;justify-content:space-between;gap:10px;font-weight:600;font-size:13.5px}
    .status{font-size:11.5px;padding:2px 9px;border-radius:999px;background:var(--gray-soft);color:var(--muted);white-space:nowrap;font-weight:600}
    .good .status{background:var(--green-soft);color:var(--green)}
    .warn .status{background:var(--amber-soft);color:var(--amber)}
    .bad .status{background:var(--red-soft);color:var(--red)}
    .check p{margin:7px 0 0;color:var(--muted);font-size:12.5px;line-height:1.55;overflow-wrap:anywhere}
    .table{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 24px}
    .cell{display:grid;grid-template-columns:118px minmax(0,1fr);gap:12px;padding:9px 0;border-bottom:1px dashed var(--line);min-width:0}
    .cell.wide{grid-column:1/-1}
    .key{color:var(--muted);font-size:12.5px}
    .value{font-size:13px;font-weight:500;overflow-wrap:anywhere;min-height:18px}
    .muted{color:var(--muted);font-weight:400}
    .page-footer{display:flex;align-items:center;justify-content:space-between;gap:6px 16px;flex-wrap:wrap;color:var(--muted);font-size:12.5px;padding:6px 6px 44px}
    .page-footer a{color:var(--blue);text-decoration:none}
    .page-footer a:hover{text-decoration:underline}
    .page-footer .foot-note{flex-basis:100%;font-size:11.5px;opacity:.85;line-height:1.6}
    .toast{position:fixed;right:18px;top:18px;z-index:50;background:#23293a;color:#fff;padding:11px 16px;border-radius:10px;box-shadow:0 10px 28px rgba(0,0,0,.22);opacity:0;transform:translateY(-6px);transition:.18s;pointer-events:none;font-size:13px}
    .toast.show{opacity:1;transform:none}
    @media (prefers-color-scheme: dark){.toast{background:#e7eaf1;color:#1f2329}}
    @media(max-width:820px){.summary{grid-template-columns:repeat(2,minmax(0,1fr))}.health-score-main{grid-template-columns:1fr}.health-factors,.check-grid{grid-template-columns:1fr}.table{grid-template-columns:1fr}.ip-loc{font-size:19px}.ip-value{font-size:24px}.globe{opacity:.4}.sec-head{flex-wrap:wrap}}
    @media(max-width:560px){.shell{width:calc(100% - 24px)}.summary{grid-template-columns:1fr}.kv>div{grid-template-columns:84px minmax(0,1fr)}.cell{grid-template-columns:96px minmax(0,1fr)}.ip-actions{width:100%}}
  </style>
</head>
<body>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><clipPath id="flag-clip"><circle cx="16" cy="16" r="16"/></clipPath></defs></svg>
  <main class="shell">
    <header class="topbar">
      <div class="tb-left">
        <span class="serial-pill" id="tb-serial">${esc(id) || '--'}</span>
        <span class="tb-name" id="tb-name">${esc(name) || '<span class="muted">未命名环境</span>'}</span>
      </div>
      <div class="tb-right"><span id="tz-name">${esc(boot.timezone || '本机时区')}</span><span id="tz-offset"></span><span id="tb-clock">--</span></div>
    </header>

    <section class="card ip-card">
      <div class="globe" aria-hidden="true"><svg viewBox="0 0 430 230" fill="none"><g stroke="currentColor" stroke-width="1.1"><ellipse cx="300" cy="115" rx="200" ry="88"/><ellipse cx="300" cy="115" rx="200" ry="60"/><ellipse cx="300" cy="115" rx="200" ry="32"/><ellipse cx="300" cy="115" rx="150" ry="88" transform="rotate(-18 300 115)"/><ellipse cx="300" cy="115" rx="90" ry="88" transform="rotate(-18 300 115)"/><ellipse cx="300" cy="115" rx="30" ry="88" transform="rotate(-18 300 115)"/></g></svg></div>
      <div class="ip-head">
        <span class="flag-slot" id="flag-slot">${initialFlag}</span>
        <div class="ip-actions">
          <button class="btn ghost" id="btn-refresh" type="button" aria-label="重新检测"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>测试代理 IP</button>
          <button class="btn solid" id="btn-ip-query" type="button"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>代理 IP 查询</button>
        </div>
      </div>
      <div class="ip-loc"><b id="country">${esc(network.country || network.countryCode || '-')}</b><i>/</i><b id="region">${esc(network.region || '-')}</b><i>/</i><b id="city">${esc(network.city || '-')}</b></div>
      <div class="ip-value">IP: <span id="ip-ip">${esc(network.ip || '检测中...')}</span></div>
      <div class="error" id="ip-error"></div>
      <div id="country-note" ${network.countryNote ? 'class="show"' : ''}>${esc(network.countryNote || '')}</div>
    </section>

    <section class="card">
      <h3 class="card-title">窗口信息</h3>
      <dl class="kv">
        <div><dt>备注:</dt><dd>${note ? esc(note) : dash}</dd></div>
        <div><dt>项目:</dt><dd>${groupName ? esc(groupName) : '默认项目'}</dd></div>
        <div><dt>标签:</dt><dd>${tagName ? esc(tagName) : dash}</dd></div>
        ${username ? `<div><dt>用户名:</dt><dd>${esc(username)}</dd></div>` : ''}
      </dl>
      <div class="fp-head">
        <h3 class="card-title">指纹信息</h3>
        <button class="btn ghost" id="btn-fp-check" type="button"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>指纹检测</button>
      </div>
      <dl class="kv">
        <div><dt>系统/内核:</dt><dd id="fp-os-kernel">读取中...</dd></div>
        <div><dt>语言:</dt><dd id="fp-language">读取中...</dd></div>
        <div><dt>User Agent:</dt><dd id="fp-ua">读取中...</dd></div>
      </dl>
    </section>

    <section class="card">
      <div class="sec-head"><h2>IP 健康评分</h2><span class="sec-note">本地综合评估；仅供参考</span></div>
      <div class="health-score-card unknown" id="health-score-card">
        <div class="health-score-main">
          <div><div class="health-score-number"><span id="health-score-value">--</span><small> / 100</small></div><div class="health-score-label" id="health-score-label">待检测</div><div class="health-score-confidence" id="health-score-confidence">置信度：低</div></div>
          <div class="health-progress" aria-label="IP 健康评分进度"><span id="health-score-progress"></span></div>
        </div>
        <div class="health-factors" id="health-score-factors"><article class="health-factor neutral"><b>等待出口数据</b><p>取得 IP 后显示评分因素。</p></article></div>
      </div>
    </section>

    <section class="card">
      <div class="sec-head"><h2>IP 网络身份</h2><span class="sec-note" id="checked-at">等待出口数据</span></div>
      <div class="identity-head"><span class="mode-pill" id="network-mode">${esc(data.networkMode === 'direct' ? '直连模式' : (data.proxyProtocol || network.protocol || '代理模式').toUpperCase())}</span><span id="asn-line">${esc([network.asn, network.asName || network.isp].filter(Boolean).join(' · ') || '网络身份读取中')}</span></div>
      <div class="summary">
        <div class="summary-item"><span>ASN</span><b id="net-asn">${esc(network.asn || '-')}</b></div>
        <div class="summary-item"><span>ISP</span><b id="net-isp">${esc(network.isp || '-')}</b></div>
        <div class="summary-item"><span>组织</span><b id="net-org">${esc(network.organization || '-')}</b></div>
        <div class="summary-item"><span>坐标 / 邮编</span><b id="net-location">${esc([network.latitude, network.longitude].filter((v) => v != null).join(', ') || network.zip || '-')}</b></div>
        <div class="summary-item"><span>出口时区</span><b id="timezone">${esc(network.timezone || data.timezone || '-')}</b></div>
        <div class="summary-item"><span>网络类型</span><b id="network-type">检测中</b></div>
      </div>
    </section>

    <section class="card">
      <div class="sec-head">
        <div><h2>泄露与一致性</h2><span class="sec-note">浏览器观测与出口信息交叉检查</span></div>
        <div class="score" id="score-box"><div class="score-label">本地一致性评估</div><div class="score-value" id="score-value">检测中</div><div class="score-note" id="score-note">仅基于当前可见信号</div></div>
      </div>
      <div class="check-grid">
        <article class="check na" id="check-webrtc"><div class="check-title">WebRTC 地址暴露 <span class="status">检测中</span></div><p>正在收集 ICE candidate。</p></article>
        <article class="check na" id="check-timezone"><div class="check-title">时区一致性 <span class="status">检测中</span></div><p>正在比较浏览器时区与出口时区。</p></article>
        <article class="check na" id="check-language"><div class="check-title">语言与地区 <span class="status">检测中</span></div><p>正在比较首选语言与出口地区。</p></article>
        <article class="check na" id="check-automation"><div class="check-title">自动化标记 <span class="status">检测中</span></div><p>正在检查 webdriver 等可见标记。</p></article>
        <article class="check na" id="check-storage"><div class="check-title">本地存储能力 <span class="status">检测中</span></div><p>正在检查 Cookie、LocalStorage 与 IndexedDB。</p></article>
        <article class="check na" id="check-dns"><div class="check-title">DNS 泄露 <span class="status">检测中</span></div><p>正在触发唯一探测域名并比对 DNS 解析器地区与出口地区。</p></article>
      </div>
    </section>

    <section class="card">
      <div class="sec-head"><h2>访问能力</h2><span class="sec-note">出口 IP 地区 + 站点侧访问身份 + best-effort 可用性判断（非账号可用性保证）</span></div>
      <div class="check-grid" id="reachability-grid">
        <article class="check na" id="reach-google"><div class="check-title">Google <span class="status">等待</span></div><p>等待检测。</p></article>
        <article class="check na" id="reach-youtube"><div class="check-title">YouTube <span class="status">等待</span></div><p>等待检测。</p></article>
        <article class="check na" id="reach-tiktok"><div class="check-title">TikTok <span class="status">等待</span></div><p>等待检测。</p></article>
        <article class="check na" id="reach-x"><div class="check-title">X / Twitter <span class="status">等待</span></div><p>等待检测。</p></article>
        <article class="check na" id="reach-chatgpt"><div class="check-title">ChatGPT <span class="status">等待</span></div><p>等待检测。</p></article>
        <article class="check na" id="reach-wikipedia"><div class="check-title">Wikipedia <span class="status">等待</span></div><p>等待检测。</p></article>
        <article class="check na" id="reach-facebook"><div class="check-title">Facebook <span class="status">等待</span></div><p>等待检测。</p></article>
        <article class="check na" id="reach-instagram"><div class="check-title">Instagram <span class="status">等待</span></div><p>等待检测。</p></article>
        <article class="check na" id="reach-reddit"><div class="check-title">Reddit <span class="status">等待</span></div><p>等待检测。</p></article>
      </div>
    </section>

    <section class="card">
      <div class="sec-head"><h2>浏览器指纹表面</h2><span class="sec-note">数据只在当前本地页面计算</span></div>
      <div class="table" id="fingerprint-table">
        <div class="cell"><span class="key">平台</span><span class="value" id="fp-platform">读取中...</span></div>
        <div class="cell"><span class="key">浏览器时区</span><span class="value" id="fp-timezone">读取中...</span></div>
        <div class="cell"><span class="key">屏幕 / 视口</span><span class="value" id="fp-screen">读取中...</span></div>
        <div class="cell"><span class="key">CPU / 内存</span><span class="value" id="fp-hardware">读取中...</span></div>
        <div class="cell"><span class="key">WebGL Vendor</span><span class="value" id="fp-webgl-vendor">读取中...</span></div>
        <div class="cell"><span class="key">WebGL Renderer</span><span class="value" id="fp-webgl-renderer">读取中...</span></div>
        <div class="cell"><span class="key">Canvas 指纹</span><span class="value" id="fp-canvas">读取中...</span></div>
        <div class="cell"><span class="key">AudioContext</span><span class="value" id="fp-audio">读取中...</span></div>
        <div class="cell"><span class="key">触控 / 插件</span><span class="value" id="fp-capabilities">读取中...</span></div>
        <div class="cell"><span class="key">DNT / Cookies</span><span class="value" id="fp-privacy">读取中...</span></div>
        <div class="cell wide"><span class="key">UA Client Hints</span><span class="value" id="fp-hints">读取中...</span></div>
        <div class="cell wide"><span class="key">User Agent</span><span class="value" id="fp-ua-full">读取中...</span></div>
      </div>
    </section>

    <footer class="page-footer">
      <span>IP 查询数据来源: <a href="https://ip123.in/" target="_blank" rel="noopener noreferrer">ip123.in</a></span>
      <span>version ${version}</span>
      <span class="foot-note">本页健康结果为本地综合评估，不保证任何站点的账号可用性。代理、托管和移动网络标签来自多源出口查询；Canvas、WebGL 暴露代表可被读取的指纹表面，不等同于身份泄露。</span>
    </footer>
  </main>
  <div class="toast" id="toast"></div>
  <script>
  window.__OPENBROWSER_START__=${JSON.stringify(boot).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')};
  window.__OB_FLAGS__=${JSON.stringify(FLAG_SVGS).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')};
  (function(){
    'use strict';
    var BOOT=window.__OPENBROWSER_START__||{};
    var query=new URLSearchParams(location.search);
    var pid=BOOT.pid||query.get('pid')||query.get('id')||'';
    var sessionToken=query.get('token')||'';
    if(sessionToken&&history.replaceState){query.delete('token');var cleanQuery=query.toString();history.replaceState(null,'',location.pathname+(cleanQuery?'?'+cleanQuery:'')+location.hash)}
    var currentNetwork=BOOT.network||{};
    var fingerprint={};
    var findings=[];

    function byId(id){return document.getElementById(id)}
    function text(id,value){var el=byId(id);if(el)el.textContent=value==null||value===''?'-':String(value)}
    function toast(message){var el=byId('toast');if(!el)return;el.textContent=message;el.classList.add('show');setTimeout(function(){el.classList.remove('show')},1800)}
    function setCheck(id,state,label,detail){var el=byId(id);if(!el)return;el.className='check '+state;var status=el.querySelector('.status');var p=el.querySelector('p');if(status)status.textContent=label;if(p)p.textContent=detail}
    function addFinding(id,state,weight){findings=findings.filter(function(item){return item.id!==id});findings.push({id:id,state:state,weight:weight||0});renderScore()}
    function renderScore(){var warnings=findings.reduce(function(sum,item){return sum+(item.state==='bad'?item.weight*2:item.state==='warn'?item.weight:0)},0);var box=byId('score-box');var value=byId('score-value');var note=byId('score-note');if(!box||!value)return;box.className='score '+(warnings>=6?'bad':warnings>=2?'warn':'good');value.textContent=warnings>=6?'风险':warnings>=2?'注意':'一致';note.textContent=warnings>=6?'发现明显泄露或冲突':warnings>=2?'存在需要核对的信号':'未发现明显身份泄露'}
    function renderHealthScore(score){var card=byId('health-score-card');if(!card)return;score=score||{};var known=Number.isFinite(Number(score.score));var level=String(score.level||'unknown');var confidence={high:'高',medium:'中',low:'低'}[String(score.confidence||'low')]||'低';card.className='health-score-card '+level;text('health-score-value',known?Number(score.score):'--');text('health-score-label',score.label||'待检测');text('health-score-confidence','置信度：'+confidence);var progress=byId('health-score-progress');if(progress)progress.style.width=(known?Math.max(0,Math.min(100,Number(score.score))):0)+'%';var factors=byId('health-score-factors');if(!factors)return;factors.textContent='';(Array.isArray(score.factors)&&score.factors.length?score.factors:[{state:'neutral',label:'等待出口数据',detail:'取得 IP 后显示评分因素。'}]).forEach(function(factor){var article=document.createElement('article');article.className='health-factor '+String(factor.state||'neutral');var title=document.createElement('b');title.textContent=String(factor.label||'未命名因素');var detail=document.createElement('p');detail.textContent=String(factor.detail||'');article.appendChild(title);article.appendChild(detail);factors.appendChild(article)})}
    function api(path){var target=new URL(path,location.origin);if(pid&&!target.searchParams.has('pid'))target.searchParams.set('pid',pid);return fetch(target.pathname+target.search,{cache:'no-store',headers:{'X-OpenBrowser-Start-Token':sessionToken}}).then(function(response){return response.json().catch(function(){return {}}).then(function(body){if(!response.ok||!body.ok)throw new Error(body.msg||('HTTP '+response.status));return body})})}
    function networkType(net){var values=[];if(net.hosting)values.push('托管/机房');if(net.mobile)values.push('移动网络');if(net.proxy)values.push('代理标记');if(net.geoConflict)values.push('地区冲突');return values.length?values.join(' · '):'常规网络'}
    function isDirectMode(net){return BOOT.networkMode==='direct'||String((net&&net.protocol)||'').toLowerCase()==='direct'||String(BOOT.proxyProtocol||'').toLowerCase()==='direct'}
    function countryDisplay(net){var main=net.country||net.countryCode||'';if(net.geoConflict&&net.countryUsage&&net.countryRegistered&&net.countryUsage!==net.countryRegistered){return main+' · 使用 '+net.countryUsage+' / 注册 '+net.countryRegistered}if(net.geoConflict&&Array.isArray(net.countries)&&net.countries.length>1){return main+' · 多源 '+net.countries.join('/')}return main}
    function tzOffsetLabel(tz){if(!tz)return '';try{var parts=new Intl.DateTimeFormat('en-US',{timeZone:tz,timeZoneName:'longOffset'}).formatToParts(new Date());for(var i=0;i<parts.length;i++){if(parts[i].type==='timeZoneName'){var v=parts[i].value||'';if(v.indexOf('GMT')===0)return v}}}catch(_){}try{var parts2=new Intl.DateTimeFormat('en-US',{timeZone:tz,timeZoneName:'shortOffset'}).formatToParts(new Date());for(var j=0;j<parts2.length;j++){if(parts2[j].type==='timeZoneName'){var v2=parts2[j].value||'';if(v2.indexOf('GMT')===0)return v2}}}catch(_){}return ''}
    function pad2(n){return (n<10?'0':'')+n}
    function clockLabel(tz,now){try{return new Intl.DateTimeFormat('zh-CN',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now).split('/').join('-').replace(/\u202f/g,' ')}catch(_){return now.getFullYear()+'-'+pad2(now.getMonth()+1)+'-'+pad2(now.getDate())+' '+pad2(now.getHours())+':'+pad2(now.getMinutes())+':'+pad2(now.getSeconds())}}
    function tickClock(){var tz=(currentNetwork&&currentNetwork.timezone)||BOOT.timezone||'';var now=new Date();var offset=tzOffsetLabel(tz);var nameEl=byId('tz-name');var offsetEl=byId('tz-offset');if(nameEl)nameEl.textContent=tz||'本机时区';if(offsetEl)offsetEl.textContent=offset?'('+offset+')':'';text('tb-clock',clockLabel(tz||undefined,now))}
    function flagMarkup(cc){var code=String(cc||'').toUpperCase();var inner=(window.__OB_FLAGS__||{})[code];if(inner){return '<svg viewBox="0 0 32 32" role="img" aria-label="'+code+'"><g clip-path="url(#flag-clip)">'+inner+'</g></svg>'}if(/^[A-Z]{2}$/.test(code)){return '<svg viewBox="0 0 32 32" role="img" aria-label="'+code+'"><circle cx="16" cy="16" r="16" fill="#3b82f6"/><text x="16" y="20.5" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff" font-family="Arial,sans-serif">'+code+'</text></svg>'}return '<svg viewBox="0 0 32 32" role="img" aria-label="Globe"><circle cx="16" cy="16" r="16" fill="#dfe8f8"/><g fill="none" stroke="#9db4d8" stroke-width="1.2"><circle cx="16" cy="16" r="9"/><ellipse cx="16" cy="16" rx="4.5" ry="9"/><path d="M7 16h18M9 10.5h14M9 21.5h14"/></g></svg>'}
    function updateFlag(cc){var slot=byId('flag-slot');if(slot)slot.innerHTML=flagMarkup(cc)}
    function osKernel(){var ua=safeNav(function(){return navigator.userAgent},'')||'';var os='未知系统';if(/Windows/i.test(ua))os='Windows';else if(/Android/i.test(ua))os='Android';else if(/iPhone|iPad|iPod/i.test(ua))os='iOS';else if(/Mac OS X/i.test(ua))os='macOS';else if(/Linux/i.test(ua))os='Linux';var match=ua.match(/(Wayfern|Edg|Vivaldi|OPR|Chromium|Chrome|Firefox)[/]([0-9]+)/)||[];var names={Wayfern:'Wayfern',Edg:'Edge',Vivaldi:'Vivaldi',OPR:'Opera',Chromium:'Chromium',Chrome:'Chrome',Firefox:'Firefox'};var brand=match[1]?String(names[match[1]]||match[1]):'';var major=match[2]||'';if(brand&&major)return os+' / '+brand+' '+major;if(major)return os+' / '+major;return os}
    function applyNetwork(net){if(!net)return;currentNetwork=net;updateFlag(net.countryCode||'');var ip=net.ip||net.query||'';var directMode=isDirectMode(net);text('ip-ip',ip||(directMode?'本地直连':'未检测'));var ipEl=byId('ip-ip');if(ipEl)ipEl.classList.toggle('small',String(ip||'本地直连').length>22);text('country',countryDisplay(net));text('region',net.region||net.regionName);text('city',net.city);text('timezone',net.timezone);text('network-type',networkType(net));text('net-asn',net.asn);text('net-isp',net.isp);text('net-org',net.organization||net.org);text('net-location',[net.latitude,net.longitude].filter(function(v){return v!=null}).join(', ')||net.zip);text('asn-line',[net.asn,net.asName||net.isp].filter(Boolean).join(' · ')||(directMode?'直连出口':'网络身份读取中'));text('checked-at',net.checkedAt?'检测时间 '+new Date(net.checkedAt).toLocaleString():(ip?'出口数据已更新':(directMode?'直连可用，出口详情稍后补充':'-')));text('network-mode',directMode?'直连模式':String(BOOT.proxyProtocol||net.protocol||'代理').toUpperCase()+' 代理');var error=byId('ip-error');if(error){error.textContent='';error.classList.remove('show')}var note=byId('country-note');if(note){if(net.countryNote){note.textContent=net.countryNote;note.classList.add('show');note.style.display='block'}else{note.textContent='';note.classList.remove('show');note.style.display='none'}}if(ip)addFinding('network','good',0);else if(directMode)addFinding('network','good',0);evaluateConsistency();try{document.title=(ip?ip+' · ':'')+BOOT.title}catch(_){}}
    function showNetworkError(error){var message=String(error&&error.message||error||'未知错误');var directMode=isDirectMode(currentNetwork);if(directMode){applyNetwork(Object.assign({},currentNetwork,{protocol:'direct',soft:true}));return}text('ip-ip','检测失败');var el=byId('ip-ip');if(el)el.classList.add('small');var detail=byId('ip-error');if(detail){detail.textContent=message;detail.classList.add('show')}addFinding('network','bad',4);toast('出口检测失败：'+message)}
    function refreshNetwork(options){options=options||{};if(!pid){if(!options.silent)toast('无环境 ID');return Promise.resolve()}var button=byId('btn-refresh');if(button)button.disabled=true;return api('/api/network?pid='+encodeURIComponent(pid)+'&refresh=1').then(function(result){applyNetwork(result.data);if(!options.silent&&result.data&&result.data.ip)toast('检测已更新')}).catch(function(error){if(options.silent&&isDirectMode(currentNetwork)){applyNetwork(Object.assign({},currentNetwork,{protocol:'direct',soft:true}));return}showNetworkError(error)}).finally(function(){if(button)button.disabled=false})}

    var updateNetworkView=applyNetwork;
    applyNetwork=function(net){updateNetworkView(net);renderHealthScore(net&&net.healthScore)};
    function shortHash(input){var hash=2166136261;for(var i=0;i<input.length;i+=1){hash^=input.charCodeAt(i);hash=Math.imul(hash,16777619)}return ('00000000'+(hash>>>0).toString(16)).slice(-8)}
    function safeNav(getter, fallback){try{var value=getter();return value==null?fallback:value}catch(_){return fallback}}
    function safeLanguages(){try{var list=navigator.languages;if(list&&list.length)return Array.prototype.slice.call(list).filter(Boolean)}catch(_){}try{var one=navigator.language;if(one)return [one]}catch(_){}return []}
    function collectCanvas(){try{var canvas=document.createElement('canvas');canvas.width=280;canvas.height=60;var ctx=canvas.getContext('2d');if(!ctx)return '不可用';ctx.fillStyle='#f2f5f7';ctx.fillRect(0,0,280,60);ctx.font='16px Arial';ctx.fillStyle='#1769aa';ctx.fillText('OpenBrowser fingerprint 012345',8,25);ctx.fillStyle='rgba(180,50,45,.7)';ctx.fillText('Canvas surface',33,47);return shortHash(canvas.toDataURL())}catch(error){return '已阻止 ('+error.name+')'}}
    function collectWebgl(){try{var canvas=document.createElement('canvas');var gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');if(!gl)return {vendor:'不可用',renderer:'不可用'};var ext=gl.getExtension('WEBGL_debug_renderer_info');return {vendor:ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):gl.getParameter(gl.VENDOR),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}}catch(error){return {vendor:'已阻止',renderer:error.name}}}
    function collectAudio(){try{var Context=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!Context)return Promise.resolve('不可用');var context=new Context(1,2048,44100);var oscillator=context.createOscillator();var compressor=context.createDynamicsCompressor();oscillator.type='triangle';oscillator.frequency.value=10000;oscillator.connect(compressor);compressor.connect(context.destination);oscillator.start(0);return context.startRendering().then(function(buffer){var data=buffer.getChannelData(0);var sum=0;for(var i=0;i<data.length;i+=16)sum+=Math.abs(data[i]);return shortHash(sum.toFixed(12))}).catch(function(error){return '已阻止 ('+error.name+')'})}catch(error){return Promise.resolve('已阻止 ('+error.name+')')}}
    function storageTest(){var local=false;try{localStorage.setItem('__ob_test','1');local=localStorage.getItem('__ob_test')==='1';localStorage.removeItem('__ob_test')}catch(_){}return {cookie:safeNav(function(){return navigator.cookieEnabled},false),local:local,indexed:typeof indexedDB!=='undefined'}}
    function collectClientHints(){var data=safeNav(function(){return navigator.userAgentData},null);if(!data)return Promise.resolve('不可用');var base='';try{base=(data.brands||[]).map(function(item){return item.brand+' '+item.version}).join(', ')+' · '+data.platform+(data.mobile?' · Mobile':'')}catch(_){base='Client Hints'}if(!data.getHighEntropyValues)return Promise.resolve(base);try{return data.getHighEntropyValues(['architecture','bitness','model','platformVersion','uaFullVersion']).then(function(value){return base+' · '+[value.architecture,value.bitness,value.model,value.platformVersion,value.uaFullVersion].filter(Boolean).join(' / ')}).catch(function(){return base})}catch(_){return Promise.resolve(base)}}
    function updateAutomationCheck(){var exposed=safeNav(function(){return navigator.webdriver===true},false);if(fingerprint)fingerprint.webdriver=exposed;setCheck('check-automation',exposed?'bad':'good',exposed?'已暴露':'未发现',exposed?'navigator.webdriver = true，可被站点识别为自动化环境。':'未发现 navigator.webdriver 自动化标记。');addFinding('automation',exposed?'bad':'good',3);renderScore()}
    function reportFingerprint(phase){try{var live={phase:phase||'page',userAgent:safeNav(function(){return navigator.userAgent},'')||'',platform:safeNav(function(){return navigator.platform},'')||'',language:safeNav(function(){return navigator.language},'')||'',languages:safeLanguages(),hardwareConcurrency:safeNav(function(){return navigator.hardwareConcurrency},null),deviceMemory:safeNav(function(){return navigator.deviceMemory},null),webglVendor:fingerprint&&fingerprint.webglVendor,webglRenderer:fingerprint&&fingerprint.webglRenderer,canvas:fingerprint&&fingerprint.canvas,webdriver:safeNav(function(){return navigator.webdriver===true},false),timezone:(function(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(_){return ''}})(),href:String(location.href||'')};fetch('/api/fingerprint-report?pid='+encodeURIComponent(pid),{method:'POST',headers:{'Content-Type':'application/json','X-OpenBrowser-Start-Token':sessionToken},body:JSON.stringify({phase:phase||'page',live:live}),credentials:'omit'}).catch(function(){})}catch(_){}}
    function collectFingerprint(phase){try{var timezone='';try{timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(_){}var gl=collectWebgl();var storage=storageTest();var cores=safeNav(function(){return navigator.hardwareConcurrency},'?');var memory=safeNav(function(){return navigator.deviceMemory},'?');var touch=safeNav(function(){return navigator.maxTouchPoints},0)||0;var plugins=0;try{plugins=(navigator.plugins&&navigator.plugins.length)||0}catch(_){plugins=0}var dnt=safeNav(function(){return navigator.doNotTrack},'')||'默认';fingerprint={userAgent:safeNav(function(){return navigator.userAgent},'')||'',platform:safeNav(function(){return navigator.platform},'')||'',languages:safeLanguages(),timezone:timezone,screen:screen.width+' × '+screen.height+' @ '+(window.devicePixelRatio||1)+'x; viewport '+innerWidth+' × '+innerHeight,hardware:cores+' cores / '+memory+' GB',webglVendor:gl.vendor,webglRenderer:gl.renderer,canvas:collectCanvas(),webdriver:safeNav(function(){return navigator.webdriver===true},false),storage:storage};text('fp-ua',fingerprint.userAgent);text('fp-ua-full',fingerprint.userAgent);text('fp-platform',fingerprint.platform);text('fp-language',fingerprint.languages.join(', '));text('fp-timezone',timezone);text('fp-screen',fingerprint.screen);text('fp-hardware',fingerprint.hardware);text('fp-webgl-vendor',gl.vendor);text('fp-webgl-renderer',gl.renderer);text('fp-canvas',fingerprint.canvas);text('fp-capabilities',touch+' touch points / '+plugins+' plugins');text('fp-privacy',dnt+' / Cookies '+(storage.cookie?'可用':'禁用'));text('fp-os-kernel',osKernel());setCheck('check-storage',storage.cookie&&storage.local&&storage.indexed?'good':'warn',storage.cookie&&storage.local&&storage.indexed?'正常':'受限','Cookie '+(storage.cookie?'可用':'禁用')+'，LocalStorage '+(storage.local?'可用':'禁用')+'，IndexedDB '+(storage.indexed?'可用':'禁用'));addFinding('storage',storage.cookie&&storage.local&&storage.indexed?'good':'warn',1);updateAutomationCheck();collectAudio().then(function(value){text('fp-audio',value)});collectClientHints().then(function(value){text('fp-hints',value)});evaluateConsistency();reportFingerprint(phase||'collect');setTimeout(updateAutomationCheck,400);setTimeout(updateAutomationCheck,1200)}catch(error){try{console.warn('[OpenBrowser] collectFingerprint', error)}catch(_){}}}
    function isPrivateIp(ip){return /^(10[.]|127[.]|169[.]254[.]|192[.]168[.]|172[.](1[6-9]|2[0-9]|3[01])[.])/.test(ip)||/^f[cd][0-9a-f]{2}:/i.test(ip)||/^::1$/.test(ip)}
    function collectWebrtc(){var Peer=window.RTCPeerConnection||window.webkitRTCPeerConnection;if(!Peer){setCheck('check-webrtc','good','已禁用','当前环境不提供 RTCPeerConnection，未暴露 ICE 地址。');addFinding('webrtc','good',0);return}var candidates=[];var pc;try{pc=new Peer({iceServers:[]});pc.createDataChannel('check');pc.onicecandidate=function(event){if(event&&event.candidate){var candidate=event.candidate;var address=candidate.address||String(candidate.candidate||'').match(/(?:[0-9]{1,3}[.]){3}[0-9]{1,3}|[0-9a-f:]{3,}/i)?.[0]||'';if(address&&!candidates.includes(address))candidates.push(address)}};pc.createOffer().then(function(offer){return pc.setLocalDescription(offer)}).catch(function(){});setTimeout(function(){try{pc.close()}catch(_){}var mdns=candidates.filter(function(value){return /[.]local$/i.test(value)});var privateIps=candidates.filter(isPrivateIp);var publicIps=candidates.filter(function(value){return !isPrivateIp(value)&&!/[.]local$/i.test(value)});var mismatch=publicIps.some(function(value){return currentNetwork.ip&&value!==currentNetwork.ip});if(mismatch){setCheck('check-webrtc','bad','公网 IP 泄露','ICE 暴露 '+publicIps.join(', ')+'，与出口 '+(currentNetwork.ip||'未知')+' 不一致。');addFinding('webrtc','bad',4)}else if(privateIps.length){setCheck('check-webrtc','warn','内网地址可见','ICE 暴露内网地址：'+privateIps.join(', ')+'。');addFinding('webrtc','warn',2)}else if(publicIps.length){setCheck('check-webrtc','good','出口一致','ICE 公网地址与当前出口一致：'+publicIps.join(', ')+'。');addFinding('webrtc','good',0)}else if(mdns.length){setCheck('check-webrtc','good','mDNS 隐藏','仅发现 mDNS 随机主机名，未读取到真实地址。');addFinding('webrtc','good',0)}else{setCheck('check-webrtc','good','无候选地址','未收集到可识别的 ICE 地址。');addFinding('webrtc','good',0)}},1800)}catch(error){setCheck('check-webrtc','good','已限制','WebRTC 检测被环境限制：'+error.name);addFinding('webrtc','good',0)}}
    function unlockLabel(item){var u=String(item&&item.unlock||'');if(u==='unlocked')return '可用';if(u==='blocked')return '拦截/不可用';if(u==='reachable')return '可连接';if(u==='unreachable')return '不可达';return item&&item.ok?'可连接':'失败'}
    function unlockState(item){var u=String(item&&item.unlock||'');if(u==='unlocked')return 'good';if(u==='blocked')return 'bad';if(u==='reachable')return 'good';if(u==='unreachable')return 'warn';return item&&item.ok?'good':'warn'}
    function formatAccessLine(item){var parts=[];var accessCountry=item.accessCountry||item.siteCountry||item.exitCountry||'';var accessIp=item.accessIp||item.siteIp||item.exitIp||'';var siteIp=item.siteIp||'';var siteCountry=item.siteCountry||'';var exitIp=item.exitIp||'';var exitCountry=item.exitCountry||'';if(accessIp||accessCountry){parts.push('访问身份 '+(accessCountry||'未知地区')+(accessIp?' · '+accessIp:''))}if(siteIp&&siteIp!==accessIp){parts.push('站点可见 IP '+siteIp+(siteCountry?'（'+siteCountry+'）':''))}if(exitIp&&exitIp!==accessIp&&exitIp!==siteIp){parts.push('环境出口 '+(exitCountry||'')+(exitIp?' · '+exitIp:''))}if(item.colo)parts.push('边缘 '+item.colo);if(item.status)parts.push('HTTP '+item.status);return parts.join('；')||'无访问身份数据'}
    function checkReachability(force){var map={google:'reach-google',youtube:'reach-youtube',tiktok:'reach-tiktok',x:'reach-x',chatgpt:'reach-chatgpt',wikipedia:'reach-wikipedia',facebook:'reach-facebook',instagram:'reach-instagram',reddit:'reach-reddit'};Object.keys(map).forEach(function(id){setCheck(map[id],'na','检测中','正在检测连通性、访问 IP 地区与可用性信号。')});api('/api/reachability'+(force?'?refresh=1':'')).then(function(result){var data=result.data||{};Object.keys(map).forEach(function(id){var item=data[id]||{};var host=String(item.url||id).replace('https://','').replace('http://','');var line=formatAccessLine(item);var note=item.unlock==='unlocked'?'best-effort 可用性信号通过':item.unlock==='blocked'?'站点返回拦截/不可用信号':item.unlock==='reachable'?'连通正常，无独立可用性信号':item.error?String(item.error):'';if(item.ok||item.unlock==='unlocked'||item.unlock==='reachable'){setCheck(map[id],unlockState(item),unlockLabel(item),host+' · '+line+(note?'。'+note+'。':'。'))}else{setCheck(map[id],unlockState(item),unlockLabel(item),host+' 检测失败：'+(item.error||('HTTP '+(item.status||0)))+(line?'；'+line:'')+'。')}})}).catch(function(error){Object.keys(map).forEach(function(id){setCheck(map[id],'warn','失败','本地连通性检测失败：'+String(error&&error.message||error))})})}
    function checkDnsLeak(){setCheck('check-dns','na','检测中','正在触发唯一探测域名并比对 DNS 解析器与出口地区。');api('/api/dns-leak').then(function(result){var data=result.data||{};var servers=Array.isArray(data.servers)?data.servers:[];var serverText=servers.slice(0,4).map(function(item){return item.ip+(item.countryCode?('('+item.countryCode+')'):'')}).join(', ');var detail=data.detail||'';if(serverText&&detail.indexOf(serverText)<0)detail=(detail?detail+'。':'')+'DNS: '+serverText;var state=data.state==='bad'?'bad':data.state==='good'?'good':data.state==='warn'?'warn':'na';setCheck('check-dns',state,data.label||'已检测',detail||'DNS 检测完成。');addFinding('dns',state==='bad'?'bad':state==='warn'?'warn':'good',state==='bad'?4:state==='warn'?2:0);renderScore()}).catch(function(error){setCheck('check-dns','warn','检测失败','DNS 泄露检测失败：'+String(error&&error.message||error));addFinding('dns','warn',1);renderScore()})}
    function languageMatchesCountry(language,country){if(!language||!country)return true;var region=String(language).split('-')[1];return !region||region.toUpperCase()===String(country).toUpperCase()}
    function evaluateConsistency(){if(!fingerprint.timezone)return;var expected=BOOT.expected||{};var exitTz=currentNetwork.timezone||'';var tzMatch=!exitTz||fingerprint.timezone===exitTz;if(tzMatch){setCheck('check-timezone','good','一致',exitTz?'浏览器与出口均为 '+exitTz+'。':'出口未返回时区，浏览器时区为 '+fingerprint.timezone+'。')}else{setCheck('check-timezone','warn','不一致','浏览器为 '+fingerprint.timezone+'，出口为 '+exitTz+'。')}addFinding('timezone',tzMatch?'good':'warn',2);var language=fingerprint.languages[0]||'';var languageMatch=languageMatchesCountry(language,currentNetwork.countryCode);if(languageMatch){setCheck('check-language','good','合理',language+' 与出口地区 '+(currentNetwork.countryCode||'未知')+' 未发现明显冲突。')}else{setCheck('check-language','warn','需核对',language+' 与出口地区 '+currentNetwork.countryCode+' 不一致。')}addFinding('language',languageMatch?'good':'warn',1);var uaMatch=!expected.userAgent||expected.userAgent===fingerprint.userAgent;addFinding('ua',uaMatch?'good':'warn',2)}

    byId('btn-refresh').addEventListener('click',function(){refreshNetwork().finally(function(){checkReachability(true)})});
    tickClock();setInterval(tickClock,1000);
    text('fp-os-kernel',osKernel());
    updateFlag((currentNetwork&&currentNetwork.countryCode)||'');
    var ipQueryBtn=byId('btn-ip-query');if(ipQueryBtn)ipQueryBtn.addEventListener('click',function(){try{window.open('https://ip123.in/','_blank','noopener')}catch(_){}});
    var fpCheckBtn=byId('btn-fp-check');if(fpCheckBtn)fpCheckBtn.addEventListener('click',function(){try{window.open('https://www.browserscan.net/','_blank','noopener')}catch(_){}});
    // Collect after inject settles; each sample is also POSTed to
    // /api/fingerprint-report → fingerprint-inject.log (no need to copy UI).
    try { window.__openbrowserCollectFingerprint = function(phase){ try { return collectFingerprint(phase); } catch(e){ try{ console.warn(e); }catch(_){} } }; } catch(_){}
    // Delay first paint so document-start / post-nav inject can land first.
    // t0 at 0ms still saw host GPU/cores on openbrowser-148 before inject settled.
    setTimeout(function(){collectFingerprint('t0')}, 220);
    setTimeout(function(){collectFingerprint('t350')},450);
    setTimeout(function(){collectFingerprint('t1200')},1200);
    setTimeout(function(){collectFingerprint('t2500')},2500);
    setTimeout(function(){collectFingerprint('t4000')},4000);
    collectWebrtc();checkReachability();checkDnsLeak();renderScore();
    if(currentNetwork&&currentNetwork.ip)applyNetwork(currentNetwork);
    else if(isDirectMode(currentNetwork)){applyNetwork(Object.assign({protocol:'direct'},currentNetwork));refreshNetwork({silent:true})}
    else refreshNetwork({silent:true});
  })();
  </script>
</body>
</html>`;
}

module.exports = { buildStartPageHtml };
