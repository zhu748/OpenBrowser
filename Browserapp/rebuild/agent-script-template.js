"use strict";

const { parse } = require("acorn");
const { createHash } = require("node:crypto");
const { stripTypeScriptTypes } = require("node:module");

const MAX_SCRIPT_BYTES = 256 * 1024;
const mainNames = new Set(["main", "__main"]);

function readLiteral(node, depth = 0) {
  if (!node || depth > 64) throw Error("自描述宏只支持静态字面量");
  if (node.type === "ObjectExpression") {
    return Object.fromEntries(node.properties.map(property => {
      const key = property.key?.type === "Identifier" ? property.key.name : property.key?.value;
      if (property.type !== "Property" || property.computed || property.method || property.shorthand ||
          !["string", "number"].includes(typeof key) || ["__proto__", "constructor", "prototype"].includes(String(key))) {
        throw Error("自描述宏只支持静态对象属性");
      }
      return [key, readLiteral(property.value, depth + 1)];
    }));
  }
  if (node.type === "ArrayExpression")
    return node.elements.map(element => readLiteral(element, depth + 1));
  if (node.type === "Literal" &&
      (node.value === null || typeof node.value === "string" || typeof node.value === "boolean" || Number.isFinite(node.value))) {
    return node.value;
  }
  if (node.type === "UnaryExpression" && node.operator === "-" && Number.isFinite(node.argument?.value))
    return -node.argument.value;
  throw Error("自描述宏入参必须是静态字面量");
}

function readMacro(statements, name, fallback) {
  const call = statements.find(statement =>
    statement.type === "ExpressionStatement" && statement.expression.type === "CallExpression" &&
    statement.expression.callee.type === "Identifier" && statement.expression.callee.name === name,
  )?.expression;
  if (!call && fallback) return fallback();
  const value = call?.arguments[0];
  if (value?.type !== "ObjectExpression") throw Error(`脚本需要 ${name}({ ... }) 顶层静态对象`);
  return readLiteral(value);
}

function exportsMain(statement) {
  if (statement.type !== "ExportNamedDeclaration") return false;
  const declaration = statement.declaration;
  if (declaration?.type === "FunctionDeclaration" && mainNames.has(declaration.id?.name)) return true;
  if (declaration?.type === "VariableDeclaration" &&
      declaration.declarations.some(entry => entry.id.type === "Identifier" && mainNames.has(entry.id.name))) return true;
  return statement.specifiers.some(({ exported }) => mainNames.has(exported.name ?? exported.value));
}

function isLegacyScript(source) {
  return /(["'])(?:playwright|@(?:roxy|open)browser\/sandbox\/[\w-]+)\1/.test(source);
}

function scriptJavaScript(code) {
  try { return stripTypeScriptTypes(code, { mode: "strip" }); }
  catch (error) {
    if (error.code !== "ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX") throw error;
    return stripTypeScriptTypes(code, { mode: "transform" });
  }
}

function legacyOptionsSchema(value) {
  if (value == null || value === "") return { type: "object" };
  if (typeof value === "string" && Buffer.byteLength(value, "utf8") <= MAX_SCRIPT_BYTES) {
    try { return JSON.parse(value); }
    catch (_) { throw Error("旧模板的参数 Schema 不是有效的 JSON"); }
  }
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  throw Error("旧模板的参数 Schema 无效或过长");
}

function describeScript(code, filename, savedSchema) {
  if (typeof code !== "string" || !code.trim()) throw Error("请输入脚本源码");
  if (Buffer.byteLength(code, "utf8") > MAX_SCRIPT_BYTES) throw Error("脚本不能超过 256 KiB");
  let statements;
  try {
    statements = parse(scriptJavaScript(code), { ecmaVersion: "latest", sourceType: "module" }).body;
  } catch (error) {
    throw Error("脚本语法解析失败：" + error.message);
  }
  const legacy = isLegacyScript(code);
  const metadata = readMacro(statements, "defineMetadata", legacy && (() => ({
    name: typeof filename === "string" ? filename.replace(/\.(?:js|ts)$/i, "") : "本地自动化脚本",
  })));
  const paramsSchema = readMacro(statements, "defineParams", legacy && (() => legacyOptionsSchema(savedSchema)));
  const names = metadata.name && typeof metadata.name === "object" && !Array.isArray(metadata.name)
    ? Object.values(metadata.name) : [metadata.name];
  if (!names.some(name => typeof name === "string" && name.trim()))
    throw Error("defineMetadata.name 不能为空");
  if (paramsSchema?.type !== "object") throw Error("defineParams.type 必须是 'object'");
  if (!statements.some(exportsMain)) throw Error("脚本缺少导出的 main(options) 函数");
  return { metadata, paramsSchema };
}

function scriptFile(filename, code, savedSchema) {
  if (typeof filename !== "string" || filename.length > 180 ||
      !/\.(?:js|ts)$/i.test(filename) || /[/\\\x00-\x1f\x7f]/.test(filename)) {
    throw Error("请选择有效的 .js 或 .ts 脚本文件");
  }
  const { metadata, paramsSchema } = describeScript(code, filename, savedSchema);
  if (typeof metadata.slug === "string" && /^official-/i.test(metadata.slug.trim()))
    throw Error("脚本 slug 不能以 official- 开头");
  const sha512 = createHash("sha512").update(code).digest("hex");
  return {
    fileId: "local-script-" + sha512,
    ossUrl: "",
    sha512,
    filename,
    fileSize: Buffer.byteLength(code, "utf8"),
    contentType: /\.ts$/i.test(filename) ? "application/typescript" : "application/javascript",
    optionsSchema: JSON.stringify(paramsSchema),
    scriptSource: code,
  };
}

module.exports = { describeScript, scriptFile, isLegacyScript, scriptJavaScript };
