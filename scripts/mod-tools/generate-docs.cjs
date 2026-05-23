#!/usr/bin/env node

/**
 * ASANMOD v1.1.1 - Documentation Generator
 *
 * Generates human-readable MD files from JSON configs.
 * This ensures MD files are always in sync with the source of truth.
 *
 * Usage: node scripts/mod-tools/generate-docs.cjs
 */

const fs = require("fs");
const path = require("path");

const CONFIG_DIR = path.join(__dirname, "../../docs/config");
const GENERATED_DIR = path.join(__dirname, "../../docs/generated");

// Ensure generated directory exists
if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

function loadJSON(filename) {
  const filepath = path.join(CONFIG_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.error(`❌ File not found: ${filepath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filepath, "utf-8"));
}

function generateQuickRef() {
  const config = loadJSON("asanmod-config.json");
  const protocol = loadJSON("agent-protocol.json");

  if (!config || !protocol) return;

  let md = `<!--
ASANMOD v1.1.1${config.version} - AUTO-GENERATED
DO NOT EDIT MANUALLY - Edit docs/config/*.json instead
Generated: ${new Date().toISOString()}
-->

# AGENT QUICK REFERENCE (v${config.version})

> **Auto-generated from:** \`docs/config/asanmod-config.json\`

---

## 🔒 HARD CONSTRAINTS

| ID | Rule | Enforcement | Severity |
|----|------|-------------|----------|
`;

  for (const hc of config.hardConstraints) {
    md += `| ${hc.id} | ${hc.name} | \`${hc.enforcement}\` | ${hc.severity} |\n`;
  }

  md += `
---

## ⚡ COMMANDS

| Command | Description |
|---------|-------------|
`;

  for (const [name, cmd] of Object.entries(config.commands)) {
    md += `| \`${cmd.cmd}\` | ${cmd.description} |\n`;
  }

  md += `
---

## 🌐 NETWORK

### Development
| Service | Port |
|---------|------|
| Frontend | ${config.network.dev.frontend} |
| Backend | ${config.network.dev.backend} |

### Production
| Service | Port |
|---------|------|
| Frontend | ${config.network.prod.frontend} |
| Backend | ${config.network.prod.backend} |
| Brain | ${config.network.prod.brain} |

---

## 🚫 FORBIDDEN PATTERNS

| Pattern | Reason | Severity |
|---------|--------|----------|
`;

  for (const fp of config.forbiddenPatterns) {
    md += `| \`${fp.pattern}\` | ${fp.reason} | ${fp.severity} |\n`;
  }

  md += `
---

## 📁 CRITICAL PATHS

| Key | Path |
|-----|------|
`;

  for (const [key, val] of Object.entries(config.paths)) {
    md += `| ${key} | \`${val}\` |\n`;
  }

  md += `
---

## 📋 START SEQUENCE

`;

  for (const step of protocol.startSequence) {
    md += `${step.step}. \`${step.action}("${step.target || step.message}")\`\n`;
  }

  md += `
---

**Generated:** ${new Date().toISOString().split("T")[0]} | **Source:** \`docs/config/asanmod-config.json\`
`;

  const outputPath = path.join(GENERATED_DIR, "AGENT_QUICK_REF.md");
  fs.writeFileSync(outputPath, md);
  console.log(`✅ Generated: ${outputPath}`);
}

function generateContextPacksRef() {
  const packs = loadJSON("context-packs.json");

  if (!packs) return;

  let md = `<!--
ASANMOD v1.1.1${packs.version} - AUTO-GENERATED
DO NOT EDIT MANUALLY - Edit docs/config/context-packs.json instead
Generated: ${new Date().toISOString()}
-->

# CONTEXT PACKS REFERENCE (v${packs.version})

> **Auto-generated from:** \`docs/config/context-packs.json\`

---

`;

  for (const [name, pack] of Object.entries(packs.packs)) {
    md += `## ${pack.name}

**Keywords:** ${pack.keywords.map((k) => `\`${k}\``).join(", ")}

**Critical Paths:**
${pack.criticalPaths.map((p) => `- \`${p}\``).join("\n")}

**Risk Areas:** ${pack.riskAreas.join(", ")}

**Max Read Budget:** ${pack.maxReadBudget} files

---

`;
  }

  md += `
**Auto-detect:** \`node scripts/mod-tools/context-autoload.cjs "<task>"\`
`;

  const outputPath = path.join(GENERATED_DIR, "CONTEXT_PACKS.md");
  fs.writeFileSync(outputPath, md);
  console.log(`✅ Generated: ${outputPath}`);
}

function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  📄 ASANMOD v1.1.1 DOCUMENTATION GENERATOR                ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  console.log("");

  generateQuickRef();
  generateContextPacksRef();

  console.log("");
  console.log("✅ All documentation generated successfully!");
  console.log(`📁 Output: ${GENERATED_DIR}`);
}

main();
