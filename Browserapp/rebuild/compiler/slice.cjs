// Binding-aware removal of unreachable compiled code. Original import URLs remain intact.
const fs = require("fs"),
  path = require("path"),
  acorn = require("acorn"),
  walk = require("acorn-walk"),
  scope = require("eslint-scope");
const root = path.resolve("work/rebuild/stage/assets"),
  out = path.join(
    process.env.REBUILD_OUTPUT || path.resolve("Browserapp/roxy-ui"),
    "assets",
  );
fs.mkdirSync(out, { recursive: true });
const modules = new Map();
function read(file) {
  if (modules.has(file)) return modules.get(file);
  const code = fs
    .readFileSync(path.join(root, file), "utf8")
    .replace(/__vite__mapDeps\(\[[\d,\s]*\]\)/g, "[]");
  let ast = acorn.parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
      ranges: true,
    }),
    stmts = [];
  for (let n of ast.body) {
    if (n.type === "VariableDeclaration")
      for (const d of n.declarations)
        stmts.push({
          start: d.start,
          end: d.end,
          node: d,
          prefix: n.kind + " ",
          suffix: ";",
        });
    else if (
      n.type === "ExpressionStatement" &&
      n.expression.type === "SequenceExpression"
    )
      for (const d of n.expression.expressions)
        stmts.push({
          start: d.start,
          end: d.end,
          node: d,
          prefix: "(",
          suffix: ");",
        });
    else
      stmts.push({
        start: n.start,
        end: n.end,
        node: n,
        prefix: "",
        suffix: "",
      });
  }
  const sm = scope.analyze(ast, {
      ecmaVersion: 2024,
      sourceType: "module",
      optimistic: true,
      ignoreEval: true,
    }),
    ms = sm.scopes.find((s) => s.type === "module");
  const vars = new Map(ms.variables.map((v) => [v.name, v])),
    defs = new Map();
  for (const [name, v] of vars)
    for (const d of v.defs) {
      let ix = stmts.findIndex(
        (s) => d.name.start >= s.start && d.name.end <= s.end,
      );
      if (ix >= 0) defs.set(name, ix);
    }
  for (const s of stmts) {
    s.refs = new Set();
    s.imports = [];
    s.dynamic = [];
    s.keep = false;
    walk.simple(s.node, {
      ImportExpression(n) {
        if (n.source.type === "TemplateLiteral" && !n.source.expressions.length)
          s.dynamic.push(n.source.quasis[0].value.cooked);
        else if (n.source.type === "Literal") s.dynamic.push(n.source.value);
      },
    });
  }
  for (const sc of sm.scopes)
    for (const ref of sc.references) {
      if (ref.resolved && vars.get(ref.resolved.name) === ref.resolved) {
        const s = stmts.find(
          (s) => ref.identifier.start >= s.start && ref.identifier.end <= s.end,
        );
        s?.refs.add(ref.resolved.name);
      }
    }
  const exports = new Map();
  for (const s of stmts) {
    const n = s.node;
    if (n.type === "ExportNamedDeclaration")
      for (const sp of n.specifiers)
        exports.set(sp.exported.name, {
          local: sp.local.name,
          statement: s,
          source: n.source?.value,
        });
    if (n.type === "ExportDefaultDeclaration")
      exports.set("default", { local: n.declaration.name, statement: s });
  }
  const m = { code, stmts, vars, defs, exports, ms, file };
  modules.set(file, m);
  return m;
}
const queue = [];
function need(file, name) {
  if (file.startsWith("./")) file = file.slice(2);
  if (!fs.existsSync(path.join(root, file))) throw Error("Missing " + file);
  queue.push([file, name]);
}
need("bootstrap.js", "*entry");
need("local-api.js", "*entry");
need("agent-channel.js", "*entry");
const used = new Set();
while (queue.length) {
  const [file, name] = queue.shift(),
    key = file + ":" + name;
  if (used.has(key)) continue;
  used.add(key);
  const m = read(file);
  function mark(ix) {
    const s = m.stmts[ix];
    if (!s || s.keep) return;
    s.keep = true;
    const n = s.node;
    if (n.type === "ImportDeclaration") return;
    for (const ref of s.refs) {
      const v = m.vars.get(ref);
      if (v?.defs[0]?.type === "ImportBinding") {
        const d = v.defs[0],
          sp = d.node,
          source = d.parent.source.value;
        if (source.startsWith("./"))
          need(
            source,
            sp.type === "ImportDefaultSpecifier"
              ? "default"
              : sp.type === "ImportNamespaceSpecifier"
                ? "*"
                : sp.imported.name,
          );
        const ds = m.stmts[m.defs.get(ref)];
        if (ds) ds.keep = true;
      } else mark(m.defs.get(ref));
    }
    for (const imp of s.dynamic)
      if (imp.startsWith("./")) need(imp, "*");
      else if (imp.startsWith("/assets/")) need(imp.slice(8), "*");
  }
  if (
    name === "*entry" ||
    /^(locales-|runtime-core|runtime-dom|rolldown-runtime)/.test(file)
  )
    m.stmts.forEach((s, i) => mark(i));
  else if (name === "*") for (const e of m.exports.keys()) need(file, e);
  else {
    const ex = m.exports.get(name);
    if (!ex) {
      if (name === "default") {
        for (const e of m.exports.keys()) need(file, e);
        continue;
      }
      throw Error("No export " + key);
    }
    ex.statement.keep = true;
    if (ex.source) need(ex.source, ex.local);
    else {
      const definition = m.vars.get(ex.local)?.defs[0];
      if (definition?.type === "ImportBinding") {
        const spec = definition.node;
        need(
          definition.parent.source.value,
          spec.type === "ImportDefaultSpecifier"
            ? "default"
            : spec.type === "ImportNamespaceSpecifier"
              ? "*"
              : spec.imported.name,
        );
      }
      mark(m.defs.get(ex.local));
    }
  }
  // Include prototype writes and registrations only for bindings retained in this module.
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < m.stmts.length; i++) {
      const s = m.stmts[i];
      if (["hook-CnJE4hRq.js", "layout-C916OUcf.js"].includes(file)) {
        const node =
          s.node.type === "ExpressionStatement" ? s.node.expression : s.node;
        let target = node.type === "AssignmentExpression" ? node.left : null;
        while (target?.type === "MemberExpression") target = target.object;
        if (
          target?.type !== "Identifier" ||
          !m.stmts[m.defs.get(target.name)]?.keep
        )
          continue;
      }
      if (
        s.keep ||
        ![
          "ExpressionStatement",
          "AssignmentExpression",
          "CallExpression",
          "SequenceExpression",
        ].includes(s.node.type)
      )
        {
          // Compiled editors initialize class registries with top-level loops.
          // Keep only loops that write through an already retained binding;
          // reading a retained binding alone is not initialization evidence.
          if (!s.keep && ['ForStatement','ForInStatement','ForOfStatement'].includes(s.node.type)) {
            let initializesRetained = false;
            walk.simple(s.node, { AssignmentExpression(node) {
              let target = node.left;
              if (target.type !== 'MemberExpression') return;
              while (target.type === 'MemberExpression') target = target.object;
              if (target.type === 'Identifier' && m.stmts[m.defs.get(target.name)]?.keep) initializesRetained = true;
            } });
            if (initializesRetained) { mark(i); changed = true; }
          }
          continue;
        }
      if ([...s.refs].some((r) => m.stmts[m.defs.get(r)]?.keep)) {
        mark(i);
        changed = true;
      }
    }
  }
}
for (const m of modules.values()) {
  let lines = [];
  for (const s of m.stmts) {
    if (!s.keep) continue;
    let text = m.code.slice(s.start, s.end);
    if (s.node.type === "ImportDeclaration") {
      let specs = s.node.specifiers.filter((sp) => {
        const v = m.vars.get(sp.local.name);
        return v?.references.some((ref) =>
          m.stmts.some(
            (x) =>
              x.keep &&
              ref.identifier.start >= x.start &&
              ref.identifier.end <= x.end &&
              x !== s,
          ),
        );
      });
      if (!specs.length) {
        if (s.node.specifiers.length === 0) {
          lines.push(text);
          continue;
        }
        continue;
      }
      const named = specs
        .filter((s) => s.type === "ImportSpecifier")
        .map((s) =>
          s.imported.name === s.local.name
            ? s.local.name
            : s.imported.name + " as " + s.local.name,
        );
      const def = specs.find((s) => s.type === "ImportDefaultSpecifier"),
        ns = specs.find((s) => s.type === "ImportNamespaceSpecifier");
      text =
        "import " +
        [
          def?.local.name,
          ns ? "* as " + ns.local.name : null,
          named.length ? "{" + named.join(",") + "}" : null,
        ]
          .filter(Boolean)
          .join(",") +
        " from " +
        JSON.stringify(s.node.source.value) +
        ";";
    } else if (s.node.type === "ExportNamedDeclaration" && !s.node.source) {
      const specs = s.node.specifiers.filter((sp) =>
        used.has(m.file + ":" + sp.exported.name),
      );
      if (!specs.length) continue;
      text =
        "export {" +
        specs.map((s) => s.local.name + " as " + s.exported.name).join(",") +
        "};";
    }
    lines.push(s.prefix + text + s.suffix);
  }
  let code = lines.join("\n"); // Vite dependency preloading is redundant: CSS is linked by the local entry.
  code = code.replace(/__vite__mapDeps\(\[[\d,\s]*\]\)/g, "[]");
  fs.writeFileSync(path.join(out, m.file), code);
}
console.log("Retained modules", modules.size);
fs.writeFileSync(
  "docs/rebuild/module-inventory.json",
  JSON.stringify([...modules.keys()], null, 2),
);

fs.writeFileSync(
  "work/rebuild/used-exports.json",
  JSON.stringify([...used], null, 2),
);
