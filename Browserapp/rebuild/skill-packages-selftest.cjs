"use strict";
const fs = require("node:fs/promises"),
  os = require("node:os"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { importSkillArchive } = require("./skill-packages");
const {zip}=require("./selftest-zip.cjs");
(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-skill-"));
  try {
    const file = path.join(root, "skill.zip");
    await fs.writeFile(
      file,
      zip([
        {
          name: "demo/SKILL.md",
          content: "---\nname: local-demo\n---\nUse list_profiles.",
        },
        { name: "demo/references/help.md", content: "Local reference." },
      ]),
    );
    const row = await importSkillArchive(file, path.join(root, "installed"));
    assert.equal(row.slug, "local-demo");
    assert.equal(
      await fs.readFile(path.join(row.root, "references/help.md"), "utf8"),
      "Local reference.",
    );
    await fs.writeFile(
      file,
      zip([{ name: "../SKILL.md", content: "name: escape" }]),
    );
    await assert.rejects(
      importSkillArchive(file, path.join(root, "installed")),
      /invalid|越界/,
    );
    await fs.writeFile(
      file,
      zip([
        { name: "SKILL.md", content: "name: local-demo" },
        { name: "link", content: "/etc/passwd", mode: 0xa1ff },
      ]),
    );
    await assert.rejects(
      importSkillArchive(file, path.join(root, "installed")),
      /符号链接/,
    );
    await fs.writeFile(file, zip([{ name: "a.txt", content: "No skill" }]));
    await assert.rejects(
      importSkillArchive(file, path.join(root, "installed")),
      /SKILL.md/,
    );
    assert.equal(
      await fs.readFile(path.join(row.root, "SKILL.md"), "utf8"),
      "---\nname: local-demo\n---\nUse list_profiles.",
    );
    console.log(
      JSON.stringify(
        {
          status: "PASS",
          checks: [
            "real ZIP extraction",
            "nested references preserved",
            "path traversal rejected",
            "symlinks rejected",
            "missing manifest rejected",
            "failed install preserves existing package",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
