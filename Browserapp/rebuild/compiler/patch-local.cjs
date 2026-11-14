const fs = require("fs"),
  acorn = require("acorn"),
  walk = require("acorn-walk");
const dir = "work/rebuild/stage/assets";
function patch(name, vars = {}, funcs = {}) {
  let f = dir + "/" + name + ".js",
    text = fs.readFileSync(f, "utf8"),
    ast = acorn.parse(text, { ecmaVersion: "latest", sourceType: "module" }),
    ed = [];
  walk.simple(ast, {
    VariableDeclarator(n) {
      if (n.id.type === "Identifier" && vars[n.id.name] !== undefined)
        ed.push([n.init.start, n.init.end, vars[n.id.name]]);
    },
    FunctionDeclaration(n) {
      if (funcs[n.id.name] !== undefined)
        ed.push([n.body.start, n.body.end, "{" + funcs[n.id.name] + "}"]);
    },
  });
  for (const [s, e, v] of ed.sort((a, b) => b[0] - a[0]))
    text = text.slice(0, s) + v + text.slice(e);
  fs.writeFileSync(f, text);
}
patch("hook-CnJE4hRq", {
  lE: `Nt({history:Mt('/index.html#'),routes:[{path:'/',component:()=>import('./layout-C916OUcf.js'),redirect:'/browser/list',children:[{path:'browser/list',name:'browser-list',component:()=>import('./list-ByevuXQD.js')},{path:'browser/create',name:'browser-create',component:()=>import('./create-HSjma60V.js')},{path:'browser',name:'browser',redirect:'/browser/list'}]}]})`,
});
patch(
  "layout-C916OUcf",
  {

  },
  {
    Vi: `return [{path:'browser',name:'browser',meta:{title:$t('窗口管理'),icon:'base/rx_ic_browser'}},{path:'projects',name:'projects',meta:{title:$t('项目管理'),icon:'base/rx_ic_stack'}},{path:'proxy',name:'agent-list',meta:{title:$t('代理 IP'),icon:'base/rx_ic_internet'}},{path:'kernels',name:'local-kernels',meta:{title:'内核管理',icon:'base/rx_ic_browser'}},{path:'templates',name:'local-templates',meta:{title:'窗口模板',icon:'base/rx_ic_stack'}},{path:'agent-console',name:'agent-console-chat',meta:{title:'AI Agent',icon:'roxy-agent/rx-ic-logo'}}]`,
  },
);
patch("global-component-Hns640q-", {
  cn: `{setup(){Nt();return ()=>[B(Fe,{group:'tr'}),B(At,{group:'popup'}),B($e),B(Ye),B(Ot)]}}`,
});
// The archived SDK and tracker are never constructed.
patch(
  "utils-BIWenCnY",
  {},
  { j$: "return globalThis.__localDict;", N$: "return;" },
);
let boot = fs
  .readFileSync(dir + "/bootstrap.js", "utf8")
  .replace("import {r as globals}", "import {t as GlobalUi,r as globals}")
  .replace("import {a as pinia}", "import {Ct as registerRouter}")
  .replace(
    "return h(resolve('RouterView'))",
    "return [h(resolve('RouterView')),h(GlobalUi)]",
  )
  .replace(
    "render(){return [h(resolve('RouterView')),h(GlobalUi)]}",
    "setup(){localAppearance();const notices=localNotifications();globalThis.__localUiError=message=>notices.add({group:'tr',severity:'error',summary:String(message),life:5000});return()=>[h(resolve('RouterView')),h(GlobalUi)]}",
  )
  .replace(
    "await router.replace",
    "registerRouter(router);await router.replace",
  );
boot = "import {n as localAppearance} from './theme-mq6SsndU.js';\n" + boot;
boot =
  "import {n as localNotifications} from './usetoast-DphSlejX.js';\n" + boot;
fs.writeFileSync(dir + "/bootstrap.js", boot);
fs.copyFileSync("Browserapp/rebuild/renderer-bridge.js", dir + "/local-api.js");

{
  const f = dir + "/hook-CnJE4hRq.js";
  let s = fs
    .readFileSync(f, "utf8")
    .replace("r as Mt,t as Nt", "n as Mt,t as Nt");
  s = s.replace(
    "children:[{path:'browser/list'",
    "children:[{path:'projects',name:'projects',redirect:'/projects/list'},{path:'projects/list',name:'project-list',component:()=>import('./projects-CN6_vL2j.js')},{path:'agent',name:'agent-list',component:()=>import('./agent-CYnwl_KT.js')},{path:'browser/list'",
  );
  fs.writeFileSync(f, s);
}
{
  const f = dir + "/layout-C916OUcf.js";
  let s = fs.readFileSync(f, "utf8");
  s = s.replaceAll(
    "W(r,{name:`base/logo`,size:`36`})",
    `F('img',{src:'/images/openbrowser.png',width:36,height:36,alt:'OpenBrowser'})`,
  );
  const ast = acorn.parse(s, { ecmaVersion: "latest", sourceType: "module" }),
    ed = [];
  walk.simple(ast, {
    TemplateLiteral(n) {
      if (n.quasis[0].value.cooked.startsWith("/images/roxybrowser_text_"))
        ed.push([
          n.start,
          n.end,
          "('/images/openbrowser-wordmark-'+(n.value==='dark'?'dark':'light')+'.svg')",
        ]);
    },
  });
  for (const [a, b, v] of ed.sort((a, b) => b[0] - a[0]))
    s = s.slice(0, a) + v + s.slice(b);
  fs.writeFileSync(f, s);
}
// Delete the residential-proxy sale banner, its click handler and purchase hook.
{
  const f = dir + "/createDefaultAccordions-CO1KkbkO.js";
  let s = fs.readFileSync(f, "utf8");
  const ast = acorn.parse(s, { ecmaVersion: "latest", sourceType: "module" }),
    ed = [];
  walk.ancestor(ast, {
    CallExpression(n) {
      if (
        n.arguments[1]?.name === "Ne" &&
        s.slice(n.start, n.end).includes("立即购买")
      )
        ed.push([n.start, n.end, "A('',true)"]);
    },
    VariableDeclarator(n) {
      if (
        n.id.type === "ObjectPattern" &&
        n.id.properties.some(
          (p) => p.key?.name === "purchaseImmediateOfficialProxy",
        )
      )
        ed.push([n.start, n.end, "removedCommerce=undefined"]);
    },
    FunctionDeclaration(n) {
      if (n.id.name === "F" && s.slice(n.start, n.end).includes("await a()"))
        ed.push([n.start, n.end, ""]);
    },
  });
  for (const [a, b, v] of ed.sort((a, b) => b[0] - a[0]))
    s = s.slice(0, a) + v + s.slice(b);
  fs.writeFileSync(f, s);
}
patch(
  "hook-CnJE4hRq",
  {},
  {
    zT: "return {handleBusinessCode:async(code,fallback)=>{if(fallback)return await fallback();throw Object.assign(Error('本地操作失败: '+code),{code});}}",
  },
);
// Template names are local text, so no account entitlement is queried.
patch(
  "create-HSjma60V",
  {},
  {
    He: `D({title:t?.value?$t('编辑模板'):$t('保存模板'),inputs:[{type:'text',name:'templateName',value:t?.label,required:true,props:{placeholder:$t('模板名称')}}],onConfirm:async value=>Ue({templateName:value.templateName,id:t?.value})});`,
  },
);
// Transfer is an explicit local file exchange, including credentials chosen by the user.
patch(
  "renewal-reminder-drawer-C9_4HaAB",
  {},
  {
    Br: "return await globalThis.electronAPI.send('browser:exportProfiles',{ids:e.map(row=>row.id)});",
  },
);
// Shared proxy components import a cloud-phone client; remove both HTTP transports.
patch("api-BToUsmQq", {
  H: "globalThis.__localApi",
  U: "globalThis.__localApi",
});
// An empty local kernel inventory is a valid state, not a form validation rejection during mount.
patch(
  "useWindowCreateCore-01alf0RN",
  {
    N: "c(()=>j.isReady.value&&!A.value&&!!D.value.flatMap(field=>field.items??[field]).find(field=>field.name==='coreVersion')?.options?.some(option=>option.value&&option.value!=='__useLatestCore__'))",
  },
  {
    F: "await j.run(async()=>{let [n,r]=await y(e,S,j),[i,a,o,s]=n;D.value=i;O.value=[a,o,s];k.value=r;await x.onInputsInitialized?.(P);I();if((t.refreshFingerprint??true)&&D.value.flatMap(field=>field.items??[field]).find(field=>field.name==='coreVersion')?.options?.some(option=>option.value&&option.value!=='__useLatestCore__'))await L();await x.onInitialized?.(P);});",
  },
);
{
  const f = dir + "/utils-CnUy4XUk.js";
  let text = fs
    .readFileSync(f, "utf8")
    .replace("e[0].value", "e[0]?.value??``");
  fs.writeFileSync(f, text);
}

{
  const f = dir + "/hook-CnJE4hRq.js";
  let code = fs.readFileSync(f, "utf8");
  code = code.replace(
    "children:[{path:'projects'",
    "children:[{path:'kernels',name:'local-kernels',component:()=>import('./local-pages.js').then(m=>m.Kernels)},{path:'templates',name:'local-templates',component:()=>import('./local-pages.js').then(m=>m.Templates)},{path:'projects'",
  );
  fs.writeFileSync(f, code);
}

fs.copyFileSync("Browserapp/rebuild/local-pages.js", dir + "/local-pages.js");

{
  const f = dir + "/hook-CnJE4hRq.js";
  let s = fs.readFileSync(f, "utf8");
  s = s.replace(
    "{path:'browser/create',name:'browser-create'",
    "{path:'browser/edit',name:'browser-edit',component:()=>import('./edit-IaDdchpD.js')},{path:'browser/create',name:'browser-create'",
  );
  fs.writeFileSync(f, s);
}

patch(
  "create-HSjma60V",
  {},
  {
    Q: "return;",
    Fe: "if(n.query.templateId&&X.value==='default'){const rows=await globalThis.__localApi.window.userGetWindowTemplateListList();const row=rows.data.find(v=>String(v.id)===String(n.query.templateId));if(!row)throw Error('模板不存在');X.value=String(row.id);X.oldValue=String(row.id);X.label=row.templateName;await J(JSON.parse(row.content));}",
  },
);

// Agent UI retains the original chat markup. Transport and identity are entirely local.
patch(
  "utils-BIWenCnY",
  {},
  {
    ZZ: "return globalThis.__localAgentApi;",
    YZ: 'return {workspaceId:"local",transport:"ipc"};',
  },
);
patch("agent-BmSFI9WH", {
  $: `J('agent',()=>{let ready=a(false);const init=async()=>{const info=await globalThis.__agentRequest('info');ready.value=info.ready;};return {serverUrl:c(()=>ready.value?'obui://app':''),isReady:ready,initialized:ready,health:s({isOk:true,status:'ready',loading:false}),initMcp:init,ensureServer:init,waitUntilReady:init,markAgentChannelConnecting(){},markAgentChannelFailure(message){console.error(message)},markAgentChannelReady(){ready.value=true},markAgentChannelStopped(){ready.value=false}};})`,
});
patch(
  "TaskStatusBadge-fl9VE7c_",
  {},
  {
    $: "return globalThis.__localAgentChannel();",
    Zt: "return globalThis.__localAgentChannel();",
  },
);
// Preserve the original console and conversation route components from this shared chunk.
{
  const f = dir + "/hook-CnJE4hRq.js";
  let code = fs.readFileSync(f, "utf8");
  code = code.replace(
    "routes:[{path:'/'",
    "routes:[{path:'/agent-console',name:'agent-console',component:Oy,children:[{path:'',name:'agent-console-chat',component:CT},{path:'c/:conversationId',name:'agent-console-conversation',component:CT},{path:'task-manager',name:'agent-console-task-manager',component:()=>import('./TaskManagerRoute-iC4ANt4w.js')},{path:'templates',name:'agent-console-my-templates',component:()=>import('./MyTemplatesRoute-Eq3HlS6M.js')},{path:'settings',name:'agent-console-roxyclaw',component:()=>import('./local-pages.js').then(m=>m.AgentConfig)},{path:'skills',name:'agent-console-settings',component:()=>import('./local-pages.js').then(m=>m.Skills)},{path:'template-store',name:'agent-console-template-store',redirect:'/agent-console/templates'}]},{path:'/'",
  );
  fs.writeFileSync(f, code);
}
fs.copyFileSync(
  "Browserapp/rebuild/agent-channel.js",
  dir + "/agent-channel.js",
);
{
  const f = dir + "/bootstrap.js";
  let s = fs
    .readFileSync(f, "utf8")
    .replace(
      "import './local-api.js';",
      "import './local-api.js';\nimport './agent-channel.js';",
    );
  fs.writeFileSync(f, s);
}
{
  const f = dir + "/hook-CnJE4hRq.js";
  let s = fs.readFileSync(f, "utf8");
  const a = acorn.parse(s, { ecmaVersion: "latest", sourceType: "module" });
  const changes = [];
  walk.simple(a, {
    VariableDeclarator(n) {
      if (
        n.init &&
        s.slice(n.init.start, n.init.end).match(/__name:`SidebarFooter`/)
      ) {
        const scope = s
          .slice(n.init.start, n.init.end)
          .match(/__scopeId`,`([^`]+)`/)?.[1];
        if (!scope) throw Error("Sidebar footer CSS scope missing");
        changes.push([
          n.init.start,
          n.init.end,
          `{__scopeId:${JSON.stringify(scope)},setup(){return()=>q('div',{class:'sidebar-footer'},[q('button',{class:'feedback-button',type:'button',onClick:()=>globalThis.__router.push('/browser/list')},[q(X,{name:'base/rx_ic_browser',size:18}),q('span',null,'窗口管理')]),q('div',{class:'footer-actions'},[q('button',{class:'settings-button',type:'button',onClick:()=>globalThis.__router.push('/agent-console/settings')},[q(X,{name:'roxy-agent/rx-ic-settings',size:18}),q('span',null,'设置')])])])}}`,
        ]);
      }
    },
  });
  for (const [a, b, v] of changes.sort((a, b) => b[0] - a[0]))
    s = s.slice(0, a) + v + s.slice(b);
  fs.writeFileSync(f, s);
}
// Copy after all local page additions.
fs.copyFileSync("Browserapp/rebuild/local-pages.js", dir + "/local-pages.js");
// Delete the former HTTP client, including authentication/registration interceptors.
patch(
  "utils-BIWenCnY",
  {},
  {
    E$: "return {request:async()=>{throw Error('远端服务已移除，请使用本地接口');}};",
  },
);
patch("hook-CnJE4hRq", { sS: "{render:()=>null}" });
// Do not make document loading await the startup barrier that waits for this document.
{
  const f = dir + "/bootstrap.js";
  let s = fs.readFileSync(f, "utf8");
  const at = s.indexOf("globalThis.isElectron=");
  if (at < 0) throw Error("Bootstrap boundary missing");
  s =
    s.slice(0, at) +
    "async function startLocalUi(){\n" +
    s.slice(at) +
    "\n}\nstartLocalUi().catch(error=>{console.error(error);document.body.textContent=error.message;});\n";
  fs.writeFileSync(f, s);
}
// Preserve Zod's global initialization as a binding dependency during graph slicing.
patch("utils-BIWenCnY", {
  q_: "(globalThis.__zod_globalConfig??={})",
  lx: "(globalThis.__zod_globalRegistry??=cx())",
});

patch(
  "hooks-Jw3GridD",
  {},
  {
    oa: "return true;",
    ca: "return true;",
    ua: "return true;",
    tr: 'return {isProviderJump:()=>false,jumpToProvider:async()=>{throw Error("代理商服务已移除")}};',
  },
);

// Match the update routine by behavior; pretty-printers may rename shadowed identifiers.
{
  const f = dir + "/hook-CnJE4hRq.js";
  let code = fs.readFileSync(f, "utf8");
  const a = acorn.parse(code, { ecmaVersion: "latest", sourceType: "module" }),
    changes = [];
  walk.simple(a, {
    FunctionDeclaration(n) {
      if (
        code
          .slice(n.body.start, n.body.end)
          .includes("Failed to check agent update")
      )
        changes.push([n.body.start, n.body.end, "{return;}"]);
    },
  });
  if (changes.length !== 1)
    throw Error("Expected one archived Agent update routine");
  for (const [a, b, v] of changes) code = code.slice(0, a) + v + code.slice(b);
  fs.writeFileSync(f, code);
}
// The transfer tab becomes local file exchange; remove the former team transfer component.
{
  const file = dir + "/list-ByevuXQD.js";
  let code = fs.readFileSync(file, "utf8");
  const a = acorn.parse(code, { ecmaVersion: "latest", sourceType: "module" }),
    edits = [];
  walk.simple(a, {
    ObjectExpression(n) {
      const name = n.properties.find((p) => p.key?.name === "name");
      if (
        name?.value?.quasis?.[0]?.value.cooked === "transfer" &&
        code.slice(n.start, n.end).includes("rx_1004")
      )
        edits.push([
          n.start,
          n.end,
          "{id:'rx_1004',label:'窗口文件',name:'transfer',component:oe(LocalTransfers),visible:true}",
        ]);
    },
  });
  if (edits.length !== 1) throw Error("Expected one transfer tab");
  for (const [a, b, v] of edits) code = code.slice(0, a) + v + code.slice(b);
  code =
    "import {Transfers as LocalTransfers} from './local-pages.js';\n" + code;
  fs.writeFileSync(file, code);
}
// Quota tooltips belong to removed subscriptions; keep the actual browser control button.
{
  const file = dir + "/renewal-reminder-drawer-C9_4HaAB.js";
  let code = fs.readFileSync(file, "utf8");
  const a = acorn.parse(code, { ecmaVersion: "latest", sourceType: "module" }),
    edits = [];
  walk.simple(a, {
    ConditionalExpression(n) {
      if (
        n.consequent.type === "ObjectExpression" &&
        n.consequent.properties.some(
          (p) =>
            p.key?.name === "name" &&
            p.value?.quasis?.[0]?.value.cooked === "content",
        ) &&
        code
          .slice(n.consequent.start, n.consequent.end)
          .includes("quota-tooltip")
      )
        edits.push([n.start, n.end, "void 0"]);
    },
  });
  for (const [a, b, v] of edits.sort((a, b) => b[0] - a[0]))
    code = code.slice(0, a) + v + code.slice(b);
  fs.writeFileSync(file, code);
}
fs.copyFileSync("Browserapp/rebuild/local-pages.js", dir + "/local-pages.js");
// Keep original proxy creation/editing forms and their layout.
{
  const f = dir + "/hook-CnJE4hRq.js";
  let s = fs.readFileSync(f, "utf8");
  s = s.replace(
    "{path:'agent',name:'agent-list'",
    "{path:'agent/create',name:'agent-create',component:()=>import('./create-DJwGZbA7.js')},{path:'agent',name:'agent-list'",
  );
  fs.writeFileSync(f, s);
}
for (const file of ["rx-ic-logo-Bi20vHBm", "logo-BtJ5ZiSc"]) {
  patch(
    file,
    {},
    {
      i: "return localLogoH('svg',r,[localLogoH('image',{href:'/images/openbrowser.png',width:32,height:32})]);",
    },
  );
  const f = dir + "/" + file + ".js";
  fs.writeFileSync(
    f,
    "import {D as localLogoH} from './runtime-core.esm-bundler-CBj16o9G.js';\n" +
      fs.readFileSync(f, "utf8"),
  );
}

// Local projects have no members or team service. Preserve the original name form/footer.
{
  const file = dir + "/gen-project-BYIY-yxb.js";
  let code = fs.readFileSync(file, "utf8");
  const ast = acorn.parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
    }),
    edits = [];
  walk.simple(ast, {
    FunctionDeclaration(n) {
      if (code.slice(n.body.start, n.body.end).includes("await V()"))
        edits.push([n.body.start, n.body.end, "{return;}"]);
    },
    CallExpression(n) {
      const props = n.arguments[1];
      if (
        props?.type === "Identifier" &&
        props.name === "F" &&
        code.slice(n.start, n.end).includes("添加成员")
      )
        edits.push([n.start, n.end, "_('',true)"]);
      if (
        n.callee.name === "y" &&
        n.arguments[0]?.name === "a" &&
        code.slice(n.start, n.end).includes("line-only")
      )
        edits.push([n.start, n.end, "_('',true)"]);
    },
    ConditionalExpression(n) {
      if (
        code
          .slice(n.consequent.start, n.consequent.end)
          .includes("name:`members`")
      )
        edits.push([n.start, n.end, "_('',true)"]);
    },
  });
  edits.sort((a, b) => b[0] - a[0]);
  let end = Infinity;
  for (const [a, b, v] of edits) {
    if (b > end) continue;
    code = code.slice(0, a) + v + code.slice(b);
    end = a;
  }
  fs.writeFileSync(file, code);
}
// Preserve the original delete-confirm container (including permanent-delete checkbox).
{
  const source = fs.readFileSync(
    (process.env.ROXY_SOURCE || "/workspace/roxy-src") +
      "/web/assets/global-component-Hns640q-.js",
    "utf8",
  );
  const ast = acorn.parse(source, {
    ecmaVersion: "latest",
    sourceType: "module",
  });
  let call, render;
  walk.ancestor(ast, {
    CallExpression(n, anc) {
      const props = n.arguments[1];
      if (
        props?.type !== "ObjectExpression" ||
        !props.properties.some(
          (p) =>
            p.key?.name === "group" &&
            p.value?.quasis?.[0]?.value.cooked === "deleteConfirmDialog",
        )
      )
        return;
      call = source.slice(n.start, n.end);
      render = anc.findLast(
        (p) =>
          p.type === "ArrowFunctionExpression" &&
          p.body.type === "BlockStatement",
      );
    },
  });
  if (!call || !render) throw Error("Original delete confirmation not found");
  const variables = render.body.body
    .filter((n) => n.type === "VariableDeclaration")
    .map((n) => source.slice(n.start, n.end))
    .join(";");
  const args = render.params.map((n) => n.name).join(",");
  call = call.replaceAll("e.global.dialog", "'_dialog_rcwb2_2'");
  patch("global-component-Hns640q-", {
    cn: `{setup(){Nt();return (${args})=>{${variables};return [B(Fe,{group:'tr'}),B(At,{group:'popup'}),B($e),B(Ye),${call},B(Ot)];}}}`,
  });
}
// Former encrypted usage counters existed only to upload telemetry. Keep bounded local action history instead.
patch(
  "useOperationTrack-BXe8Vwhz",
  {},
  {
    o: "return {saveLocalTrack:action=>globalThis.__localActionTrack(action)};",
  },
);

{
  const f = dir + "/hook-CnJE4hRq.js";
  let s = fs.readFileSync(f, "utf8");
  s = s.replace(
    "{path:'projects/list',name:'project-list'",
    "{path:'projects/:id',name:'project-item',component:()=>import('./list-ByevuXQD.js')},{path:'projects/list',name:'project-list'",
  );
  fs.writeFileSync(f, s);
}
// Tasks created by TaskManager store concurrency metadata but no prompt override.
// The archived launcher replaced a valid template prompt with an empty string.
{
  const file = dir + "/useTemplateTaskExecution-yGKXS9Rw.js";
  let code = fs.readFileSync(file, "utf8");
  const ast = acorn.parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
    }),
    edits = [];
  walk.ancestor(ast, {
    ConditionalExpression(n, parents) {
      const fn = parents.findLast((n) => n.type === "FunctionDeclaration");
      if (
        !fn ||
        !code.slice(fn.body.start, fn.body.end).includes(".windowIds.length") ||
        !code.slice(n.test.start, n.test.end).includes(".metadata.prompt")
      )
        return;
      const template = fn.params[0].name, task = fn.params[1].name;
      edits.push([
        n.start,
        n.end,
        `(typeof ${task}.metadata?.prompt==='string'?${task}.metadata.prompt.trim():typeof ${template}.metadata?.prompt==='string'?${template}.metadata.prompt.trim():'')`,
      ]);
    },
  });
  if (edits.length !== 1) throw Error("Expected one task prompt override");
  for (const [a, b, value] of edits)
    code = code.slice(0, a) + value + code.slice(b);
  fs.writeFileSync(file, code);
}
// Run the original synchronizer inside the local shell and use the existing live-sync backend.
{
  const file = dir + "/hook-CnJE4hRq.js";
  let code = fs.readFileSync(file, "utf8");
  code = code.replace(
    "routes:[{path:'/agent-console'",
    "routes:[{path:'/synchronizer/active',name:'local-synchronizer-active',component:()=>import('./action-bar-50RAQCsf.js')},{path:'/synchronizer',name:'local-synchronizer',component:()=>import('./synchronizer-mUJbzl7S.js')},{path:'/agent-console'",
  );
  fs.writeFileSync(file, code);
}
for (const name of [
  "synchronizer-mUJbzl7S.js",
  "window-list-C-MAmr_C.js",
  "action-bar-50RAQCsf.js",
]) {
  const file = dir + "/" + name;
  let code = fs.readFileSync(file, "utf8");
  const edits = [];
  walk.simple(
    acorn.parse(code, { ecmaVersion: "latest", sourceType: "module" }),
    {
      CallExpression(n) {
        if (
          [
            "app:showCurrentWebviewWindow",
            "app:resizeWindow",
            "app:startMoveWindow",
            "app:stopMoveWindow",
            "app:set-ignore-mouse-events",
          ].includes(n.arguments[0]?.quasis?.[0]?.value.cooked)
        )
          edits.push([n.start, n.end, "void 0"]);
      },
    },
  );
  for (const [a, b, value] of edits.sort((a, b) => b[0] - a[0]))
    code = code.slice(0, a) + value + code.slice(b);
  if (name.startsWith("action-bar")) {
    code = code
      .replaceAll("window.addEventListener(", "globalThis.__localListenWindow(")
      .replace(
        "o(()=>{fe()})",
        "o(()=>{fe();cancelAnimationFrame(z);clearTimeout(M);clearTimeout(P)})",
      )
      .replace(
        "getComputedStyle(p.value).width",
        '(p.value?getComputedStyle(p.value).width:"auto")',
      );
  }
  fs.writeFileSync(file, code);
}
// Surface otherwise-unhandled async component failures through the original toast UI.
{
  const file = dir + "/bootstrap.js";
  let code = fs.readFileSync(file, "utf8");
  code = code.replace(
    "import './local-api.js';",
    "import './local-api.js';\nimport {r as localEventBus} from './rich-html-link-VdBpR3Cm.js';",
  );
  code = code.replace(
    "console.error(e);globalThis.__uiErrors",
    "console.error(e);if(!e.localUiNotified)globalThis.__localUiError?.(e.message||e);globalThis.__uiErrors",
  );
  fs.writeFileSync(file, code);
}
// Restoring local files has no subscription quota and does not change creation time.
patch(
  "hook-CnJE4hRq",
  {},
  {
    pE: "return {opening:N(false),openRoxyAIAgent:async(route='/agent-console')=>lE.push(route)};",
  },
);
{
  const file = dir + "/list-ByevuXQD.js";
  let code = fs.readFileSync(file, "utf8");
  const a = acorn.parse(code, { ecmaVersion: "latest", sourceType: "module" }),
    edits = [];
  walk.simple(a, {
    FunctionDeclaration(n) {
      if (
        code.slice(n.body.start, n.body.end).includes("restoreWindowNotRemind")
      )
        edits.push([
          n.body.start,
          n.body.end,
          "{const result=await i.window.userMdfWindowInfoBatchV2Create({ids:e.map(row=>row.id),isDelete:false});c(result.code,result.msg);if(result.code===0)h.value?.refresh();}",
        ]);
    },
  });
  if (edits.length !== 1) throw Error("Expected one restore quota flow");
  for (const [a, b, v] of edits) code = code.slice(0, a) + v + code.slice(b);
  fs.writeFileSync(file, code);
}

// Restore the user's circled workbench controls with native local data.
{
  const f = dir + "/layout-C916OUcf.js";
  fs.writeFileSync(
    f,
    "import {SidebarFooter as LocalSidebarFooter} from './workbench-chrome.js';\n" +
      fs.readFileSync(f, "utf8"),
  );
  patch(
    "layout-C916OUcf",
    { fl: "LocalSidebarFooter" },
    {
      Vi: `return [
    {path:'browser',name:'browser',meta:{title:$t('窗口管理'),icon:'base/rx_ic_browser'}},
    {path:'projects',name:'projects',meta:{title:$t('项目管理'),icon:'base/rx_ic_stack'},children:e.projectChildren},
    {path:'proxy',name:'agent-list',meta:{title:$t('代理 IP'),icon:'base/rx_ic_internet'}},
    {path:'account',name:'local-account-root',meta:{title:$t('平台账号'),icon:'base/rx_ic_keys'}},
      {path:'templates',name:'local-templates',meta:{title:'窗口模板',icon:'base/rx_ic_stack'}},
    {path:'automation',name:'local-automation-group',meta:{title:$t('AI & 自动化'),type:'group'},children:[
      {path:'sync-control',name:'local-synchronizer',meta:{title:$t('窗口同步'),icon:'base/rx_ic_frame_stack'}},
      {path:'roxy-agent',name:'agent-console-chat',meta:{title:'AI Agent',icon:'roxy-agent/rx-ic-logo',isRoxyAgent:true,showNewBadge:true}},
      {path:'template-store',name:'agent-console-template-store',meta:{title:$t('模板商城'),icon:'roxy-agent/rx-ic-templates-store'}},
      {path:'task-manager',name:'agent-console-task-manager',meta:{title:$t('任务管理'),icon:'roxy-agent/rx-ic-task-manager'}},
      {path:'my-templates',name:'agent-console-my-templates',meta:{title:$t('我的模板'),icon:'roxy-agent/rx-ic-templates'}},
      {path:'skills',name:'agent-console-settings',meta:{title:'Skill 管理',icon:'base/rx_ic_doc_code'}}
    ]}
  ];`,
    },
  );
}
fs.copyFileSync(
  "Browserapp/rebuild/workbench-chrome.js",
  dir + "/workbench-chrome.js",
);
{
  const f = dir + "/list-ByevuXQD.js";
  let code = fs.readFileSync(f, "utf8");
  code = code
    .replace("label:'窗口文件'", "label:$t('转移中')")
    .replace('label:"窗口文件"', "label:$t('转移中')");
  fs.writeFileSync(f, code);
}

// The filter's label picker has no members in local mode.
{
  const f = dir + "/useQuickCreate-DgAf1jWE.js";
  let code = fs.readFileSync(f, "utf8"),
    edits = [];
  walk.simple(
    acorn.parse(code, { sourceType: "module", ecmaVersion: "latest" }),
    {
      Property(n) {
        if (
          n.key?.name === "getOptions" &&
          code
            .slice(n.value.start, n.value.end)
            .includes("userGetLabelInfoList")
        )
          edits.push([
            n.value.start,
            n.value.end,
            "async()=>{const {data}=await globalThis.__localApi.window.userGetLabelInfoList();return data.rows.map(row=>({parentName:'labelIds',value:String(row.id),label:row.name}));}",
          ]);
      },
    },
  );
  if (edits.length !== 1) throw Error("Expected one local label filter");
  for (const [start, end, value] of edits)
    code = code.slice(0, start) + value + code.slice(end);
  fs.writeFileSync(f, code);
}
{
  const f = dir + "/hook-CnJE4hRq.js";
  let code = fs.readFileSync(f, "utf8");
  code = code.replace(
    "name:'agent-console-template-store',redirect:'/agent-console/templates'",
    "name:'agent-console-template-store',component:()=>import('./TemplateStoreRoute-vzcUC0bD.js')",
  );
  fs.writeFileSync(f, code);
}

// Invalidate source table caches on native mutations; ignore stale responses
// and release the busy state on rejected requests.
{
  const f = dir + "/ry-table-do6kugym.js";
  let code = fs.readFileSync(f, "utf8");
  code =
    "import {r as localTableEvents} from './rich-html-link-VdBpR3Cm.js';const localTableRequests=new WeakMap();\n" +
    code;
  const ast = acorn.parse(code, {
      sourceType: "module",
      ecmaVersion: "latest",
    }),
    edits = [];
  walk.simple(ast, {
    FunctionDeclaration(n) {
      if (
        n.id.name === "X" &&
        code.slice(n.body.start, n.body.end).includes("tableRequest")
      )
        edits.push([
          n.body.start,
          n.body.end,
          `{
  const ticket=(localTableRequests.get(f)||0)+1;localTableRequests.set(f,ticket);
  f.skeleton&&(B.value=Array.from({length:6}).fill({}));z.value=true;
  try{await L;const response=await f.tableRequest(rt());if(localTableRequests.get(f)!==ticket)return;
    const data=response?.data??response;J.totalRecords=data?.total??0;B.value=data?.rows||[];
    const success=response?.code===0||response?.code===undefined;f.listCacheKey&&success&&qe();f.clearSelectionOnRequest&&Q();
  }finally{if(localTableRequests.get(f)===ticket)z.value=false;}
 }`,
        ]);
    },
    Property(n) {
      if (
        n.key?.name === "setup" &&
        code.slice(n.value.body.start, n.value.body.end).includes("rootElRef:I")
      )
        edits.push([
          n.value.body.start + 1,
          n.value.body.start + 1,
          "globalThis.electronAPI.on('local:profiles-change',()=>{if(f.tableRequest)yt(true).catch(error=>{console.error(error);globalThis.__localUiError?.(error.message);});});",
        ]);
    },
  });
  if (edits.length !== 2)
    throw Error("Table mutation adaptation changed: " + edits.length);
  for (const [start, end, value] of edits.sort((a, b) => b[0] - a[0]))
    code = code.slice(0, start) + value + code.slice(end);
  fs.writeFileSync(f, code);
}

// Keep parent records in the route match. Sibling redirect records never become
// active RouterLinks, so flattening these routes loses the source sidebar state.
{
  const file = dir + "/hook-CnJE4hRq.js";
  let code = fs.readFileSync(file, "utf8");
  for (const parentPath of ["browser", "projects"]) {
    const ast = acorn.parse(code, {
      sourceType: "module",
      ecmaVersion: "latest",
    });
    const property = (node, key) =>
      node.properties?.find((p) => p.key?.name === key)?.value;
    let children;
    walk.simple(ast, {
      VariableDeclarator(node) {
        if (node.id.name !== "lE") return;
        const routes = property(node.init.arguments[0], "routes");
        const layout = routes.elements.find(
          (route) => property(route, "path")?.value === "/",
        );
        children = property(layout, "children");
      },
    });
    if (!children) throw Error("Missing local layout routes");
    const parent = children.elements.find(
      (route) => property(route, "path")?.value === parentPath,
    );
    const descendants = children.elements.filter((route) =>
      property(route, "path")?.value?.startsWith(parentPath + "/"),
    );
    if (!parent || property(parent, "children") || !descendants.length)
      throw Error("Unexpected local parent route: " + parentPath);
    const nested = descendants.map((route) => {
      const routePath = property(route, "path");
      return (
        code.slice(route.start, routePath.start) +
        JSON.stringify(routePath.value.slice(parentPath.length + 1)) +
        code.slice(routePath.end, route.end)
      );
    });
    const replacement = children.elements
      .filter((route) => !descendants.includes(route))
      .map((route) =>
        route === parent
          ? code.slice(route.start, route.end - 1) +
            ",children:[" +
            nested.join(",") +
            "]}"
          : code.slice(route.start, route.end),
      );
    code =
      code.slice(0, children.start) +
      "[" +
      replacement.join(",") +
      "]" +
      code.slice(children.end);
  }
  fs.writeFileSync(file, code);
}

// Original sync dialogs remain separate, frameless native windows.
{
  const file = dir + "/hook-CnJE4hRq.js";
  let code = fs.readFileSync(file, "utf8");
  const routes = [
    ["preferences", "preferences--734d_2_"],
    ["batch-inputs", "batch-inputs-B_HNTlr8"],
    ["open-sites", "open-sites-BUgaXFNX"],
    ["syncing-window-list", "syncing-window-list-g5VmUz_T"],
  ].map(
    ([kind, chunk]) =>
      `{path:'/synchronizer/dialog/${kind}',name:'local-dialog-${kind}',component:()=>import('./${chunk}.js')}`,
  );
  if (!code.includes("routes:[")) throw Error("Missing local router");
  code = code.replace("routes:[", "routes:[" + routes.join(",") + ",");
  fs.writeFileSync(file, code);
  const bootstrap = dir + "/bootstrap.js";
  let boot = fs.readFileSync(bootstrap, "utf8");
  boot =
    "import {r as localUiEvents} from './rich-html-link-VdBpR3Cm.js';\n" + boot;
  boot = boot.replace(
    "await router.replace('/browser/list');",
    `
const dialogParams=new URL(location.href).searchParams,dialogKind=dialogParams.get('dialog');
if(dialogKind&&!${JSON.stringify(["preferences", "batch-inputs", "open-sites", "syncing-window-list"])}.includes(dialogKind))throw Error('未知本地弹窗');
document.documentElement.toggleAttribute('data-ob-local-dialog',!!dialogKind);
if(dialogKind){
  await globalThis.__localRequest('ui:dialog:show');
  await new Promise((resolve,reject)=>{const deadline=Date.now()+10000;const painted=()=>{if(innerWidth>=200&&innerHeight>=200)return resolve();if(Date.now()>deadline)return reject(Error('弹窗尚未完成布局'));requestAnimationFrame(painted);};painted();});
}
const initialPath=location.hash.slice(1)||'/browser/list';
await router.replace(dialogKind?{path:'/synchronizer/dialog/'+dialogKind,query:{tab:dialogParams.get('tab')||undefined}}:router.resolve(initialPath).matched.length?initialPath:'/browser/list');`,
  );
  fs.writeFileSync(bootstrap, boot);
}
// Await mutations and display failures; the archived dialogs discarded several
// promises, which could close a dialog before a rejected action reached it.
patch(
  "util-C5rl6Moc",
  {},
  {
    n: `await globalThis.electronAPI.send('syncControl:changeSyncSettings',t({...n.base,...n.simulate}));return await e.base.userSetUserConfigCreate({preferenceSettings:n});`,
  },
);
{
  const file = dir + "/preferences--734d_2_.js";
  let code = fs.readFileSync(file, "utf8"),
    edits = [];
  walk.simple(
    acorn.parse(code, { sourceType: "module", ecmaVersion: "latest" }),
    {
      FunctionDeclaration(node) {
        if (
          node.id.name === "N" &&
          code.slice(node.body.start, node.body.end).includes("saveSettings")
        )
          edits.push([
            node.body.start,
            node.body.end,
            `{return(async()=>{try{const{code:e,msg:t}=await X(C.value);a(e,t,{life:1200});await globalThis.electronAPI.send('syncControl:closePreferencesDialog');}catch(error){f(-1,error.message);}})();}`,
          ]);
      },
      Property(node) {
        if (node.key.name !== "onSave") return;
        const body = code.slice(node.value.start, node.value.end);
        if (body.includes("syncControl:doLayout"))
          edits.push([
            node.start,
            node.end,
            `onSave:async()=>{try{await globalThis.electronAPI.send('syncControl:doLayout',r(C.value.customLayout));await N();}catch(error){f(-1,error.message);}}`,
          ]);
        if (body.includes("syncControl:registerShortcut"))
          edits.push([
            node.start,
            node.end,
            `onSave:async()=>{if(!S.value.shortcutKey?.valid()){f(-1,$t('快捷键设置冲突'));return;}try{await globalThis.electronAPI.send('syncControl:registerShortcut',r(C.value.shortcutKey));await N();}catch(error){f(-1,error.message);}}`,
          ]);
      },
    },
  );
  if (edits.length !== 3)
    throw Error("Original preferences save structure changed: " + edits.length);
  for (const [start, end, value] of edits.sort((a, b) => b[0] - a[0]))
    code = code.slice(0, start) + value + code.slice(end);
  fs.writeFileSync(file, code);
}
for (const [name, fn, body] of [
  [
    "open-sites-BUgaXFNX",
    "b",
    `const urls=u.value.urls.split('\\n').map(value=>value.trim()).filter(Boolean).map(value=>{try{return new URL(value).href;}catch{return 'http://'+value;}});return globalThis.electronAPI.send('syncControl:openSites',{urls,replaceCurrentTab:u.value.replaceCurrentTab}).catch(error=>globalThis.__localUiError(error.message));`,
  ],
])
  patch(name, {}, { [fn]: body });
{
  const file = dir + "/batch-inputs-B_HNTlr8.js";
  let code = fs.readFileSync(file, "utf8");
  code = code.replace(
    "let r=await globalThis.electronAPI.send(`syncControl:batchInputText`,n);",
    'let r;try{r=await globalThis.electronAPI.send(`syncControl:batchInputText`,n);}catch(error){t.add({severity:"error",summary:error.message,life:5000});return;}',
  );
  if (!code.includes("summary:error.message"))
    throw Error("Batch input rejection adaptation changed");
  fs.writeFileSync(file, code);
}

// The system picker runs in the main process; renderer parsers still use the
// original Excel columns and TXT account syntax without granting arbitrary reads.
{
  const file = dir + "/create-HSjma60V.js";
  let code = fs.readFileSync(file, "utf8"),
    edits = [];
  walk.simple(
    acorn.parse(code, { sourceType: "module", ecmaVersion: "latest" }),
    {
      FunctionDeclaration(node) {
        const body = code.slice(node.body.start, node.body.end);
        if (body.includes("showOpenFilePicker"))
          edits.push([
            node.body.start,
            node.body.end,
            `{const selected=await globalThis.__localRequest('profiles:choose-import');if(selected)await v(new File([selected.bytes],selected.name,{type:selected.type}));}`,
          ]);
        if (body.includes("userAnalysisWindowInfoCreate"))
          edits.push([
            node.body.start,
            node.body.end,
            `{
        if(!e)return;if(e.size>mt){s(-1,$t('文件大小不能超过 5MB'));return;}u.value=null;
        try{const name=e.name,rows=a(name)==='txt'?await we(e):await De(e);if(!rows.length)throw Error($t('导入的内容不能为空'));
          const params={fileName:name,excelData:rows};const{code,msg}=await i.window.userAnalysisWindowInfoCreate(params);
          if(code!==0)throw Error(Array.isArray(msg)?msg.join('\\n'):msg);
          Object.assign(f,{status:true,icon:d[a(name)],name,size:(e.size/1024/1024).toFixed(2)+' MB',successCount:rows.length});n('importSuccess',params);
        }catch(error){f.status=false;u.value=error.message;}
      }`,
          ]);
      },
    },
  );
  if (edits.length !== 2)
    throw Error("Import picker/analysis structure changed: " + edits.length);
  for (const [start, end, value] of edits.sort((a, b) => b[0] - a[0]))
    code = code.slice(0, start) + value + code.slice(end);
  fs.writeFileSync(file, code);
}
patch(
  "utils-CnUy4XUk",
  {},
  {
    b: `const fields=await p(),keys=new Set(fields.map(field=>field.key)),content=await e.text();
 return content.split(/#{4,}/).map(part=>part.trim()).filter(Boolean).map((part,index)=>{
  const values=Object.fromEntries(part.split(/\\r?\\n/).map(line=>{const[key,...rest]=line.trim().split('=');return keys.has(key)?[key,rest.join('=')]:[];}).filter(row=>row.length));
  const array=(value,label)=>{const rows=JSON.parse(value||'[]');if(!Array.isArray(rows))throw Error(label+' 必须是 JSON 数组');return rows;};
  const accounts=array(values.windowPlatformList,'平台账号').map(value=>{if(typeof value!=='string')throw Error('平台账号格式错误');const item=u(value);if(!Object.keys(item).length)throw Error('平台账号格式错误');return{platformUrl:item.platform,platformUserName:item.username||'',platformPassword:item.password||'',platformEfa:item.twoFactor||''};});
  const row={...values,rowNum:index+1,windowPlatformList:accounts,defaultOpenUrl:array(values.defaultOpenUrl,'打开网址'),cookie:values.cookie||''};v(row);if(row.os?.toUpperCase()==='IOS')row.os='IOS';return row;
 });`,
  },
);
{
  const file = dir + "/utils-CnUy4XUk.js";
  let code = fs.readFileSync(file, "utf8"),
    edits = [];
  const literal = (node) =>
    node?.type === "Literal" ? node.value : node?.quasis?.[0]?.value.cooked;
  walk.simple(
    acorn.parse(code, { sourceType: "module", ecmaVersion: "latest" }),
    {
      ObjectExpression(node) {
        const key = node.properties.find((p) => p.key?.name === "key"),
          format = node.properties.find((p) => p.key?.name === "formatValue");
        if (!key || !format) return;
        const name = literal(key.value);
        if (name === "windowPlatformList")
          edits.push([
            format.value.start,
            format.value.end,
            `value=>{const rows=JSON.parse(value||'[]');if(!Array.isArray(rows))throw Error('平台账号必须是 JSON 数组');return rows.map(value=>{if(typeof value!=='string')throw Error('平台账号格式错误');const item=u(value);if(!Object.keys(item).length)throw Error('平台账号格式错误');return{platformUrl:item.platform,platformUserName:item.username||'',platformPassword:item.password||'',platformEfa:item.twoFactor||''};});}`,
          ]);
        if (name === "defaultOpenUrl")
          edits.push([
            format.value.start,
            format.value.end,
            `value=>{const rows=JSON.parse(value||'[]');if(!Array.isArray(rows))throw Error('打开网址必须是 JSON 数组');return rows;}`,
          ]);
      },
      CatchClause(node) {
        if (code.slice(node.body.start, node.body.end).includes("console.log"))
          edits.push([
            node.body.start,
            node.body.end,
            `{throw Error('Excel 解析失败: '+${node.param.name}.message);}`,
          ]);
      },
    },
  );
  if (edits.length !== 3)
    throw Error("Import array/catch structure changed: " + edits.length);
  for (const [start, end, value] of edits.sort((a, b) => b[0] - a[0]))
    code = code.slice(0, start) + value + code.slice(end);
  fs.writeFileSync(file, code);
}

// Cache clearing has two local modes. Delete the cloud-cookie branch entirely.
{
  const file = dir + "/operationHandlers-Db52Gyo7.js";
  let code = fs.readFileSync(file, "utf8"),
    edits = [];
  walk.simple(
    acorn.parse(code, { sourceType: "module", ecmaVersion: "latest" }),
    {
      ArrayExpression(node) {
        const cloud = node.elements.find((element) =>
          element?.properties?.some(
            (property) =>
              property.key?.name === "value" &&
              property.value.property?.name === "cloud",
          ),
        );
        if (cloud)
          edits.push([
            node.start,
            node.end,
            "[" +
              node.elements
                .filter((element) => element !== cloud)
                .map((element) => code.slice(element.start, element.end))
                .join(",") +
              "]",
          ]);
      },
      FunctionDeclaration(node) {
        if (
          code
            .slice(node.body.start, node.body.end)
            .includes("await s.value?.(l.value)")
        ) {
          const body = code.slice(node.body.start, node.body.end);
          edits.push([
            node.body.start,
            node.body.end,
            body.replace(
              /console\.warn\((\w+)\)/,
              "globalThis.__localUiError($1.message)",
            ),
          ]);
        }
      },
    },
  );
  if (edits.length !== 2)
    throw Error("Local cache dialog structure changed: " + edits.length);
  for (const [start, end, value] of edits.sort((a, b) => b[0] - a[0]))
    code = code.slice(0, start) + value + code.slice(end);
  fs.writeFileSync(file, code);
}
{
  const file = dir + "/renewal-reminder-drawer-C9_4HaAB.js";
  let code = fs.readFileSync(file, "utf8"),
    edits = [];
  walk.simple(
    acorn.parse(code, { sourceType: "module", ecmaVersion: "latest" }),
    {
      ConditionalExpression(node) {
        if (
          code
            .slice(node.start, node.end)
            .includes("userClearWindowCacheCreate")
        )
          edits.push([
            node.start,
            node.end,
            code.slice(node.alternate.start, node.alternate.end),
          ]);
      },
    },
  );
  if (edits.length !== 1)
    throw Error("Cloud cache branch changed: " + edits.length);
  for (const [start, end, value] of edits)
    code = code.slice(0, start) + value + code.slice(end);
  fs.writeFileSync(file, code);
}

// Mixed-OS imports need a distinct fingerprint group for each OS and version.
{
  const file = dir + "/create-HSjma60V.js";
  let code = fs.readFileSync(file, "utf8");
  const changes = [
    ["a=`${n}:${i}`", "a=JSON.stringify([e.os||y,e.osVersion||b,n,i])"],
    [
      "E.set(a,{coreType:n,coreVersion:i,indices:[]})",
      "E.set(a,{coreType:n,coreVersion:i,os:e.os||y,osVersion:e.osVersion||b,indices:[]})",
    ],
    [
      "map(async({coreType:e,coreVersion:t,indices:n})=>",
      "map(async({coreType:e,coreVersion:t,os:localImportOs,osVersion:localImportOsVersion,indices:n})=>",
    ],
    [
      "macInfo:v,os:y,osVersion:b,coreVersion:t,coreType:e",
      "macInfo:v,os:localImportOs,osVersion:localImportOsVersion,coreVersion:t,coreType:e",
    ],
  ];
  for (const [before, after] of changes) {
    if (code.split(before).length !== 2)
      throw Error("Import fingerprint grouping changed: " + before);
    code = code.replace(before, after);
  }
  const ast = acorn.parse(code, {
      sourceType: "module",
      ecmaVersion: "latest",
    }),
    edits = [];
  walk.simple(ast, {
    AwaitExpression(node) {
      const text = code.slice(node.argument.start, node.argument.end);
      if (text.startsWith("i.window.userImportWindowInfoV2Create("))
        edits.push([
          node.argument.start,
          node.argument.end,
          text + ".catch(error=>({code:error.code||-1,msg:error.message}))",
        ]);
    },
  });
  if (edits.length !== 1)
    throw Error("Import creation rejection adaptation changed");
  for (const [start, end, value] of edits)
    code = code.slice(0, start) + value + code.slice(end);
  fs.writeFileSync(file, code);
}
{
  const file = dir + "/create-HSjma60V.js";
  let code = fs.readFileSync(file, "utf8"),
    edits = [];
  walk.simple(
    acorn.parse(code, { sourceType: "module", ecmaVersion: "latest" }),
    {
      FunctionDeclaration(node) {
        const body = code.slice(node.body.start + 1, node.body.end - 1);
        if (body.includes("'profiles:choose-import'"))
          edits.push([
            node.body.start,
            node.body.end,
            "{try{" + body + "}catch(error){s(-1,error.message);}}",
          ]);
      },
    },
  );
  if (edits.length !== 1) throw Error("Import picker error boundary changed");
  for (const [start, end, value] of edits)
    code = code.slice(0, start) + value + code.slice(end);
  fs.writeFileSync(file, code);
}
// An unfinished optional feature must remain an explicit failure, not close its
// form as if a task was started. Preserve the original fields for later wiring.
{
  const file = dir + "/operationHandlers-Db52Gyo7.js";
  let code = fs.readFileSync(file, "utf8"),
    edits = [];
  walk.simple(
    acorn.parse(code, { sourceType: "module", ecmaVersion: "latest" }),
    {
      ArrowFunctionExpression(node) {
        if (!node.async || node.body.type !== "BlockStatement") return;
        const body = code.slice(node.body.start + 1, node.body.end - 1);
        if (body.includes("browser:startCookieRobot")) {
          const fixed = body.replace(
            "globalThis.electronAPI.send(`browser:startCookieRobot`",
            "await globalThis.electronAPI.send(`browser:startCookieRobot`",
          );
          if (fixed === body)
            throw Error("Cookie robot await structure changed");
          edits.push([
            node.body.start,
            node.body.end,
            "{try{" +
              fixed +
              "}catch(error){if(!error.localUiNotified)globalThis.__localUiError(error.message);}}",
          ]);
        }
      },
    },
  );
  if (edits.length !== 1)
    throw Error("Cookie robot optional failure boundary changed");
  for (const [start, end, value] of edits)
    code = code.slice(0, start) + value + code.slice(end);
  fs.writeFileSync(file, code);
}
// Native path attachments preview through the bounded, encrypted file store.
// The original lists contained passwords behind a visual mask. Local polling
// redacts them, so fetch secrets only when the user explicitly opens an editor.
{
  const file = dir + "/list-CkXy4JN3.js";
  let code = fs.readFileSync(file, "utf8"),
    edits = [];
  walk.simple(
    acorn.parse(code, { sourceType: "module", ecmaVersion: "latest" }),
    {
      FunctionDeclaration(node) {
        if (node.id.name !== "St") return;
        const arg = node.params[0].name;
        edits.push([
          node.body.start + 1,
          node.body.start + 1,
          `const fresh=await globalThis.__localRequest('accounts:list',{id:${arg}.id});${arg}={...${arg},...fresh.rows[0]};`,
        ]);
        if (!node.async) edits.push([node.start, node.start, "async "]);
      },
    },
  );
  if (edits.length !== 2)
    throw Error("Account editor secret-read boundary changed");
  for (const [start, end, value] of edits.sort((a, b) => b[0] - a[0]))
    code = code.slice(0, start) + value + code.slice(end);
  fs.writeFileSync(file, code);
}
{
  const file = dir + "/list-CkXy4JN3.js";
  let code = fs.readFileSync(file, "utf8"),
    edits = [];
  walk.simple(
    acorn.parse(code, { sourceType: "module", ecmaVersion: "latest" }),
    {
      FunctionDeclaration(node) {
        if (node.id.name === "Dt") {
          const [id, cache] = node.params.map((p) => p.name);
          edits.push([node.start, node.start, "async "]);
          edits.push([
            node.body.start + 1,
            node.body.start + 1,
            `if(!${cache}.visible[${id}]){const fresh=await globalThis.__localRequest('accounts:list',{id:${id}});const row=q.value.find(row=>String(row.id)===String(${id}));if(row)Object.assign(row,fresh.rows[0]);}`,
          ]);
        }
        if (node.id.name === "Ot") {
          edits.push([node.start, node.start, "async "]);
          const declaration = node.body.body[0];
          if (declaration.type !== "VariableDeclaration")
            throw Error("Account export selection changed");
          const selected = declaration.declarations[0].id.name;
          edits.push([
            declaration.end,
            declaration.end,
            `if(B.value)${selected}=await Promise.all(${selected}.map(async row=>(await globalThis.__localRequest('accounts:list',{id:row.id})).rows[0]));`,
          ]);
        }
        if (node.id.name === "wt") {
          const arg = node.params[0].name;
          edits.push([node.start, node.start, "async "]);
          edits.push([
            node.body.start + 1,
            node.body.start + 1,
            `if(I(u.ViewPassword))${arg}=(await globalThis.__localRequest('accounts:list',{id:${arg}.id})).rows[0];`,
          ]);
        }
      },
      Property(node) {
        if (
          node.key?.name === "value" &&
          node.value.type === "MemberExpression" &&
          node.value.property.name === "platformPassword"
        ) {
          const owner = code.slice(
              node.value.object.start,
              node.value.object.end,
            ),
            value = code.slice(node.value.start, node.value.end);
          edits.push([
            node.value.start,
            node.value.end,
            `(${value}??(${owner}.hasPassword?'********':''))`,
          ]);
        }
      },
    },
  );
  if (edits.length !== 7)
    throw Error(
      "Account secret display/export boundaries changed: " + edits.length,
    );
  for (const [start, end, value] of edits.sort((a, b) => b[0] - a[0]))
    code = code.slice(0, start) + value + code.slice(end);
  fs.writeFileSync(file, code);
}
{
  const file = dir + "/profile-info-ExiJC1su.js";
  let code = fs.readFileSync(file, "utf8"),
    edits = [];
  walk.simple(
    acorn.parse(code, { sourceType: "module", ecmaVersion: "latest" }),
    {
      ObjectExpression(node) {
        if (
          !node.properties.some(
            (p) =>
              p.key?.name === "name" &&
              p.value.type === "TemplateLiteral" &&
              p.value.quasis[0].value.cooked === "editPlatformAccount",
          )
        )
          return;
        const command = node.properties.find(
          (p) => p.key?.name === "command",
        )?.value;
        let owner;
        walk.simple(command.body, {
          Property(p) {
            if (
              p.key?.name === "datas" &&
              p.value.type === "MemberExpression" &&
              p.value.property.name === "windowPlatformList"
            )
              owner = p.value.object.name;
          },
        });
        if (!owner || !command.async)
          throw Error("Window account editor changed");
        edits.push([
          command.body.start + 1,
          command.body.start + 1,
          `${owner}.windowPlatformList=(await globalThis.__localRequest('profiles:read',{id:${owner}.id})).windowPlatformList;`,
        ]);
      },
    },
  );
  if (edits.length !== 1)
    throw Error("Window account secret-read boundary changed");
  for (const [start, end, value] of edits)
    code = code.slice(0, start) + value + code.slice(end);
  fs.writeFileSync(file, code);
}
{
  const file = dir + "/hook-CnJE4hRq.js";
  const code = fs.readFileSync(file, "utf8");
  const needle = "children:[{path:'kernels'";
  if (!code.includes(needle))
    throw Error("Local account route insertion changed");
  fs.writeFileSync(
    file,
    code.replace(
      needle,
      "children:[{path:'account',name:'local-account-root',redirect:'/account/list',children:[{path:'list',name:'account-list',component:()=>import('./list-CkXy4JN3.js'),meta:{title:'平台账号'}},{path:'create',name:'account-create',component:()=>import('./create-QG0MnZuH.js'),meta:{title:'添加账号'}}]},{path:'kernels'",
    ),
  );
}
// Clipboard/drop files retain the original Blob upload path and need no path grant.
patch(
  "hook-CnJE4hRq",
  {},
  { sh: "return globalThis.__attachmentPreviewPath(e);" },
);
{
  const file = dir + "/CreateTemplateDialog-Bpq9OLTG.js";
  let code = fs.readFileSync(file, "utf8"),
    edits = [];
  walk.simple(
    acorn.parse(code, { sourceType: "module", ecmaVersion: "latest" }),
    {
      FunctionDeclaration(node) {
        if (
          !code
            .slice(node.start, node.end)
            .includes("dialog:selectFileOrDirInfo")
        )
          return;
        walk.simple(node.body, {
          CatchClause(caught) {
            edits.push([
              caught.body.start,
              caught.body.end,
              `{globalThis.__localUiError?.(${caught.param.name}.message||String(${caught.param.name}));return;}`,
            ]);
          },
        });
      },
    },
  );
  if (edits.length !== 1)
    throw Error("Attachment picker error boundary changed");
  for (const [start, end, value] of edits)
    code = code.slice(0, start) + value + code.slice(end);
  fs.writeFileSync(file, code);
}

// The original selection toolbar used clickable divs. Keep its DOM/classes and
// mouse behavior while making the batch actions reachable by keyboard.
{
  const file=dir+'/ry-table-do6kugym.js';let code=fs.readFileSync(file,'utf8');
  const ast=acorn.parse(code,{sourceType:'module',ecmaVersion:'latest'}),edits=[];
  walk.simple(ast,{ObjectExpression(node){
    const classNode=node.properties.find(p=>p.key?.name==='class')?.value;
    if(!classNode)return;const classes=code.slice(classNode.start,classNode.end);
    if(!classes.includes('multiple-group-item')&&!classes.includes('multiple-group cursor-pointer'))return;
    if(!node.properties.some(p=>p.key?.name==='onClick'))throw Error('Selection keyboard action lost click handler');
    let disabled='false';walk.simple(classNode,{Property(p){if(p.key?.name==='disabled')disabled=code.slice(p.value.start,p.value.end);}});
    edits.push([node.end-1,node.end-1,`,role:'button',tabindex:${disabled}? -1:0,'aria-disabled':${disabled},onKeydown:event=>{if(!event.repeat&&(event.key==='Enter'||event.key===' ')){event.preventDefault();event.stopPropagation();if(!(${disabled}))event.currentTarget.click();}}`]);
  }});
  if(edits.length!==2)throw Error('Selection toolbar keyboard structure changed: '+edits.length);
  for(const [start,end,value]of edits.sort((a,b)=>b[0]-a[0]))code=code.slice(0,start)+value+code.slice(end);fs.writeFileSync(file,code);
}

// Deleting a template must not delete its shared Skill before the atomic
// template/task reference checks. Skills remain in the separate local library.
patch("MyTemplatesRoute-Eq3HlS6M", {}, { Ie: "await t.deleteRemoteTemplate(e.id);" });
{
  const file = dir + "/MyTemplatesRoute-Eq3HlS6M.js";
  let code = fs.readFileSync(file, "utf8");
  const tree = acorn.parse(code, { ecmaVersion: "latest", sourceType: "module" }), edits = [];
  walk.simple(tree, { ObjectExpression(node) {
    const kept = node.properties.filter(property => property.key?.name !== "deleteInstalledSkill");
    if (kept.length !== node.properties.length) edits.push([node.start, node.end,
      "{" + kept.map(property => code.slice(property.start, property.end)).join(",") + "}"]);
  } });
  if (edits.length !== 1) throw Error("Template Skill deletion callback changed");
  for (const [start, end, value] of edits.sort((a,b) => b[0]-a[0])) code = code.slice(0,start) + value + code.slice(end);
  fs.writeFileSync(file, code);
}

// Native tools address Skills by slug, not the old single installation root.
patch("CreateTemplateDialog-Bpq9OLTG", {}, { Ws: "return Us(e);", An: "return typeof e === 'string' && /^[a-z0-9][a-z0-9._-]{0,80}$/i.test(e.trim());" });

// The original conversation menu has keyboard handlers, but its trigger only
// mounts after hovering. Let the row's focus reveal the same existing trigger.
{
  const file = dir + "/hook-CnJE4hRq.js";
  let code = fs.readFileSync(file, "utf8");
  const tree = acorn.parse(code, { ecmaVersion: "latest", sourceType: "module" }), edits = [];
  const text = node => node?.type === "Literal" ? node.value : node?.type === "TemplateLiteral" && !node.expressions.length ? node.quasis[0].value.cooked : undefined;
  walk.simple(tree, { VariableDeclarator(component) {
    if (!component.init || !code.slice(component.init.start, component.init.end).includes('__name:`ConversationList`')) return;
    let row, trigger;
    walk.simple(component.init, { CallExpression(node) {
      const props = node.arguments[1]; if (props?.type !== "ObjectExpression") return;
      if (props.properties.some(property => text(property.key) === "trigger-class" && text(property.value) === "conversation-delete")) trigger = props;
      if (text(node.arguments[0]) === "a" && props.properties.some(property => property.key?.name === "class" && code.slice(property.start, property.end).includes('conversation-item'))) row = props;
    } });
    const focus = trigger?.properties.find(property => property.key?.name === "onFocus"), blur = trigger?.properties.find(property => property.key?.name === "onBlur");
    if (!row || !focus || !blur || row.properties.some(property => property.key?.name === "onFocus")) throw Error("Conversation focus contract changed");
    edits.push([row.end - 1, row.end - 1, ",onFocus:" + code.slice(focus.value.start, focus.value.end) + ",onBlur:focusEvent=>{if(!focusEvent.currentTarget.contains(focusEvent.relatedTarget))(" + code.slice(blur.value.start, blur.value.end) + ")(focusEvent)}"]);
  } });
  if (edits.length !== 1) throw Error("Conversation row focus patch must match once");
  for (const [start, end, value] of edits) code = code.slice(0, start) + value + code.slice(end);
  fs.writeFileSync(file, code);
}
