"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  acorn = require("acorn"),
  walk = require("acorn-walk");
const dir = "work/rebuild/stage/assets";
const literal = (node) =>
  node?.type === "Literal"
    ? node.value
    : node?.type === "TemplateLiteral" && !node.expressions.length
      ? node.quasis[0].value.cooked
      : undefined;
for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".js"))) {
  let code = fs.readFileSync(path.join(dir, file), "utf8");
  const ast = acorn.parse(code, {
      sourceType: "module",
      ecmaVersion: "latest",
    }),
    edits = new Map();
  const replace = (node, value) =>
    edits.set(node.start, { start: node.start, end: node.end, value });
  walk.ancestor(ast, {
    CallExpression(node, parents) {
      const fn = parents.findLast((parent) =>
        [
          "FunctionDeclaration",
          "FunctionExpression",
          "ArrowFunctionExpression",
        ].includes(parent.type),
      );
      if (!fn || fn.body.type !== "BlockStatement") return;
      if (node.callee.property?.name === 'userUpdateOnboardingTaskStatusCreate')
        replace(fn.body,"{const previous=await globalThis.__localRequest('settings:get');const onboardingTaskStatus={...previous.onboardingTaskStatus,...t};await globalThis.__localRequest('settings:set',{onboardingTaskStatus});Object.assign(a.userInfo,{onboardingTaskStatus});}");
      if (node.callee.property?.name === "userGetCloudBrowserInfoList")
        replace(fn.body, "{return false;}");
      const channel = literal(node.arguments[0]);
      if (
        ["mcp:triggerAgentUpdate", "mcp:restartAgentForUpdate"].includes(
          channel,
        )
      )
        replace(
          fn.body,
          "{throw Error('Agent 随本地安装包更新，无独立云端更新器');}",
        );
      if (
        ["mcp:checkAgentForUpdates", "mcp:getAgentUpdateInfo"].includes(channel)
      )
        replace(
          fn.body,
          "{return {updateAvailable:false,distribution:'local-package'};}",
        );
    },
    VariableDeclarator(node) {
      if (file === "utils-BIWenCnY.js" && node.id.name === "ZT")
        replace(
          node.init,
          `ve('locale',()=>{const current=a(l);return {currentLocale:current,siteLocale:o(()=>current.value.split('-')[0]),isZh:o(()=>current.value.startsWith('zh')),setSimpleLocale:async language=>{if(!['zh-CN','en','ru'].includes(language))throw Error('不支持此界面语言');await globalThis.__localApi.base.userSetUserConfigCreate({language});current.value=language;localStorage.setItem('locale',JSON.stringify({currentLocale:language}));location.reload();},getLocaleAppBaseUrl:(target='')=>'obui://app/index.html#'+target,getOfficialWebsite:()=>'',getOfficialFaqWebsite:()=>'',getVideoSource:()=>'',openTelegram:async()=>{throw Error('远程社群入口已移除');}}},{persist:true})`,
        );
      if (file === "utils-BIWenCnY.js" && node.id.name === "BY")
        replace(
          node.init,
          `ve('tutorial',()=>{const videoMaps=a({});return {videoMaps,getVideoByType:async()=>undefined,getVideoMaps:async()=>videoMaps.value,resetVideoMaps:()=>{videoMaps.value={};}}})`,
        );
      if (
        file === "hook-CnJE4hRq.js" &&
        node.id.name === "GT" &&
        node.init.type === "ObjectExpression"
      ) {
        const properties = node.init.properties.filter(
          (property) => literal(property.key) !== "cloud-phone",
        );
        replace(
          node.init,
          "{" +
            properties
              .map((property) => code.slice(property.start, property.end))
              .join(",") +
            "}",
        );
      }
    },
    FunctionDeclaration(node) {
      if (file === "hook-CnJE4hRq.js" && ["AT", "IT"].includes(node.id.name))
        replace(node.body, "{throw Error('本地窗口不限量，无需套餐升级');}");
      if (file === "hook-CnJE4hRq.js" && node.id.name === "jT")
        replace(node.body, "{return false;}");
      if (
        file === "renewal-reminder-drawer-C9_4HaAB.js" &&
        /subscribe-plan/.test(code.slice(node.body.start, node.body.end))
      )
        replace(node.body, "{throw Error('本地窗口没有付费续期限制');}");
    },
  });
  let boundary = Infinity;
  for (const edit of [...edits.values()].sort((a, b) => b.start - a.start)) {
    if (edit.end > boundary) continue;
    code = code.slice(0, edit.start) + edit.value + code.slice(edit.end);
    boundary = edit.start;
  }
  fs.writeFileSync(path.join(dir, file), code);
}
