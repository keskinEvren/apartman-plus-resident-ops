#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const net = require("net");

const ROOT = path.resolve(__dirname, "../..");
const CORE_PATH = path.join(ROOT, "docs", "asanmod-core.json");
const ENV_EXAMPLE_PATH = path.join(ROOT, ".env.example");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n");
}

function isPortOpenable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function findAvailablePort(startPort, exclude = new Set()) {
  let cursor = Number(startPort) || 3000;
  const max = cursor + 200;
  while (cursor <= max) {
    if (!exclude.has(cursor) && (await isPortOpenable(cursor))) {
      return cursor;
    }
    cursor += 1;
  }
  throw new Error(`No available port found from ${startPort} to ${max}`);
}

function readEnvFileOrExample(envPath) {
  if (fs.existsSync(envPath)) return fs.readFileSync(envPath, "utf8");
  if (!fs.existsSync(ENV_EXAMPLE_PATH)) return "";
  return fs.readFileSync(ENV_EXAMPLE_PATH, "utf8");
}

function setEnvVar(content, key, value) {
  const serialized = `${key}=${value}`;
  const lineRe = new RegExp(`^\\s*${key}=.*$`, "m");
  if (lineRe.test(content)) {
    return content.replace(lineRe, serialized);
  }
  return content.endsWith("\n")
    ? `${content}${serialized}\n`
    : `${content}\n${serialized}\n`;
}

function parseEnv(content) {
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line
      .slice(eq + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1");
    env[key] = value;
  }
  return env;
}

function toDbName(projectName) {
  return `${(projectName || "asanmod").toLowerCase().replace(/[^a-z0-9]/g, "_")}_db`;
}

function ensureCoreModel(core) {
  core.network = core.network || {};
  core.network.dev = core.network.dev || {};
  core.network.prod = core.network.prod || {};
  core.network.dev.binding = core.network.dev.binding || "0.0.0.0";
  core.network.prod.binding = core.network.prod.binding || "127.0.0.1";
}

async function synchronizePortsAndEnv(options = {}) {
  const {
    projectName = "ASANMOD Project",
    projectDescription = "AI-responsive application",
    envPath = path.join(ROOT, ".env"),
    preferredPorts = null,
  } = options;

  if (!fs.existsSync(CORE_PATH)) {
    throw new Error("missing docs/asanmod-core.json");
  }

  const core = readJson(CORE_PATH);
  ensureCoreModel(core);

  const configuredDev = Number(core.network.dev.frontend) || 3000;
  const configuredProd = Number(core.network.prod.frontend) || 3002;

  const exclude = new Set();
  const wantDev = Number(preferredPorts?.dev || configuredDev);
  const wantProd = Number(preferredPorts?.prod || configuredProd);
  let devPort = wantDev;
  let prodPort = wantProd;
  let probeMode = "active";

  try {
    devPort = await findAvailablePort(wantDev, exclude);
    exclude.add(devPort);
    prodPort = await findAvailablePort(wantProd, exclude);
  } catch {
    // Some sandboxes block socket bind checks. Fall back to deterministic configured ports.
    probeMode = "fallback-configured";
    devPort = wantDev;
    prodPort = wantProd === wantDev ? wantDev + 1 : wantProd;
  }

  core.name = projectName;
  core.description = projectDescription;
  core.network.dev.frontend = devPort;
  core.network.dev.backend = devPort;
  core.network.prod.frontend = prodPort;
  core.network.prod.backend = prodPort;
  core.lastUpdated = new Date().toISOString();
  writeJson(CORE_PATH, core);

  let envContent = readEnvFileOrExample(envPath);
  const envNow = parseEnv(envContent);
  const existingDb = envNow.DATABASE_URL || "";
  const dbName = toDbName(projectName);
  const defaultDbUrl = `postgresql://postgres:postgres@localhost:5432/${dbName}`;

  const useDefaultDb =
    !existingDb ||
    existingDb.includes("/dbname") ||
    existingDb.includes("user:password") ||
    existingDb.includes("localhost:5432/postgres");

  envContent = setEnvVar(envContent, "PORT", `${devPort}`);
  envContent = setEnvVar(
    envContent,
    "NEXT_PUBLIC_APP_URL",
    `"http://localhost:${devPort}"`,
  );
  envContent = setEnvVar(
    envContent,
    "NEXTAUTH_URL",
    `"http://localhost:${devPort}"`,
  );
  envContent = setEnvVar(
    envContent,
    "NEXT_PUBLIC_API_URL",
    `"http://localhost:${devPort}/api"`,
  );
  envContent = setEnvVar(
    envContent,
    "DATABASE_URL",
    `"${useDefaultDb ? defaultDbUrl : existingDb}"`,
  );

  fs.writeFileSync(envPath, envContent);

  return {
    envPath: path.relative(ROOT, envPath),
    corePath: path.relative(ROOT, CORE_PATH),
    ports: { dev: devPort, prod: prodPort },
    databaseUrl: useDefaultDb ? defaultDbUrl : existingDb,
    probeMode,
  };
}

module.exports = {
  synchronizePortsAndEnv,
  findAvailablePort,
  parseEnv,
};
