#!/usr/bin/env node
/**
 * dispatch_audit.mjs — Tổng đài quét 3 tầng Skills (Global + Plugin + Built-in) & 27 MCP Servers (version.5.2.0.0)
 */
import fs from "node:fs";
import path from "node:path";

const PYTHON_MANDATORY_SKILLS = new Set([
  "google-antigravity-sdk",
  "run-workflow",
  "ios-pentesting-skill",
  "ag-docs-sync",
  "python-fastapi-pro",
  "managing-python-dependencies",
  "background-worker-celery",
]);

export function discoverEcosystem({
  globalDir = "~/.gemini\\config\\skills",
  pluginsDir = "~/.gemini\\config\\plugins",
  builtinDir = "~/.gemini\\antigravity\\builtin\\skills",
  mcpDir = "~/.gemini\\antigravity\\mcp",
} = {}) {
  const seen = new Set();
  const skills = [];

  const addSkill = (skillMd, tier) => {
    if (!fs.existsSync(skillMd)) return;
    const text = fs.readFileSync(skillMd, "utf8");
    const m = text.match(/^name:\s*(.+)$/m);
    const id = m ? m[1].trim().replace(/^["']|["']$/g, "") : path.basename(path.dirname(skillMd));
    if (seen.has(id)) return;
    seen.add(id);
    skills.push({
      id,
      tier,
      runtimePolicy: PYTHON_MANDATORY_SKILLS.has(id) ? "python-preserved" : "nodejs-default",
      path: skillMd,
    });
  };

  if (fs.existsSync(globalDir)) {
    for (const d of fs.readdirSync(globalDir, { withFileTypes: true })) {
      if (d.isDirectory()) addSkill(path.join(globalDir, d.name, "SKILL.md"), "global");
    }
  }
  if (fs.existsSync(pluginsDir)) {
    for (const p of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
      if (!p.isDirectory()) continue;
      const sRoot = path.join(pluginsDir, p.name, "skills");
      if (!fs.existsSync(sRoot)) continue;
      for (const s of fs.readdirSync(sRoot, { withFileTypes: true })) {
        if (s.isDirectory()) addSkill(path.join(sRoot, s.name, "SKILL.md"), `plugin:${p.name}`);
      }
    }
  }
  if (fs.existsSync(builtinDir)) {
    for (const b of fs.readdirSync(builtinDir, { withFileTypes: true })) {
      if (b.isDirectory()) addSkill(path.join(builtinDir, b.name, "SKILL.md"), "builtin");
    }
  }

  const mcpServers = {};
  if (fs.existsSync(mcpDir)) {
    for (const srv of fs.readdirSync(mcpDir, { withFileTypes: true })) {
      if (srv.isDirectory()) {
        mcpServers[srv.name] = fs
          .readdirSync(path.join(mcpDir, srv.name))
          .filter((f) => f.endsWith(".json"))
          .map((f) => path.basename(f, ".json"));
      }
    }
  }

  return {
    totalActiveSkills: skills.length,
    countsByTier: {
      global: skills.filter((s) => s.tier === "global").length,
      plugin: skills.filter((s) => s.tier.startsWith("plugin:")).length,
      builtin: skills.filter((s) => s.tier === "builtin").length,
    },
    pythonPreservedSkills: skills.filter((s) => s.runtimePolicy === "python-preserved").map((s) => s.id),
    totalMcpServers: Object.keys(mcpServers).length,
    totalMcpTools: Object.values(mcpServers).reduce((sum, arr) => sum + arr.length, 0),
  };
}

const summary = discoverEcosystem();
console.log(JSON.stringify(summary, null, 2));
