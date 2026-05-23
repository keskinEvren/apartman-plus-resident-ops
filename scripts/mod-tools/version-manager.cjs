/**
 * ASANMOD v1.1.1: VERSION MANAGER (Master Orchestrator)
 * Single source of truth for versioning.
 *
 * v1.0.0+ ZERO-ERROR AUTOMATION
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const CONFIG = {
  CORE_FILE: path.join(process.cwd(), "docs", "asanmod-core.json"),
  PACKAGE_FILE: path.join(process.cwd(), "package.json"),
  SCRIPTS_DIR: path.join(process.cwd(), "scripts", "mod-tools"),
  DOCS_DIR: path.join(process.cwd(), "docs"),
  ROOT_PROTOS: [
    "GEMINI.md",
    "CURSOR.md",
    "CLAUDE.md",
    "README.md",
    "project.mdc",
    "AGENT_FIRST_PLAN.md",
  ],
};

/**
 * Standardized Regex Patterns
 */
const PATTERNS = {
  PRODUCT: /v2\.0\.\d+/g,
  PROTOCOL: /v1\.1\.1/g, // We keep Protocol stable at 1.1.1 for now
  SCRIPT_HEADER: /# ASANMOD v2\.0\.\d+/g,
  DOC_VERSION: /Version: v2\.0\.\d+/g,
  MDC_VERSION: /VERSION: v2\.0\.\d+/g,
};

/**
 * Read core config
 */
function readJSON(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

/**
 * Get current version from package.json
 */
function getVersion() {
  const pkg = readJSON(CONFIG.PACKAGE_FILE);
  return pkg.version;
}

/**
 * Bump patch version (v3.0.0x -> v3.0.0x+1)
 */
function bumpVersion() {
  const pkg = readJSON(CONFIG.PACKAGE_FILE);
  const oldVersion = pkg.version;
  const parts = oldVersion.split(".");
  parts[2] = parseInt(parts[2]) + 1;
  const newVersion = parts.join(".");

  pkg.version = newVersion;
  fs.writeFileSync(CONFIG.PACKAGE_FILE, JSON.stringify(pkg, null, 2) + "\n");

  // Update asanmod-core.json generator reference
  const core = readJSON(CONFIG.CORE_FILE);
  if (core) {
    core._meta.generator = `ASANMOD Enterprise Template v${newVersion}`;
    core.lastUpdated = new Date().toISOString();
    fs.writeFileSync(CONFIG.CORE_FILE, JSON.stringify(core, null, 2) + "\n");
  }

  return { oldVersion, newVersion };
}

/**
 * Mass Replace in Files
 */
function syncAll(newVersion) {
  const searchPattern = /2\.0\.\d+/g;
  const replacement = newVersion;

  console.log(`🚀 Starting Global Sync for v${newVersion}...`);

  // 1. Root Protocols
  CONFIG.ROOT_PROTOS.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, "utf-8");
      content = content.replace(searchPattern, replacement);
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ ${file}`);
    }
  });

  // 2. Documentation Folder
  fs.readdirSync(CONFIG.DOCS_DIR).forEach((file) => {
    if (file.endsWith(".md") || file.endsWith(".json")) {
      const filePath = path.join(CONFIG.DOCS_DIR, file);
      let content = fs.readFileSync(filePath, "utf-8");
      content = content.replace(searchPattern, replacement);
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ docs/${file}`);
    }
  });

  // 3. Script Headers
  fs.readdirSync(CONFIG.SCRIPTS_DIR).forEach((file) => {
    const filePath = path.join(CONFIG.SCRIPTS_DIR, file);
    if (fs.lstatSync(filePath).isFile()) {
      let content = fs.readFileSync(filePath, "utf-8");
      content = content.replace(searchPattern, replacement);
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ scripts/mod-tools/${file}`);
    }
  });

  console.log(`\n🎉 100% Consistent at v${newVersion}`);
}

// CLI
const action = process.argv[2];

if (action === "bump") {
  const { oldVersion, newVersion } = bumpVersion();
  console.log(`✅ Bumped package.json: ${oldVersion} -> ${newVersion}`);
  syncAll(newVersion);
} else if (action === "sync") {
  const current = getVersion();
  syncAll(current);
} else {
  console.log("Usage: node version-manager.cjs [bump|sync]");
}
