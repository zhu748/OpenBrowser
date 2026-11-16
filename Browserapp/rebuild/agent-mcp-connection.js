"use strict";

const { spawn } = require("node:child_process");
const LIMIT = 2 * 1024 * 1024, VERSION = "2024-11-05";

class Connection {
  constructor(config, options = {}) {
    this.config = config; this.nextId = 0; this.pending = new Map();
    this.controller = new AbortController(); this.closed = false; this.replying = 0;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 20000;
    this.cleanupTimeoutMs = options.cleanupTimeoutMs ?? 2000;
    this.killAfterMs = options.killAfterMs ?? 1500;
    this.exitTimeoutMs = options.exitTimeoutMs ?? 3000;
  }

  async open(signal) {
    signal?.throwIfAborted();
    if (this.closed) throw Error("MCP connection closed");
    if (this.config.type === "stdio") this.openProcess();
    const initialized = await this.request("initialize", { protocolVersion: VERSION, capabilities: {},
      clientInfo: { name: "OpenBrowser", version: "1.0" } }, signal);
    if (!initialized || typeof initialized.protocolVersion !== "string" || !initialized.capabilities)
      throw Error("Invalid MCP initialize response");
    this.version = initialized.protocolVersion;
    await this.write({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }, signal);
    return this;
  }

  openProcess() {
    const environment = {};
    for (const key of ["PATH", "HOME", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "SystemRoot", "WINDIR", "TEMP", "TMP", "LANG"])
      if (process.env[key] !== undefined) environment[key] = process.env[key];
    const child = this.child = spawn(this.config.command, this.config.args, {
      env: { ...environment, ...this.config.env }, shell: false, stdio: ["pipe", "pipe", "pipe"], windowsHide: true,
    });
    this.exited = new Promise(resolve => { child.once("exit", resolve); child.once("error", resolve); });
    let buffer = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", text => {
      if (this.closed) return;
      buffer += text;
      let end;
      while ((end = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, end).trim(); buffer = buffer.slice(end + 1);
        if (Buffer.byteLength(line) > LIMIT) { this.fail(Error("MCP response exceeds 2 MiB")); return; }
        if (!line) continue;
        try { this.receive(JSON.parse(line)); }
        catch (error) { this.fail(Error("Invalid MCP JSON response", { cause: error })); return; }
      }
      if (Buffer.byteLength(buffer) > LIMIT) this.fail(Error("MCP response exceeds 2 MiB"));
    });
    child.stderr.resume();
    child.stdin.on("error", error => this.fail(error));
    child.on("error", error => this.fail(error));
    child.on("exit", code => this.fail(Error("MCP process exited (" + code + ")")));
  }

  receive(message) {
    if (message?.jsonrpc !== "2.0") throw Error("Invalid MCP protocol response");
    if (message.method !== undefined) {
      if (typeof message.method !== "string") throw Error("Invalid MCP method");
      if (message.id !== undefined) {
        if (this.replying >= 32) {
          const error = Error("Too many pending MCP server requests"); this.fail(error); throw error;
        }
        const response = message.method === "ping" ? { result: {} } : { error: { code: -32601, message: "Client capability not supported" } };
        this.replying++;
        void this.write({ jsonrpc: "2.0", id: message.id, ...response }, AbortSignal.timeout(this.requestTimeoutMs))
          .catch(error => this.fail(error)).finally(() => { this.replying--; });
      }
      return;
    }
    const pending = this.pending.get(message.id);
    if (!pending) return;
    if (message.error) pending.reject(Object.assign(Error(String(message.error.message || "MCP error")), { code: message.error.code }));
    else if (Object.hasOwn(message, "result")) pending.resolve(message.result);
    else pending.reject(Error("Invalid MCP result"));
  }

  async write(message, signal) {
    signal?.throwIfAborted();
    if (this.closed) throw Error("MCP connection closed");
    const text = JSON.stringify(message);
    if (Buffer.byteLength(text) > LIMIT) throw Error("MCP request exceeds 2 MiB");
    if (this.config.type === "stdio") return this.writeProcess(text, signal);
    return this.writeHttp(message, text, signal);
  }

  writeProcess(text, signal) {
    const combined = AbortSignal.any([this.controller.signal, ...(signal ? [signal] : []), AbortSignal.timeout(this.requestTimeoutMs)]);
    return new Promise((resolve, reject) => {
      const finish = error => { combined.removeEventListener("abort", abort); error ? reject(error) : resolve(); };
      const abort = () => finish(combined.reason || Error("MCP request cancelled"));
      combined.addEventListener("abort", abort, { once: true });
      if (combined.aborted) { abort(); return; }
      try { this.child.stdin.write(text + "\n", error => finish(error)); }
      catch (error) { finish(error); }
    });
  }

  async writeHttp(message, text, signal) {
    const request = message.id !== undefined && typeof message.method === "string";
    const headers = { ...this.config.headers, "Content-Type": "application/json", Accept: "application/json, text/event-stream",
      ...(this.session ? { "Mcp-Session-Id": this.session } : {}), ...(this.version ? { "MCP-Protocol-Version": this.version } : {}) };
    const response = await fetch(this.config.url, { method: "POST", headers, body: text, redirect: "error",
      signal: AbortSignal.any([this.controller.signal, ...(signal ? [signal] : []), AbortSignal.timeout(this.requestTimeoutMs)]) });
    try {
      if (!response.ok) throw Error("MCP HTTP " + response.status);
      const session = response.headers.get("mcp-session-id");
      if (session) {
        if (this.session && this.session !== session) throw Error("MCP session changed unexpectedly");
        this.session = session;
      }
      if (response.status === 202 || response.status === 204) {
        if (request) throw Error("Invalid MCP empty response");
        return;
      }
      const type = (response.headers.get("content-type") || "").toLowerCase();
      if (!/application\/json|text\/event-stream/.test(type)) throw Error("Unsupported MCP content-type");
      const accept = value => {
        if (value?.method !== undefined) { this.receive(value); return false; }
        if (!request || value?.id !== message.id) throw Error("MCP response ID does not match request");
        this.receive(value); return true;
      };
      await this.readHttp(response, type, accept, request);
    } finally { await response.body?.cancel().catch(() => {}); }
  }

  async readHttp(response, type, accept, request) {
    let total = 0, buffer = "", matched = false;
    const decoder = new TextDecoder();
    const event = text => {
      const data = text.split("\n").filter(line => line.startsWith("data:")).map(line => line.slice(5).replace(/^ /, "")).join("\n");
      return data ? accept(JSON.parse(data)) : false;
    };
    const sse = type.includes("text/event-stream");
    for await (const chunk of response.body) {
      total += chunk.byteLength;
      if (total > LIMIT) throw Error("MCP response exceeds 2 MiB");
      buffer += decoder.decode(chunk, { stream: true });
      if (sse) {
        buffer = buffer.replace(/\r\n/g, "\n");
        let end;
        while ((end = buffer.indexOf("\n\n")) !== -1) {
          const text = buffer.slice(0, end); buffer = buffer.slice(end + 2);
          if (event(text)) return;
        }
      }
    }
    buffer += decoder.decode();
    if (buffer.trim()) matched = sse ? event(buffer.replace(/\r\n/g, "\n")) : accept(JSON.parse(buffer));
    if (request && !matched) throw Error("MCP response ended without a matching result");
  }

  async request(method, params, signal) {
    if (this.closed) throw Error("MCP connection closed");
    if (this.pending.size >= 128) throw Error("Too many pending MCP requests");
    const id = ++this.nextId, controller = new AbortController();
    const combined = AbortSignal.any([this.controller.signal, controller.signal, ...(signal ? [signal] : [])]);
    let timer, abort;
    try {
      return await new Promise((resolve, reject) => {
        this.pending.set(id, { resolve, reject });
        abort = () => reject(combined.reason || Error("MCP request cancelled"));
        combined.addEventListener("abort", abort, { once: true });
        timer = setTimeout(() => controller.abort(Error("MCP request timed out")), this.requestTimeoutMs); timer.unref?.();
        if (combined.aborted) { abort(); return; }
        void this.write({ jsonrpc: "2.0", id, method, params }, combined).catch(reject);
      });
    } finally {
      clearTimeout(timer); combined.removeEventListener("abort", abort); this.pending.delete(id);
      if (combined.aborted && !this.closed) {
        try { await this.write({ jsonrpc: "2.0", method: "notifications/cancelled", params: {
          requestId: id, reason: "OpenBrowser request cancelled",
        } }, AbortSignal.timeout(this.cleanupTimeoutMs)); }
        catch (error) { throw new AggregateError([combined.reason, error], "MCP 已取消，但远端取消通知失败"); }
      }
    }
  }

  notify(method, params) { return this.write({ jsonrpc: "2.0", method, params }); }
  fail(error) {
    if (this.closed) return;
    this.closed = true; this.controller.abort(error);
    for (const item of this.pending.values()) item.reject(error);
    this.pending.clear();
    if (this.child && !this.child.killed) this.child.kill();
  }

  close() {
    if (!this.closePromise) this.closePromise = this.closeNow().catch(error => { this.closePromise = undefined; throw error; });
    return this.closePromise;
  }

  async closeNow() {
    const session = this.session; this.fail(Error("MCP connection closed"));
    if (this.child) {
      const force = setTimeout(() => this.child.kill("SIGKILL"), this.killAfterMs);
      let timeout;
      try { await Promise.race([this.exited, new Promise((_, reject) => {
        timeout = setTimeout(() => reject(Error("MCP process did not exit after termination")), this.exitTimeoutMs);
      })]); }
      finally {
        clearTimeout(force); clearTimeout(timeout);
        this.child.stdin.destroy(); this.child.stdout.destroy(); this.child.stderr.destroy();
      }
    } else if (session) {
      const response = await fetch(this.config.url, { method: "DELETE", headers: { ...this.config.headers,
        "Mcp-Session-Id": session, "MCP-Protocol-Version": this.version }, redirect: "error", signal: AbortSignal.timeout(this.cleanupTimeoutMs) });
      await response.body?.cancel();
      if (!response.ok && response.status !== 404 && response.status !== 405) throw Error("MCP session cleanup HTTP " + response.status);
    }
  }

  async tools(signal) {
    const list = [], cursors = new Set(), names = new Set(); let cursor;
    do {
      signal?.throwIfAborted();
      const page = await this.request("tools/list", cursor ? { cursor } : {}, signal);
      if (!Array.isArray(page.tools)) throw Error("Invalid MCP tools response");
      list.push(...page.tools);
      if (list.length > 200) throw Error("MCP server exceeds 200 tools");
      cursor = page.nextCursor;
      if (cursor && (typeof cursor !== "string" || cursors.has(cursor) || cursors.size >= 20))
        throw Error("MCP pagination did not advance or exceeds 20 pages");
      if (cursor) cursors.add(cursor);
    } while (cursor);
    for (const tool of list) {
      if (typeof tool.name !== "string" || !tool.name || tool.name.length > 200 || !tool.inputSchema ||
          tool.inputSchema.type !== "object" || names.has(tool.name)) throw Error("Invalid or duplicate MCP tool definition");
      names.add(tool.name);
    }
    return list;
  }
}

module.exports = { Connection };
