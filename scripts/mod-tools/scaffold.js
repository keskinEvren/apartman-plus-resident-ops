#!/usr/bin/env node
/**
 * ASANMOD v1.1.1: SCAFFOLD ENGINE (The Golden Mold)
 * Generates files from God Templates to ensure standardization.
 *
 * Usage: node scaffold.js <type> <name> <module> [output_dir]
 * Example: node scaffold.js page UserSettings settings frontend/app/settings
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
};

const die = (msg) => {
  console.error(`${colors.red}[FATAL] ${msg}${colors.reset}`);
  process.exit(1);
};

const type = process.argv[2]; // page, component, service
const name = process.argv[3]; // e.g., UserSettings
const moduleName = process.argv[4] || "common";
const outputDirRel = process.argv[5] || ".";

if (!type || !name) {
  die("Usage: node scaffold.js <type> <name> <module> [output_dir]");
}

const rootDir = process.cwd();
const templatesDir = path.join(rootDir, "scripts/mod-tools/templates");

// Map types to template files
const templateMap = {
  page: {
    src: "frontend/Page.tsx.hbs",
    outExt: "tsx",
  },
  component: {
    src: "frontend/Component.tsx.hbs",
    outExt: "tsx",
  },
  service: {
    src: "backend/Service.ts.hbs",
    outExt: "ts",
  },
};

const tmplDef = templateMap[type];
if (!tmplDef) die(`Unknown template type: ${type}`);

const tmplPath = path.join(templatesDir, tmplDef.src);
if (!fs.existsSync(tmplPath)) die(`Template not found: ${tmplPath}`);

// Prepare replacements
// Simple handlebars-like replacement
const replacements = {
  "{{componentName}}": name,
  "{{serviceName}}": name,
  "{{moduleName}}": moduleName,
  "{{title}}": name.replace(/([A-Z])/g, " $1").trim(), // Add spaces
  "{{entityName}}": name.replace("Service", ""), // Logic guess
  "{{prismaModel}}": name.toLowerCase(), // Simple lowercase guess
};

let content = fs.readFileSync(tmplPath, "utf-8");

// Apply replacements
Object.keys(replacements).forEach((key) => {
  const val = replacements[key];
  content = content.replaceAll(key, val);
});

// Determine output path
const outputDir = path.resolve(rootDir, outputDirRel);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outFileName = `${name}.${tmplDef.outExt}`;
const outPath = path.join(outputDir, outFileName);

if (fs.existsSync(outPath)) {
  die(`Target file already exists: ${outPath}`);
}

fs.writeFileSync(outPath, content, "utf-8");
console.log(`${colors.green}✔ Generated ${type}: ${outPath}${colors.reset}`);
