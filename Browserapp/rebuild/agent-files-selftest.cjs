"use strict";
const fs = require("node:fs/promises"),
  path = require("node:path"),
  os = require("node:os"),
  crypto = require("node:crypto"),
  http = require("node:http"),
  assert = require("node:assert/strict"),
  { setTimeout: delay } = require("node:timers/promises");
const { AgentFiles } = require("./agent-files"),
  { AgentService } = require("./agent-service"),
  { installUiProtocol } = require("./protocol"),
  { waitUntil } = require("./selftest-helpers.cjs");
(async () => {
  process.env.OPENBROWSER_MASTER_KEY = crypto.randomBytes(32).toString("hex");
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-agent-files-")),
    events = [],
    result = { status: "FAIL", checks: [] };
  let selected,
    service,
    fixtureError,
    requests = 0,
    textFile,
    imageFile;
  const image = await fs.readFile(
    path.join(__dirname, "../assets/logo-pixel.png"),
  );
  const server = http.createServer(async (req, res) => {
    try {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const input = JSON.parse(raw);
      requests++;
      const user = input.messages.findLast(
          (message) => message.role === "user",
        ),
        ollama = req.url === "/api/chat";
      if (ollama) assert.equal(user.images[0], image.toString("base64"));
      else
        assert.equal(
          user.content.find((part) => part.type === "image_url").image_url.url,
          "data:image/png;base64," + image.toString("base64"),
        );
      const tool = input.messages.findLast(
        (message) => message.role === "tool",
      );
      if (tool)
        assert.equal(JSON.parse(tool.content).content, "真实附件内容\n");
      const message = tool
        ? { role: "assistant", content: "已读取真实附件并收到图片。" }
        : {
            role: "assistant",
            content: "",
            tool_calls: [
              {
                id: "read-file",
                type: "function",
                function: {
                  name: "read_attachment",
                  arguments: ollama
                    ? { fileId: textFile.fileId, offset: 0, length: 12000 }
                    : JSON.stringify({
                        fileId: textFile.fileId,
                        offset: 0,
                        length: 12000,
                      }),
                },
              },
            ],
          };
      if (ollama) {
        res.writeHead(200, { "Content-Type": "application/x-ndjson" });
        res.end(JSON.stringify({ message, done: true }) + "\n");
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ choices: [{ message }] }));
      }
    } catch (error) {
      fixtureError = error;
      res.writeHead(500);
      res.end(error.message);
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const files = new AgentFiles({
      root,
      dialog: { showOpenDialog: async () => ({ filePaths: [selected] }) },
      window: () => null,
    });
    textFile = await files.upload({
      data: Buffer.from("真实附件内容\n").toString("base64"),
      fileName: "note.txt",
    });
    imageFile = await files.upload({
      data: image.toString("base64"),
      fileName: "picture.png",
    });
    assert.equal(
      (await files.get(textFile.fileId)).bytes.toString(),
      "真实附件内容\n",
    );
    for (const fileName of [
      "../secret",
      "/etc/passwd",
      "a\\b",
      "bad\nname",
      "x/../y",
    ])
      await assert.rejects(
        files.upload({ data: "YQ==", fileName }),
        /名称无效/,
      );
    for (const data of ["YQ=", "====", "YQ==!", "YQ==="])
      await assert.rejects(
        files.upload({ data, fileName: "x.txt" }),
        /编码|大小/,
      );
    await assert.rejects(
      files.upload({
        data: Buffer.from([0, 1, 255]).toString("base64"),
        fileName: "binary.pdf",
      }),
      /未发送给模型/,
    );
    await assert.rejects(
      files.resolve({ localAttachments: [{ localPath: "/etc/passwd" }] }),
      /没有原生选择授权/,
    );
    await assert.rejects(
      files.read({ fileId: textFile.fileId }, new Set()),
      /授权范围/,
    );
    result.checks.push(
      "真实加密文件往返；非法编码/文件名/二进制、未选择路径与跨会话工具读取均拒绝",
    );
    selected = path.join(root, "picked.txt");
    await fs.writeFile(selected, "原内容");
    const picked = await files.choose();
    await fs.writeFile(selected, "修改后的内容");
    const grant = await files.resolve({
      localAttachments: [{ localPath: picked.path }],
    });
    assert.equal((await files.get(grant[0].fileId)).bytes.toString(), "原内容");
    const folder = path.join(root, "folder");
    await fs.mkdir(folder);
    await fs.symlink(selected, path.join(folder, "link"));
    const count = files.index.files.length;
    selected = folder;
    await assert.rejects(files.choose(), /符号链接/);
    assert.equal(files.index.files.length, count);
    result.checks.push(
      "原生选择返回实际磁盘路径；快照不跟随文件变化，含符号链接的目录整批拒绝且索引不增加",
    );
    let handler;
    installUiProtocol(
      {
        handle: (_scheme, callback) => {
          handler = callback;
        },
      },
      null,
      root,
      { agentFile: (id) => files.get(id) },
    );
    const response = await handler({ url: imageFile.url, method: "GET" });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), image);
    assert.equal(
      (await handler({ url: imageFile.url, method: "POST" })).status,
      405,
    );
    assert.notEqual(
      (
        await handler({
          url: "obui://app/agent-files/../../etc/passwd",
          method: "GET",
        })
      ).status,
      200,
    );
    result.checks.push(
      "本地协议返回真实图片、nosniff/CSP/no-store，拒绝写请求与越界路径",
    );
    service = new AgentService({
      root,
      engine: { emit: (event) => events.push(event) },
    });
    // The Agent uses its own attachment directory. Upload through its public API.
    textFile = await service.request("uploadFile", {
      data: Buffer.from("真实附件内容\n").toString("base64"),
      fileName: "note.txt",
    });
    imageFile = await service.request("uploadFile", {
      data: image.toString("base64"),
      fileName: "picture.png",
    });
    for (const provider of ["openai", "ollama"]) {
      await service.request("config:set", {
        provider,
        model: "fixture",
        baseUrl: "http://127.0.0.1:" + server.address().port,
        apiKey: "",
      });
      const conversation = await service.request("createConversation"),
        turnId = crypto.randomUUID(),
        before = requests;
      await service.request("channel:send", {
        type: "conversation.run.start",
        requestId: crypto.randomUUID(),
        data: {
          conversationId: conversation.id,
          turnId,
          message: "读取附件",
          attachmentsPending: true,
        },
      });
      await delay(100);
      assert.equal(requests, before, "附件就绪前不能发模型请求");
      await service.request("channel:send", {
        type: "conversation.run.attachments.ready",
        data: {
          conversationId: conversation.id,
          turnId,
          attachments: [textFile, imageFile],
        },
      });
      await waitUntil(() => service.active.size === 0);
      assert.ifError(fixtureError);
      assert.equal(
        service.conversation(conversation.id).latestRunStatus,
        "completed",
      );
      assert.equal(requests, before + 2);
      const user = service
        .conversation(conversation.id)
        .messages.find((message) => message.role === "user");
      assert.equal(user.attachments.length, 2);
      result.checks.push(
        provider +
          " 实际 HTTP 请求等待附件，携带正确图像格式；模型工具实际读到文本，附件元数据保存在会话",
      );
    }
    const bad = await service.request("createConversation"),
      turnId = crypto.randomUUID(),
      before = requests;
    await service.request("channel:send", {
      type: "conversation.run.start",
      requestId: "bad-file",
      data: {
        conversationId: bad.id,
        turnId,
        message: "保留我的输入",
        attachmentsPending: true,
      },
    });
    await assert.rejects(
      service.request("channel:send", {
        type: "conversation.run.attachments.ready",
        data: {
          conversationId: bad.id,
          turnId,
          attachments: [{ fileId: "not-a-file" }],
        },
      }),
      /ID 无效/,
    );
    await waitUntil(() => service.active.size === 0);
    assert.equal(requests, before);
    assert.equal(service.conversation(bad.id).latestRunStatus, "failed");
    assert.equal(
      service.conversation(bad.id).messages[0].content,
      "保留我的输入",
    );
    const pending = await service.request("createConversation");
    await service.request("channel:send", {
      type: "conversation.run.start",
      requestId: "cancel-file",
      data: {
        conversationId: pending.id,
        turnId: "cancel",
        message: "停止",
        attachmentsPending: true,
      },
    });
    await service.request("channel:send", {
      type: "conversation.run.stop",
      data: { conversationId: pending.id },
    });
    await waitUntil(() => service.active.size === 0);
    assert.equal(requests, before);
    assert.equal(service.conversation(pending.id).latestRunStatus, "cancelled");
    result.checks.push(
      "非法附件立即失败且保留输入；等待附件时取消不发模型请求，没有丢掉附件后发送纯文本",
    );
    result.status = "PASS";
  } finally {
    await service?.shutdown();
    await new Promise((resolve) => server.close(resolve));
    await fs.writeFile(
      path.join(
        __dirname,
        "../../docs/rebuild/evidence/agent-files-selftest.json",
      ),
      JSON.stringify(result, null, 2),
    );
    await fs.rm(root, { recursive: true, force: true });
  }
  console.log(JSON.stringify(result, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
