"use strict";
const path = require("node:path");
const fs = require("node:fs/promises");
const ORIGIN = "obui://app";
const DOCUMENT = ORIGIN + "/index.html";
const CSP =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
function resolveAsset(root, rawUrl) {
  const url = new URL(rawUrl);
  if (url.origin !== "null" && url.origin !== ORIGIN)
    throw Error("Invalid UI origin");
  if (
    url.protocol !== "obui:" ||
    url.hostname !== "app" ||
    url.username ||
    url.password ||
    url.port
  )
    throw Error("Invalid UI origin");
  const decoded = decodeURIComponent(url.pathname);
  if (decoded.includes("\\") || decoded.includes("\0"))
    throw Error("Invalid UI asset path");
  const file = path.resolve(
    root,
    "." + (decoded === "/" ? "/index.html" : decoded),
  );
  if (!file.startsWith(path.resolve(root) + path.sep))
    throw Error("Invalid UI asset path");
  return file;
}
function isUiRequest(raw) {
  try {
    const url = new URL(raw);
    if (url.protocol === "obui:")
      return (
        url.hostname === "app" && !url.username && !url.password && !url.port
      );
    if (url.protocol === "blob:") return raw.startsWith("blob:obui://app/");
    return ["data:", "devtools:"].includes(url.protocol);
  } catch {
    return false;
  }
}
function isUiDocument(raw) {
  try {
    const u = new URL(raw);
    return (
      u.protocol === "obui:" &&
      u.hostname === "app" &&
      !u.username &&
      !u.password &&
      !u.port &&
      u.pathname === "/index.html"
    );
  } catch {
    return false;
  }
}
function registerUiScheme(protocol) {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "obui",
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    },
  ]);
}
function installUiProtocol(protocol, net, root, { agentFile } = {}) {
  protocol.handle("obui", async (request) => {
    try {
      const url = new URL(request.url);
      if (
        url.protocol === "obui:" &&
        url.hostname === "app" &&
        !url.username &&
        !url.password &&
        !url.port &&
        url.pathname.startsWith("/agent-files/")
      ) {
        if (!agentFile) return new Response("Not found", { status: 404 });
        if (request.method && !["GET", "HEAD"].includes(request.method))
          return new Response("Method not allowed", { status: 405 });
        const file = await agentFile(url.pathname.slice(13));
        return new Response(request.method === "HEAD" ? null : file.bytes, {
          headers: {
            "Content-Type": file.mimeType,
            "Cache-Control": "no-store",
            "Content-Security-Policy": CSP,
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
      const file = resolveAsset(root, request.url);
      const real = await fs.realpath(file),
        base = await fs.realpath(root);
      if (!real.startsWith(base + path.sep))
        return new Response("Forbidden", { status: 403 });
      const types = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".ico": "image/x-icon",
        ".woff2": "font/woff2",
        ".woff": "font/woff",
        ".ttf": "font/ttf",
        ".wasm": "application/wasm",
        ".json": "application/json",
      };
      const body = await fs.readFile(real);
      const headers = new Headers({
        "Content-Type": types[path.extname(real)] || "application/octet-stream",
      });
      headers.set("Content-Security-Policy", CSP);
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(body, { status: 200, headers });
    } catch (e) {
      return new Response(e.code === "ENOENT" ? "Not found" : "Invalid asset", {
        status: e.code === "ENOENT" ? 404 : 400,
      });
    }
  });
}
module.exports = {
  ORIGIN,
  DOCUMENT,
  CSP,
  resolveAsset,
  isUiDocument,
  isUiRequest,
  registerUiScheme,
  installUiProtocol,
};
