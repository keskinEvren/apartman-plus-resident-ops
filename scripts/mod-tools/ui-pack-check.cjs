#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const CONTRACT_PATH = path.join(
  ROOT,
  "config",
  "asanmod-universal",
  "quality-contract.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  try {
    const contract = readJson(CONTRACT_PATH);
    const failures = [];
    const ui = contract.uiPack || {};

    for (const rel of ui.requiredPaths || []) {
      const abs = path.join(ROOT, rel);
      if (!fs.existsSync(abs))
        failures.push(`missing required UI path: ${rel}`);
    }

    const uiDir = path.join(ROOT, "src/components/ui");
    if (fs.existsSync(uiDir)) {
      const count = fs
        .readdirSync(uiDir)
        .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f)).length;
      if (count < (ui.requiredUiFilesMin || 1)) {
        failures.push(
          `ui component count below minimum (${count}/${ui.requiredUiFilesMin || 1})`,
        );
      }
    }

    const globalsPath = path.join(ROOT, "src/app/globals.css");
    if (fs.existsSync(globalsPath)) {
      const css = fs.readFileSync(globalsPath, "utf8");
      for (const variable of ui.requiredCssVars || []) {
        if (!css.includes(variable)) {
          failures.push(
            `globals.css missing required css variable: ${variable}`,
          );
        }
      }
    }

    if (failures.length > 0) {
      console.error("reason: ui-pack check failed");
      console.error(
        "fix: align UI pack files/variables with quality-contract uiPack section",
      );
      console.error(
        "next: patch ui components/styles and rerun npm run ui:check",
      );
      failures.forEach((f) => console.error(`- ${f}`));
      process.exit(1);
    }

    console.log("ui-pack-check passed");
  } catch (error) {
    console.error("reason:", error.message);
    console.error("fix:", "validate quality-contract uiPack section json");
    console.error("next:", "run npm run ui:check");
    process.exit(1);
  }
}

main();
