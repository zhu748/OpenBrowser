"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  acorn = require("acorn"),
  walk = require("acorn-walk");
const dir = "work/rebuild/stage/assets";
const removedScopes = new Set();
const consultationWidgets = new Map();
function edit(file, visit) {
  let code = fs.readFileSync(path.join(dir, file), "utf8");
  const ast = acorn.parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
    }),
    edits = [];
  visit(ast, code, edits);
  edits.sort((a, b) => b[0] - a[0]);
  let boundary = Infinity;
  for (const [start, end, text] of edits) {
    if (end > boundary) continue;
    code = code.slice(0, start) + text + code.slice(end);
    boundary = start;
  }
  fs.writeFileSync(path.join(dir, file), code);
}
edit("create-HSjma60V.js", (ast, code, edits) =>
  walk.simple(ast, {
    FunctionDeclaration(n) {
      if (n.id.name === "I" && code.slice(n.start, n.end).includes("x(Le,"))
        edits.push([n.body.start, n.body.end, "{return z(e,t);}"]);
    },
  }),
);
edit("useQuickCreate-DgAf1jWE.js", (ast, code, edits) =>
  walk.simple(ast, {
    FunctionDeclaration(n) {
      if (n.id.name === "W" && code.slice(n.start, n.end).includes("g(me,"))
        edits.push([n.body.start, n.body.end, "{return await U(true);}"]);
    },
  }),
);
// These widgets exclusively implement removed payment/marketing flows, never kernel updates.
const commercial = {
  "hook-CnJE4hRq.js": new Set([
    "balance-success",
    "plan-success",
    "rx-amount-quick-check",
    "payway-category-select",
    "next-bouns",
    "activity-rechange-modal",
    "SlotMachine",
    "lucky-draw",
    "result",
    "referral-modal",
    "batch-invite-modal",
    "proxy-purchase-success",
    "stripe-pay",
    "wallet-payment-methods",
    "wallet-recharge-modal",
    "prizes",
    "PurchaseAgentPoints",
    "processing-modal",
    "payway-usdt-modal",
    "payway-wechat-modal",
    "payway-alipay-modal",
    "auto-renew-modal",
    "wallet-pay-modal",
    "SidebarFooter",
  ]),
  "TemplateStoreRoute-vzcUC0bD.js": new Set(["CustomTemplateBanner"]),
  "useCustomTemplateDialog-2nSs2D8n.js": new Set(["CustomTemplateDialog"]),
  "single-proxies-C7CAMkyq.js": new Set(["proxy-advertise-banner"]),
  "live-chat-DNUnbM8O.js": new Set(["live-chat"]),
  "operation-zwm3okqF.js": new Set(["expire-date", "bandwidth-cell"]),
  "operationHandlers-Db52Gyo7.js": new Set(["trial-ended"]),
  "renewal-reminder-drawer-C9_4HaAB.js": new Set(["renewal-reminder-drawer"]),
  "useAsyncGate-D7VA7DLY.js": new Set([
    "proxy-buy-add-drawer",
    "proxy-country-switch",
  ]),
  "invite-user-modal-Hz18NN0Z.js": new Set(["invite-user-modal"]),
  "shop-v2DtsxR2.js": new Set(["provider-simple-list"]),
  "hooks-Jw3GridD.js": new Set([
    "sell-out-modal",
    "activity-info-proxy",
    "business-use-selector",
    "bandwidth-selector",
    "duration-selector",
    "exclusive-price-row",
    "purchase-summary",
    "exclusive-coupon-hint",
    "provider-external",
    "provider-list",
    "choose-modal",
    "proxy-download-kyc-block-modal",
    "renew-modal",
    "upgrade-modal",
    "proxy-buy-permission-tips",
    "proxy-detect-fail-ad",
  ]),
};
// The cloud-launch gate had an early return in Electron, but its unreachable
// quota/trial dialog and transport closures still shipped. Remove that code,
// retaining the original local launch progress DTO and button state contract.
edit("operationHandlers-Db52Gyo7.js", (ast, code, edits) => {
  walk.simple(ast, {
    FunctionDeclaration(node) {
      if (node.id.name !== "ot") return;
      const declarations = node.body.body.find(
        (stmt) => stmt.type === "VariableDeclaration",
      ).declarations;
      const expression = (name) => {
        const value = declarations.find((decl) => decl.id.name === name)?.init;
        if (!value) throw Error("Local launch gate binding changed: " + name);
        return code.slice(value.start, value.end);
      };
      const returned = node.body.body.findLast(
        (stmt) => stmt.type === "ReturnStatement",
      );
      edits.push([
        node.body.start,
        node.body.end,
        `{let {isEcommerce:c}=Ee(),l=M(()=>He(c.value)),u=${expression("u")},d=M(()=>!!R(e.data).trashed),p=M(()=>false),h=M(()=>''),g=M(()=>''),v=${expression("v")},y=${expression("y")},b=${expression("b")};async function w(){if(!y.value){if(R(e.driverObj))e.driverNext?.();await e.onOpen(R(e.data));}}return ${code.slice(returned.argument.start, returned.argument.end)};}`,
      ]);
    },
  });
});
for (const [file, names] of Object.entries(commercial))
  edit(file, (ast, code, edits) => {
    for (const stmt of ast.body)
      if (stmt.type === "VariableDeclaration")
        for (const decl of stmt.declarations) {
          if (!decl.init) continue;
          const text = code.slice(decl.init.start, decl.init.end),
            name = text.match(/__name:`([^`]+)`/)?.[1];
          if (names.has(name)) {
            if (["CustomTemplateBanner", "CustomTemplateDialog"].includes(name)) {
              if (!consultationWidgets.has(file)) consultationWidgets.set(file, new Set());
              consultationWidgets.get(file).add(decl.id.name);
            }
            for (const scope of text.match(/data-v-[a-f0-9]{8}/g) || [])
              removedScopes.add(scope);
            edits.push([decl.init.start, decl.init.end, "{render:()=>null}"]);
          }
        }
  });
edit("list-ByevuXQD.js", (ast, code, edits) =>
  walk.simple(ast, {
    FunctionDeclaration(n) {
      if (
        n.id.name === "ke" &&
        code.slice(n.start, n.end).includes("userCheckTeamUserRightsList")
      )
        edits.push([n.body.start, n.body.end, "{J.value=e;}"]);
    },
  }),
);
edit("hooks-Jw3GridD.js", (ast, code, edits) =>
  walk.simple(ast, {
    FunctionDeclaration(n) {
      if (n.id.name === "Bs")
        edits.push([
          n.body.start,
          n.body.end,
          "{return {downloadProxy:async options=>{await globalThis.electronAPI.send('proxy:export', {ids:options.items.map(item=>item.id)});options.confirm?.();}};}",
        ]);
    },
  }),
);
edit("hook-CnJE4hRq.js", (ast, code, edits) =>
  walk.simple(ast, {
    FunctionDeclaration(n) {
      if (n.id.name === "UT")
        edits.push([
          n.body.start,
          n.body.end,
          "{return globalThis.electronAPI.send('syncControl:open');}",
        ]);
    },
    VariableDeclarator(n) {
      if (
        n.id.name === "pl" &&
        code.slice(n.start, n.end).includes("userMidAutumn")
      )
        edits.push([n.init.start, n.init.end, "{render:()=>null}"]);
    },
  }),
);
// Image lookup tables are generated maps; delete commercial entries, not their names.
const imageCommerce =
  /(?:\/payments\/|\/campaing\/|\/campaign\/|\/referral-program\/|feedback-consultant-qr|payment_icon|pay_success|team-space|empty-teams|newbie-gift|purchase-gift|invite-bonus|credits-effect|pay-wall|paywall|rx_ic_wallet|rx-ic-credits|rc_ic_user_referral|rx_ic_(?:billing|user_paid|renew|credit_card|gift)|\/gift\.|\/alipay\.|\/wxpay\.|\/(?:diners-club|union-pay|american-express|discover)\.)/i;
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js")))
  edit(file, (ast, code, edits) =>
    walk.simple(ast, {
      ObjectExpression(n) {
        if (n.properties.length < 30) return;
        const keep = n.properties.filter(
          (p) =>
            !p.key ||
            !imageCommerce.test(
              p.key.type === "Literal"
                ? String(p.key.value)
                : p.key.type === "TemplateLiteral"
                  ? p.key.quasis[0].value.cooked
                  : "",
            ),
        );
        if (keep.length !== n.properties.length)
          edits.push([
            n.start,
            n.end,
            "{" + keep.map((p) => code.slice(p.start, p.end)).join(",") + "}",
          ]);
      },
    }),
  );
// Local templates have no commercial consultation service. Delete the
// consultation factory and its destructuring calls, retaining task creation.
edit("useCustomTemplateDialog-2nSs2D8n.js", (ast, code, edits) => {
  const factories = new Set();
  for (const node of ast.body) if (node.type === "FunctionDeclaration" && code.slice(node.start, node.end).includes("openCustomTemplateDialog")) {
    factories.add(node.id.name); edits.push([node.start, node.end, ""]);
  }
  for (const node of ast.body) if (node.type === "ExportNamedDeclaration") {
    const retained = node.specifiers.filter(item => !factories.has(item.local.name));
    if (retained.length !== node.specifiers.length) edits.push([node.start, node.end,
      "export {" + retained.map(item => code.slice(item.start, item.end)).join(",") + "};"]);
  }
});
for (const file of ["MyTemplatesRoute-Eq3HlS6M.js", "TemplateStoreRoute-vzcUC0bD.js"])
  edit(file, (ast, code, edits) => walk.simple(ast, { VariableDeclaration(node) {
    const retained = node.declarations.filter(item => !(item.id.type === "ObjectPattern" &&
      item.id.properties.some(property => property.key?.name === "openCustomTemplateDialog")));
    if (retained.length !== node.declarations.length) edits.push([node.start, node.end,
      retained.length ? node.kind + " " + retained.map(item => code.slice(item.start, item.end)).join(",") + ";" : ""]);
  } }));
// Remove the actual commercial menu entries/buttons, then let the compiler remove their unused handlers.
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js")))
  edit(file, (ast, code, edits) =>
    walk.ancestor(ast, {
      CallExpression(n, anc) {
        if (
          n.callee.type !== "MemberExpression" ||
          !["fetchUserInfo", "getWorkspaceList", "getUserPayInfo"].includes(
            n.callee.property.name,
          )
        )
          return;
        let outer = n;
        for (let i = anc.length - 2; i >= 0; i--) {
          const p = anc[i];
          if (
            (p.type === "MemberExpression" && p.object === outer) ||
            (p.type === "CallExpression" && p.callee === outer)
          )
            outer = p;
          else break;
        }
        edits.push([outer.start, outer.end, "(void 0)"]);
      },
    }),
  );
const sales =
  /购买|充值|续费|积分|团队|成员|邀请|推荐|微信扫码|费用管理|升级套餐|限时优惠|折扣/;
function literal(n) {
  if (n?.type === "Literal") return String(n.value);
  if (n?.type === "TemplateLiteral" && !n.expressions.length)
    return n.quasis[0].value.cooked;
  if (n?.type === "CallExpression" && n.arguments.length)
    return literal(n.arguments[0]);
  return "";
}
function commercialProps(n) {
  return (
    n?.type === "ObjectExpression" &&
    n.properties.some(
      (p) =>
        ["label", "title", "header", "text"].includes(p.key?.name) &&
        sales.test(literal(p.value)),
    )
  );
}
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js"))) {
  if (/^(runtime-|locales-|rolldown-)/.test(file)) continue;
  let comments = false;
  edit(file, (ast, code, edits) =>
    walk.simple(ast, {
      CallExpression(n) {
        if ((consultationWidgets.get(file)?.has(n.arguments[0]?.name) || commercialProps(n.arguments[1]) || n.arguments[1]?.properties?.some(property => property.key?.name === "class" && /^(my-templates-custom-button|custom-template-banner)$/.test(literal(property.value)))) && n.arguments.length >= 2) {
          comments = true;
          edits.push([n.start, n.end, 'localCommercialComment("",true)']);
        }
      },
      ArrayExpression(n) {
        const kept = n.elements.filter((p) => !commercialProps(p));
        if (kept.length !== n.elements.length)
          edits.push([
            n.start,
            n.end,
            "[" +
              kept.map((p) => (p ? code.slice(p.start, p.end) : "")).join(",") +
              "]",
          ]);
      },
    }),
  );
  if (comments) {
    const f = path.join(dir, file);
    fs.writeFileSync(
      f,
      'import {m as localCommercialComment} from "./runtime-core.esm-bundler-CBj16o9G.js";\n' +
        fs.readFileSync(f, "utf8"),
    );
  }
}
// Paid proxy subscriptions have no local equivalent: delete their columns, menus and slots.
for (const file of ["operation-zwm3okqF.js", "shop-v2DtsxR2.js"])
  edit(file, (ast, code, edits) =>
    walk.simple(ast, {
      ArrayExpression(n) {
        const keep = n.elements.filter((p) => {
          if (p?.type !== "ObjectExpression") return true;
          const name = p.properties.find((v) => v.key?.name === "name"),
            key = p.properties.find((v) => v.key?.name === "key");
          return (
            ![
              "expireDate",
              "proxyProviderPrice",
              "autoRenew",
              "bandwidth",
              "orderNo",
              "renewalTime",
              "proxyExpireStatus",
            ].includes(literal(key?.value)) &&
            !["upgrade", "renew", "refund", "autoRenew", "buy"].includes(
              literal(name?.value),
            )
          );
        });
        if (keep.length !== n.elements.length)
          edits.push([
            n.start,
            n.end,
            "[" +
              keep.map((p) => (p ? code.slice(p.start, p.end) : "")).join(",") +
              "]",
          ]);
      },
      ObjectExpression(n) {
        const keep = n.properties.filter(
          (p) =>
            !["autoRenew", "bandwidth", "expireDate"].includes(p.key?.name),
        );
        if (keep.length !== n.properties.length)
          edits.push([
            n.start,
            n.end,
            "{" + keep.map((p) => code.slice(p.start, p.end)).join(",") + "}",
          ]);
      },
    }),
  );
for (const file of ["shop-v2DtsxR2.js"])
  edit(file, (ast, code, edits) =>
    walk.ancestor(ast, {
      CallExpression(n, anc) {
        if (
          !/^user(GetProxyRefund|SetProxyAutoRenewal)/.test(
            n.callee.property?.name || "",
          )
        )
          return;
        const fn = anc.findLast((p) => p.type === "FunctionDeclaration");
        if (fn)
          edits.push([
            fn.body.start,
            fn.body.end,
            "{throw Error('付费代理流程已移除');}",
          ]);
      },
    }),
  );
edit('operation-zwm3okqF.js',(ast,code,edits)=>walk.simple(ast,{
  VariableDeclaration(node){
    if(!node.declarations.some(d=>d.id.name==='y'&&code.slice(d.start,d.end).includes('proxyRenewMinDiscount')))return;
    const keep=node.declarations.filter(d=>!['y','b','x'].includes(d.id.name));
    edits.push([node.start,node.end,node.kind+' '+keep.map(d=>code.slice(d.start,d.end)).join(',')+';']);
  },
}));
edit('create-HSjma60V.js',(ast,code,edits)=>walk.simple(ast,{
  VariableDeclarator(node){if(code.slice(node.init?.start,node.init?.end).includes('maxWindowCount')&&node.init?.type==='CallExpression'&&node.init.callee.name==='M'){const limit=node.id.name==='p'?200:100;edits.push([node.init.start,node.init.end,'M(()=>'+limit+')']);}},
}));
edit('layout-C916OUcf.js',(ast,code,edits)=>walk.simple(ast,{
  VariableDeclarator(node){if(node.id.name==='s'&&code.slice(node.start,node.end).includes('r.value?.subLevel'))edits.push([node.init.start,node.init.end,'N(()=>false)']);},
}));
// Brand text is distinct from translation keys, route identifiers and icon lookup paths.
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js"))) {
  if (/^(zh-CN-|en-|ru-)/.test(file)) continue;
  edit(file, (ast, code, edits) =>
    walk.ancestor(ast, {
      TemplateLiteral(n, anc) {
        if (
          n.expressions.length ||
          anc.some((p) => p.type === "CallExpression" && p.callee.name === "$t")
        )
          return;
        const text = n.quasis[0].value.cooked;
        if (["Roxy AI Agent", "RoxyClaw"].includes(text))
          edits.push([
            n.start,
            n.end,
            JSON.stringify(
              text === "RoxyClaw" ? "Agent 设置" : "OpenBrowser AI Agent",
            ),
          ]);
      },
    }),
  );
}
// Native OpenBrowser probe routines own and clean up their temporary proxy forwards.
for (const file of ["hooks-Jw3GridD.js", "detectProxy-q2-FQDXD.js"])
  edit(file, (ast, code, edits) =>
    walk.simple(ast, {
      CallExpression(n) {
        if (
          n.arguments[0]?.quasis?.[0]?.value.cooked === "proxy:delRoxynetProxy"
        )
          edits.push([n.start, n.end, "(void 0)"]);
      },
    }),
  );
edit("create-Bs68oonD.js", (ast, code, edits) =>
  walk.simple(ast, {
    FunctionDeclaration(n){if(n.id.name==='q'&&code.slice(n.start,n.end).includes('entryType:b.Immediate'))edits.push([n.start,n.end,'']);},
    Property(n){if(n.key?.name==='onBuy'&&n.value.name==='q')edits.push([n.start,n.end,'...{}']);},
    VariableDeclarator(n) {
      if (
        n.id.type === "ObjectPattern" &&
        n.id.properties.some((p) => p.key?.name === "buyProxy")
      )
        edits.push([n.start, n.end, "removedProxySales=undefined"]);
    },
  }),
);
// Delete the complete residential-proxy promotion and stale event binding.
// Keeping onBuy after deleting its local function rebound F to Vue's import.
edit('createDefaultAccordions-CO1KkbkO.js',(ast,code,edits)=>walk.simple(ast,{
 CallExpression(node){if(node.arguments[1]?.name==='Ne'&&/立即购买|真人住宅 IP|纯净/.test(code.slice(node.start,node.end)))edits.push([node.start,node.end,"A('',true)"]);},
 Property(node){if(node.key?.name==='onBuy')edits.push([node.start,node.end,'...{}']);},
 FunctionDeclaration(node){if(node.id.name==='F'&&code.slice(node.start,node.end).includes('await a()'))edits.push([node.start,node.end,'']);},
 VariableDeclarator(node){if(node.id.type==='ObjectPattern'&&node.id.properties.some(property=>property.key?.name==='purchaseImmediateOfficialProxy'))edits.push([node.start,node.end,'removedLocalProxyPromotion=undefined']);},
}));
// Shared browser selectors also import the phone proxy store. Retain only local CRUD.
edit("proxy-cE263mR5.js", (ast, code, edits) => {
  const declaration = ast.body
    .filter((n) => n.type === "VariableDeclaration")
    .flatMap((n) => n.declarations)
    .find((n) => n.id.name === "y");
  if (!declaration) throw Error("Shared proxy store declaration changed");
  edits.push([
    declaration.init.start,
    declaration.init.end,
    `r('local-proxy-picker',()=>{const items=e([]),loading=e(false);async function fetchList(){loading.value=true;try{items.value=(await globalThis.__localApi.proxy.userGetProxyListMergedList({page_size:5000})).data.rows;}finally{loading.value=false;}}const findById=id=>items.value.find(row=>String(row.id)===String(id));return {items,pickerItems:items,pickerLoading:loading,loading,total:t(()=>items.value.length),usableItems:items,fetchList,fetchPickerList:fetchList,findById,ensureById:async id=>{await fetchList();return findById(id)},pickRandom:async()=>{await fetchList();return items.value[Math.floor(Math.random()*items.value.length)]},remove:async ids=>{await globalThis.__localApi.proxy.userDelProxyModuleV2Create({ids});await fetchList();return true},updateRemark:async(row,remark)=>{await globalThis.__localApi.proxy.userMdfProxyModuleCreate({...row,remark});await fetchList();return true}}})`,
  ]);
});
// Old paid-proxy selection branches now query the same local library and use local edits.
for (const file of [
  "simple-zBOi42-i.js",
  "useAsyncGate-D7VA7DLY.js",
  "useProfileProxy-Cbqapbxb.js",
  "shop-v2DtsxR2.js",
])
  edit(file, (ast, code, edits) =>
    walk.simple(ast, {
      MemberExpression(n) {
        if (n.property.name === "userGetUserBuyProxyListList")
          edits.push([
            n.property.start,
            n.property.end,
            "userGetProxyModuleListList",
          ]);
        if (n.property.name === "userMdfUserBuyProxyRemarkCreate")
          edits.push([
            n.property.start,
            n.property.end,
            "userMdfProxyModuleCreate",
          ]);
      },
    }),
  );
const esbuild = require("esbuild");
edit("hooks-Jw3GridD.js", (ast, code, edits) =>
  walk.ancestor(ast, {
    CallExpression(n, parents) {
      if (n.callee.property?.name !== "userCheckProxyCreate") return;
      const fn = parents.findLast((n) => n.type === "FunctionDeclaration"),
        id = fn.params[0].name;
      edits.push([
        fn.body.start,
        fn.body.end,
        `{const result=await globalThis.__localRequest('proxies:detect',{id:${id}});return {loading:false,lastIp:result.ip||'',lastCountry:result.country_code||'',lastCity:result.city||'',timezone:result.timezone||'',checkStatus:result.ip?1:2};}`,
      ]);
    },
  }),
);
// Member assignments disappear with the team UI; local label selectors have no members.
for (const file of [
  "projects-CN6_vL2j.js",
  "gen-project-BYIY-yxb.js",
  "useQuickCreate-DgAf1jWE.js",
])
  edit(file, (ast, code, edits) =>
    walk.simple(ast, {
      VariableDeclarator(n) {
        if (
          n.id.type === "ObjectPattern" &&
          n.id.properties.some((p) => p.key?.name === "getTeamMembers")
        )
          edits.push([
            n.init.start,
            n.init.end,
            "({getTeamMembers:async()=>{throw Error('团队功能已移除')}})",
          ]);
      },
    }),
  );
edit("use-tag-menu-DZnIrtE9.js", (ast, code, edits) =>
  walk.simple(ast, {
    VariableDeclaration(n) {
      if (!n.declarations.some(d=>d.id.type==='ObjectPattern'&&d.id.properties.some(p=>p.key?.name==='userPayInfo'))) return;
      const keep=n.declarations.filter(d=>!(d.id.type==='ObjectPattern'&&d.id.properties.some(p=>['userPayInfo','handleBusinessCode'].includes(p.key?.name))));
      edits.push([n.start,n.end,n.kind+' '+keep.map(d=>code.slice(d.start,d.end)).join(',')+';']);
    },
    FunctionDeclaration(n) {
      if(n.id.name==='h'&&code.slice(n.start,n.end).includes('freeProjectCount')){
        let local;
        walk.simple(n.body,{ConditionalExpression(node){if(code.slice(node.test.start,node.test.end).includes('r>=n'))local=node.alternate;}});
        if(!local)throw Error('Project creation quota boundary changed');
        edits.push([n.body.start,n.body.end,'{return '+code.slice(local.start,local.end)+';}']);
        return;
      }
      if (
        code
          .slice(n.body.start, n.body.end)
          .includes("userGetMemberInfoByProjectIdList")
      )
        edits.push([n.body.start, n.body.end, "{return [];}"]);
    },
  }),
);
// The browser button's removed quota tooltip left unused payment closures and
// computed subscription labels in setup. Delete those closures as well.
edit('renewal-reminder-drawer-C9_4HaAB.js',(ast,code,edits)=>{
  for(const statement of ast.body)if(statement.type==='VariableDeclaration')for(const declaration of statement.declarations){
    if(!declaration.init||!code.slice(declaration.init.start,declaration.init.end).includes('__name:`browser-control`'))continue;
    walk.simple(declaration.init,{
      FunctionDeclaration(node){if(['z','ge'].includes(node.id.name))edits.push([node.start,node.end,'']);},
      VariableDeclaration(node){
        const keep=node.declarations.filter(d=>!['pe','R'].includes(d.id.name)&&!(d.id.type==='ObjectPattern'&&d.id.properties.some(p=>p.key?.name==='userPayInfo')));
        if(keep.length!==node.declarations.length)edits.push([node.start,node.end,keep.length?node.kind+' '+keep.map(d=>code.slice(d.start,d.end)).join(',')+';':'']);
      },
    });
  }
  walk.simple(ast,{ConditionalExpression(node){if(node.consequent.type==='ObjectExpression'&&node.consequent.properties.some(property=>property.key?.name==='name'&&property.value?.quasis?.[0]?.value.cooked==='content')&&code.slice(node.consequent.start,node.consequent.end).includes('quota-tooltip'))edits.push([node.start,node.end,'void 0']);}});
});
for (const file of [
  "create-HSjma60V.js",
  "renewal-reminder-drawer-C9_4HaAB.js",
])
  edit(file, (ast, code, edits) =>
    walk.simple(ast, {
      CallExpression(n) {
        if (n.callee.property?.name === "userReportAppEventCreate")
          edits.push([
            n.start,
            n.end,
            "globalThis.__localActionTrack('ui_action')",
          ]);
      },
    }),
  );
// Vue component refs require their DOM root before calling Element.scrollIntoView.
edit("single-proxies-C7CAMkyq.js", (ast, code, edits) =>
  walk.simple(ast, {
    CallExpression(n) {
      if (
        n.callee.type === "MemberExpression" &&
        n.callee.property.name === "scrollIntoView"
      ) {
        const object = code.slice(n.callee.object.start, n.callee.object.end);
        if (object.endsWith(".value"))
          edits.push([
            n.start,
            n.end,
            "(" +
              object +
              ".$el??" +
              object +
              ")?.scrollIntoView?.(" +
              n.arguments.map((a) => code.slice(a.start, a.end)).join(",") +
              ")",
          ]);
      }
    },
  }),
);
// The original menu's messaging indicator has no server or QR authentication in this app.
edit("roxy-claw-1j3mqM_d.js", (ast, code, edits) => {
  const decl = ast.body
    .filter((n) => n.type === "VariableDeclaration")
    .flatMap((n) => n.declarations)
    .find((n) => n.id.name === "u");
  if (!decl) throw Error("Messaging store declaration changed");
  edits.push([
    decl.init.start,
    decl.init.end,
    "o('local-agent-settings-status',()=>({isEnabled:a(()=>false)}))",
  ]);
});
edit("identity-verification-entry-B8EzLOCj.js", (ast, code, edits) =>
  walk.simple(ast, {
    ConditionalExpression(n) {
      const test = code.slice(n.test.start, n.test.end);
      if (test.includes("slotName") && test.includes("`proxy`"))
        edits.push([
          n.start,
          n.end,
          code.slice(n.alternate.start, n.alternate.end),
        ]);
    },
  }),
);
// User configured proxy extraction URLs run through OpenBrowser's bounded outbound client.
edit("api-extract-BlmYcIz7.js", (ast, code, edits) => {
  walk.simple(ast, {
    CallExpression(n) {
      if (n.callee.name === "fetch")
        edits.push([
          n.start,
          n.end,
          "globalThis.electronAPI.send('proxy:extract'," +
            code.slice(n.arguments[0].start, n.arguments[0].end) +
            ").then(result=>({ok:result.status<400,text:async()=>result.body}))",
        ]);
    },
  });
  if (edits.length !== 1)
    throw Error("Expected one proxy extraction transport");
});
// Remove unused subscription destructuring bindings after their sales branches
// have been deleted. Resolve exact declarations; never replace read bindings.
const eslintScope=require('eslint-scope');
for(const file of fs.readdirSync(dir).filter(name=>name.endsWith('.js'))){
  edit(file,(ast,_code,edits)=>walk.simple(ast,{MemberExpression(node){if(node.property.name==='isDirectWhitelist')edits.push([node.start,node.end,'false']);}}));
  const target=path.join(dir,file),code=fs.readFileSync(target,'utf8'),ast=acorn.parse(code,{sourceType:'module',ecmaVersion:'latest',ranges:true}),manager=eslintScope.analyze(ast,{ecmaVersion:2024,sourceType:'module',optimistic:true,ignoreEval:true}),edits=[];
  const unused=property=>{if(property.key?.name!=='userPayInfo'||property.value.type!=='Identifier')return false;const variable=manager.scopes.flatMap(scope=>scope.variables).find(variable=>variable.identifiers.some(id=>id.start===property.value.start));return variable&&!variable.references.some(reference=>reference.isRead());};
  walk.simple(ast,{VariableDeclaration(node){const declarations=node.declarations.map(declaration=>{if(declaration.id.type!=='ObjectPattern')return code.slice(declaration.start,declaration.end);const keep=declaration.id.properties.filter(property=>!unused(property));if(keep.length===declaration.id.properties.length)return code.slice(declaration.start,declaration.end);if(!keep.length)return null;return '{'+keep.map(property=>code.slice(property.start,property.end)).join(',')+'}='+code.slice(declaration.init.start,declaration.init.end);});if(declarations.some((value,index)=>value!==code.slice(node.declarations[index].start,node.declarations[index].end)))edits.push([node.start,node.end,declarations.some(Boolean)?node.kind+' '+declarations.filter(Boolean).join(',')+';':'']);}});
  let result=code,edge=Infinity;for(const[start,end,value]of edits.sort((a,b)=>b[0]-a[0])){if(end>edge)throw Error('Overlapping subscription binding deletion');result=result.slice(0,start)+value+result.slice(end);edge=start;}fs.writeFileSync(target,result);
}
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js"))) {
  const f = path.join(dir, file);
  const result = esbuild.transformSync(fs.readFileSync(f, "utf8"), {
    loader: "js",
    format: "esm",
    target: "es2022",
    treeShaking: true,
    minifySyntax: true,
    legalComments: "inline",
  });
  fs.writeFileSync(f, result.code);
}
fs.writeFileSync(
  "work/rebuild/removed-scopes.json",
  JSON.stringify([...removedScopes]),
);

for (const file of ["MyTemplatesRoute-Eq3HlS6M.js", "TemplateStoreRoute-vzcUC0bD.js"])
  edit(file, (ast, code, edits) => { for (const node of ast.body) {
    if (node.type !== "ImportDeclaration" || !node.source.value.includes("useCustomTemplateDialog-")) continue;
    const keep = node.specifiers.filter(item => item.imported?.name !== "t");
    if (keep.length !== node.specifiers.length) edits.push([node.start, node.end,
      keep.length ? "import {" + keep.map(item => code.slice(item.start,item.end)).join(",") + "} from " + JSON.stringify(node.source.value) + ";" : ""]);
  } });
