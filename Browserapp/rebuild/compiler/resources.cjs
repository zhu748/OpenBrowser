const fs = require("fs"),
  a = require("acorn"),
  w = require("acorn-walk");
const src = (process.env.ROXY_SOURCE || "/workspace/roxy-src") + "/web",
  dst = process.env.REBUILD_OUTPUT || "Browserapp/roxy-ui";
const css = new Set();
function deps(file, condition) {
  const code = fs.readFileSync(src + "/assets/" + file, "utf8");
  const ast = a.parse(code, { ecmaVersion: "latest", sourceType: "module" });
  let map = [];
  w.simple(ast, {
    AssignmentExpression(n) {
      if (
        n.left.type === "MemberExpression" &&
        n.left.property.name === "f" &&
        n.right.type === "ArrayExpression"
      )
        map = n.right.elements.map((e) => e.value);
    },
  });
  w.simple(ast, {
    ObjectExpression(n) {
      const name = n.properties.find((p) => p.key?.name === "name");
      const value = name?.value?.quasis?.[0]?.value.cooked;
      if (!condition(value)) return;
      const comp = n.properties.find((p) => p.key?.name === "component");
      if (!comp) return;
      w.simple(comp.value, {
        CallExpression(c) {
          if (c.callee.name === "__vite__mapDeps")
            for (const i of c.arguments[0].elements) {
              const p = map[i.value];
              if (p?.endsWith(".css")) css.add(p);
            }
        },
      });
    },
  });
  return { code, map };
}
const main = deps("main-CWmwdLIL.js", () => false);
css.add("assets/window-list-DVlbVHdg.css");
css.add("assets/synchronizer-Dvr2NSvU.css");
css.add("assets/action-bar-wpLLnkNt.css");
for (const name of [
  "base-dialog-CVdM7Cnu",
  "batch-inputs-D36ClwFU",
  "open-sites-BB547REz",
  "preferences-CL1kBob1",
  "syncing-window-list-DGi17PrZ",
])
  css.add("assets/" + name + ".css");
for (const file of fs.readdirSync(src + "/assets"))
  if (file.startsWith("custom-layout-") && file.endsWith(".css"))
    css.add("assets/" + file);
for (const p of main.map) if (p.endsWith(".css")) css.add(p);
deps("hook-CnJE4hRq.js", (n) =>
  [
    "home",
    "browser-list",
    "browser-create",
    "browser-edit",
    "project-list",
    "project-item",
    "agent-list",
    "account-list",
    "account-create",
    "local-extensions",
    "extensions",
    "api-keys",
    "agent-create",
    "agent-console",
    "agent-console-task-manager",
    "agent-console-my-templates",
    "agent-console-settings",
    "agent-console-template-store",
  ].includes(n),
);
let html = `<!doctype html><html lang="zh-CN" spellcheck="false"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OpenBrowser 工作台</title><link rel="icon" href="/images/openbrowser.png">${[...css].map((p) => `<link rel="stylesheet" href="/${p}">`).join("\n")}<script type="module" src="/assets/bootstrap.js"></script></head><body><div id="app"></div></body></html>`;
fs.writeFileSync(dst + "/index.html", html);
fs.copyFileSync(
  "Browserapp/assets/logo-pixel.png",
  dst + "/images/openbrowser.png",
);
for (const [theme, color] of [
  ["light", "#111213"],
  ["dark", "#ffffff"],
])
  fs.writeFileSync(
    dst + "/images/openbrowser-wordmark-" + theme + ".svg",
    `<svg xmlns="http://www.w3.org/2000/svg" width="146" height="24"><text x="0" y="19" font-family="Inter,Arial,sans-serif" font-size="20" font-weight="700" fill="${color}">OpenBrowser</text></svg>`,
  );
// Translation values change, keys remain byte-for-byte unchanged.
for (const file of ["zh-CN-CKEkLKpn.js", "en-D33DiJcZ.js", "ru-Bo9bnzty.js"]) {
  const f = dst + "/assets/" + file;
  if (!fs.existsSync(f)) continue;
  let code = fs.readFileSync(f, "utf8"),
    ast = a.parse(code, { ecmaVersion: "latest", sourceType: "module" }),
    ed = [];
  const local = {
    "空间拥有者和管理者可查看、修改和删除所有任务；其他角色只能查看和管理自己的任务。计划任务仍由创建者账号登录的客户端执行。":
      "任务与执行日志保存在本机；应用运行时按计划执行。",
  };
  w.simple(ast, {
    VariableDeclarator(n) {
      if (n.init?.type !== "Literal" || typeof n.init.value !== "string")
        return;
      const text = n.init.value,
        brand = text.replace(
          /RoxyBrowser|Roxy浏览器|Roxy Browser|Roxy内核|Roxy Agent|Roxy AI|RoxyPhone|RoxyClaw/gi,
          "OpenBrowser",
        );
      if (text !== brand)
        ed.push([n.init.start, n.init.end, JSON.stringify(brand)]);
    },
    Property(n) {
      const v = n.value;
      const key = n.key.name ?? n.key.value ?? n.key.quasis?.[0]?.value.cooked;
      if (file.startsWith("zh-CN-") && Object.hasOwn(local, key)) {
        ed.push([v.start, v.end, JSON.stringify(local[key])]);
        return;
      }
      if (
        (v.type === "Literal" && typeof v.value === "string") ||
        (v.type === "TemplateLiteral" && !v.expressions.length)
      ) {
        const t = v.type === "Literal" ? v.value : v.quasis[0].value.cooked,
          brand = t.replace(
            /RoxyBrowser|Roxy浏览器|Roxy Browser|Roxy内核|Roxy Agent|Roxy AI/gi,
            "OpenBrowser",
          );
        const localValues = {
          "在此购买代理 IP，并更方便地与窗口进行绑定。":
            "添加本地代理 IP，并更方便地与窗口进行绑定。",
          "项目功能可以帮助您将窗口或团队成员进行分配，并更高效地管理。":
            "项目功能可以帮助您分组管理窗口，并更高效地管理。",
        };
        const key =
          n.key.name ?? n.key.value ?? n.key.quasis?.[0]?.value.cooked;
        const finalValue =
          file.startsWith("zh-CN-") && Object.hasOwn(localValues, key)
            ? localValues[key]
            : brand;
        if (t !== finalValue)
          ed.push([v.start, v.end, JSON.stringify(finalValue)]);
      }
    },
  });
  for (const [s, e, v] of ed.sort((a, b) => b[0] - a[0]))
    code = code.slice(0, s) + v + code.slice(e);
  if (file.startsWith("zh-CN-")) {
    const parsed = a.parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
    });
    const name = parsed.body
      .find((n) => n.type === "ExportNamedDeclaration")
      .specifiers.find((n) => n.exported.name === "default").local.name;
    const dictionary = parsed.body
      .filter((n) => n.type === "VariableDeclaration")
      .flatMap((n) => n.declarations)
      .find((n) => n.id.name === name)?.init;
    if (dictionary?.type !== "ObjectExpression")
      throw Error("Locale dictionary shape changed");
    const existing = new Set(
      dictionary.properties.map((p) => p.key.name ?? p.key.value),
    );
    const missing = Object.entries(local).filter(([key]) => !existing.has(key));
    if (missing.length)
      code =
        code.slice(0, dictionary.end - 1) +
        "," +
        missing
          .map(
            ([key, value]) => JSON.stringify(key) + ":" + JSON.stringify(value),
          )
          .join(",") +
        code.slice(dictionary.end - 1);
  }
  fs.writeFileSync(f, code);
}
console.log("CSS", css.size);
fs.writeFileSync(
  "docs/rebuild/style-inventory.json",
  JSON.stringify([...css], null, 2),
);

// These three original border colors are reused only for the local unlimited
// usage card requested in the annotated screenshot; no commercial widgets.
{
  const postcss = require("postcss");
  const theme = postcss.parse(
    fs.readFileSync(src + "/assets/theme-sp0uFzH4.css", "utf8"),
  );
  let aliases = "";
  theme.walkRules((rule) => {
    const declarations = [];
    rule.walkDecls((decl) => {
      const match = decl.prop.match(
        /^--pattern-wallet-prime-border-(blue|orange|purple)$/,
      );
      if (match)
        declarations.push(
          "--local-usage-border-" + match[1] + ":" + decl.value,
        );
    });
    if (declarations.length)
      aliases += rule.selector + "{" + declarations.join(";") + "}";
  });
  fs.writeFileSync(
    dst + "/assets/workbench-chrome.css",
    aliases +
      fs.readFileSync("Browserapp/rebuild/workbench-chrome.css", "utf8"),
  );
  const index = dst + "/index.html";
  fs.writeFileSync(
    index,
    fs
      .readFileSync(index, "utf8")
      .replace(
        "</head>",
        '<link rel="stylesheet" href="/assets/workbench-chrome.css"></head>',
      ),
  );
}
