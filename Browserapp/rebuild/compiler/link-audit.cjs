"use strict";
const { evidencePath } = require("./evidence-path.cjs");

const fs = require("node:fs"),
  path = require("node:path"),
  acorn = require("acorn"),
  walk = require("acorn-walk"),scope=require('eslint-scope'),globals=require('globals');
const root = path.resolve(process.env.REBUILD_OUTPUT || path.join(__dirname, "../../roxy-ui")),
  modules = new Map(),
  failures = [];
const allowedGlobals=new Set([...Object.keys(globals.browser),...Object.keys(globals.es2025),'$t','$appVersion','isElectron','__vite__mapDeps','__VUE_OPTIONS_API__','__VUE_PROD_DEVTOOLS__','__VUE_PROD_HYDRATION_MISMATCH_DETAILS__','__INTLIFY_PROD_DEVTOOLS__','__INTLIFY_DROP_MESSAGE_COMPILER__','__VUE_I18N_FULL_INSTALL__','__VUE_I18N_LEGACY_API__','__SENTRY_DEBUG__']);
// Reviewed vendor compatibility branches. These names are guarded environment
// detection or a caught legacy polyfill assignment, never renderer Node access.
const compatibility={
 'ScriptSchemaForm-z_48GvPJ.js':['global'],
 'workbench-jsonforms.js':['global'],
 'dist-NctnpPRe.js':['global'],
 'runtime-core.esm-bundler-CBj16o9G.js':['global'],
 'locales-BfKu2SD4.js':['global'],
 'workbench-vue-i18n.js':['global'],
 'exceljs.min-DfecxsXL.js':['global','define','Deno','Pebble','ActiveXObject','regeneratorRuntime','msCrypto'],
 'utils-BIWenCnY.js':['define'],
 'rolldown-runtime-BCiCTKAo.js':['require'],
};
const compatibilityReferences=[];
const assetDirectories = [path.join(root, "assets")];
const sourceFrontend = path.join(root, "source-frontend");
if (fs.existsSync(sourceFrontend)) assetDirectories.push(sourceFrontend);
const javascript = assetDirectories.flatMap(dir => fs.readdirSync(dir)
  .filter(name => name.endsWith(".js")).map(name => path.join(dir, name)));
for (const file of javascript) {
  const name = path.basename(file), code = fs.readFileSync(file, "utf8");
  modules.set(file, {
    ast: acorn.parse(code, { ecmaVersion: "latest", sourceType: "module",ranges:true,locations:true }),
    exports: new Set(),
    stars: [],
    imports: [],
    computedImports: [],
  });
  const ast=modules.get(file).ast,manager=scope.analyze(ast,{ecmaVersion:2024,sourceType:'module',optimistic:true,ignoreEval:true}),typeChecks=new Set();
  modules.get(file).translates = manager.globalScope.through.some(reference => reference.identifier.name === '$t');
  walk.simple(ast,{UnaryExpression(node){if(node.operator==='typeof'&&node.argument.type==='Identifier')typeChecks.add(node.argument.start);}});
  for(const reference of manager.globalScope.through){const node=reference.identifier;if(allowedGlobals.has(node.name))continue;
   if(typeChecks.has(node.start)||compatibility[name]?.includes(node.name)){compatibilityReferences.push({file:name,name:node.name,line:node.loc.start.line,reason:typeChecks.has(node.start)?'typeof feature detection':'reviewed vendor compatibility branch'});continue;}
   failures.push({file:name,name:node.name,line:node.loc.start.line,error:'undeclared renderer binding'});
  }
}
const resolve = (file, source) =>
  source.startsWith("/")
    ? path.join(root, source)
    : path.resolve(path.dirname(file), source);
for (const [file, m] of modules) {
  for (const n of m.ast.body) {
    if (n.type === "ImportDeclaration")
      m.imports.push({
        source: n.source.value,
        names: n.specifiers
          .filter((s) => s.type !== "ImportNamespaceSpecifier")
          .map((s) =>
            s.type === "ImportDefaultSpecifier"
              ? "default"
              : s.imported.name || s.imported.value,
          ),
      });
    if (n.type === "ExportDefaultDeclaration") m.exports.add("default");
    if (n.type === "ExportNamedDeclaration") {
      for (const s of n.specifiers)
        m.exports.add(s.exported.name || s.exported.value);
      if (n.declaration) {
        const d = n.declaration;
        if (d.id) m.exports.add(d.id.name);
        for (const decl of d.declarations || [])
          if (decl.id.type === "Identifier") m.exports.add(decl.id.name);
      }
      if (n.source)
        m.imports.push({
          source: n.source.value,
          names: n.specifiers.map((s) => s.local.name || s.local.value),
        });
    }
    if (n.type === "ExportAllDeclaration")
      m.stars.push(resolve(file, n.source.value));
  }
  walk.simple(m.ast, {
    ImportExpression(n) {
      if (n.source.type === "Literal")
        m.imports.push({ source: n.source.value, names: [] });
      else if (n.source.type === "TemplateLiteral" && !n.source.expressions.length)
        m.imports.push({ source: n.source.quasis[0].value.cooked, names: [] });
      else m.computedImports.push(n.loc.start.line);
    },
  });
}
for (let i = 0; i < modules.size; i++) {
  let changed = false;
  for (const m of modules.values())
    for (const target of m.stars)
      for (const key of modules.get(target)?.exports || [])
        if (key !== "default" && !m.exports.has(key)) {
          m.exports.add(key);
          changed = true;
        }
  if (!changed) break;
}
for (const [file, m] of modules)
  for (const imp of m.imports) {
    if (!imp.source.startsWith(".") && !imp.source.startsWith("/")) {
      failures.push({ file, source: imp.source, error: "nonlocal import" });
      continue;
    }
    const target = resolve(file, imp.source);
    if (!fs.existsSync(target)) {
      failures.push({ file, source: imp.source, error: "missing file" });
      continue;
    }
    if (!target.endsWith(".js")) continue;
    for (const name of imp.names)
      if (!modules.get(target)?.exports.has(name))
        failures.push({
          file,
          source: imp.source,
          name,
          error: "missing export",
        });
  }
{
  const { unclassifiedCopiedAssets, unclassifiedStylesheets } =
    require("./workbench-source-provenance.cjs").writeSourceProvenance({ root, modules, resolve });
  for (const file of unclassifiedCopiedAssets) {
    failures.push({ file, error: "copied asset must have maintained source or be a reviewed dependency" });
  }
  for (const file of unclassifiedStylesheets) {
    failures.push({ file, error: "stylesheet must have maintained source or be a reviewed dependency" });
  }
}
const result = {
  status: failures.length ? "FAIL" : "PASS",
  modules: modules.size,
  compatibilityReferences,
  failures,
};
fs.writeFileSync(
  evidencePath("module-links.json"),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
