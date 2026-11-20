"use strict";

const { createHash } = require("node:crypto");
const { parse: parseModule } = require("acorn");
const { transformSync } = require("esbuild");
const { parse: parseMarkup, NodeTypes } = require("@vue/compiler-dom");
const { compileScript, compileStyle, compileTemplate, parse } = require("@vue/compiler-sfc");

const runtime = "./workbench-vue.js";

function check(errors) {
  if (errors.length) throw new Error(errors.map(error => error.message || error).join("\n"));
}

// The workbench already owns the Vue instance used by its router, directives,
// dialogs and stores. Compile components against that instance.
function compileWorkbenchComponent({ source, filename, scopeId, aliases = [] }) {
  const parsed = parse(source, { filename });
  check(parsed.errors);
  const { descriptor } = parsed;
  const id = scopeId || createHash("sha256").update(filename).digest("hex").slice(0, 8);
  const scoped = Boolean(scopeId) || descriptor.styles.some(style => style.scoped);
  const templateOptions = {
    id, filename, scoped, transformAssetUrls: false,
    compilerOptions: { runtimeModuleName: runtime },
  };
  const script = descriptor.scriptSetup || descriptor.script;
  const component = script
    ? compileScript(descriptor, { id, inlineTemplate: Boolean(descriptor.scriptSetup),
      genDefaultAs: "__workbenchComponent", templateOptions }).content
    : "const __workbenchComponent = {};";

  let code = component;
  if (!descriptor.scriptSetup && descriptor.template) {
    const template = compileTemplate({ ...templateOptions, source: descriptor.template.content });
    check(template.errors);
    code += "\n" + template.code + "\n__workbenchComponent.render = render;";
  }
  if (scoped) code += "\n__workbenchComponent.__scopeId = " + JSON.stringify("data-v-" + id) + ";";
  code += "\nexport default __workbenchComponent;\n";
  if (aliases.length) code += "export { " + aliases.map(name => "__workbenchComponent as " + name).join(", ") + " };\n";

  if (script?.lang && script.lang !== "js") {
    code = transformSync(code, { loader: script.lang, format: "esm", sourcefile: filename }).code;
  }
  const imports = parseModule(code, { ecmaVersion: "latest", sourceType: "module" }).body
    .filter(node => node.type === "ImportDeclaration" && node.source.value === "vue");
  for (const { source: entry } of imports.reverse()) {
    code = code.slice(0, entry.start) + JSON.stringify(runtime) + code.slice(entry.end);
  }
  const styles = descriptor.styles.map(block => {
    const style = compileStyle({ filename, id, source: block.content, scoped: block.scoped });
    check(style.errors);
    return style.code;
  });
  return { code, css: styles.join("\n") };
}

function compileWorkbenchIcon({ source, filename, exports: names = { component: "default", render: "render" } }) {
  const exports = `\nconst component = { render };
export { component as ${names.component}, render as ${names.render} };\n`;
  if (!/<style[\s>]/.test(source)) {
    const template = compileTemplate({ source, filename, id: filename, transformAssetUrls: false,
      compilerOptions: { runtimeModuleName: runtime } });
    check(template.errors);
    return { code: template.code.replace("export function render", "function render") + exports, css: "" };
  }

  // Keep embedded SVG keyframes inline. Vue's template transform otherwise
  // removes the <style> element from this icon.
  const { children: roots } = parseMarkup(source.trim());
  const [svg] = roots;
  if (roots.length !== 1 || svg.type !== NodeTypes.ELEMENT || svg.tag !== "svg" ||
      svg.props.some(prop => prop.type !== NodeTypes.ATTRIBUTE || !prop.value)) {
    throw Error("Expected one static SVG root in " + filename);
  }
  const attributes = Object.fromEntries(svg.props.map(prop => [prop.name, prop.value.content]));
  const children = svg.children.map(child => child.loc.source).join("");
  return {
    code: `import { h, createStaticVNode } from ${JSON.stringify(runtime)};
const attributes = ${JSON.stringify(attributes)};
const children = ${JSON.stringify(children)};
function render() {
  return h("svg", attributes, children ? [createStaticVNode(children, ${svg.children.length})] : []);
}
` + exports,
    css: "",
  };
}

module.exports = { compileWorkbenchComponent, compileWorkbenchIcon };
