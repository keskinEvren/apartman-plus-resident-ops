#!/usr/bin/env node
/**
 * ASANMOD v1.1.1: VERSION CHECK
 * Compares DEV (Git HEAD) vs PROD (version.json) deployment status.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Sonucu JSON olarak basacak
const result = {
  dev: { commit: null, date: null, branch: null },
  prod: { commit: null, date: null, version: null },
  status: "unknown", // 'synced', 'drift', 'unknown'
};

try {
  // 1. DEV BİLGİSİ (Mevcut Git HEAD)
  const gitHead = execSync("git rev-parse --short HEAD").toString().trim();
  const gitDate = execSync("git log -1 --format=%cd --date=iso")
    .toString()
    .trim();
  const gitBranch = execSync("git rev-parse --abbrev-ref HEAD")
    .toString()
    .trim();

  result.dev = {
    commit: gitHead,
    date: gitDate,
    branch: gitBranch,
  };

  // 2. PROD BİLGİSİ (public/version.json dosyasından)
  // Bu dosya Faz 3'te deploy scripti tarafından oluşturulacak.
  // Şimdilik yoksa 'null' döneceğiz.
  const versionFile = path.join(
    __dirname,
    "../../frontend/public/version.json",
  );

  if (fs.existsSync(versionFile)) {
    const prodInfo = JSON.parse(fs.readFileSync(versionFile, "utf8"));
    result.prod = prodInfo;
  } else {
    result.prod = { message: "No deployment record found (First run?)" };
  }

  // 3. KARŞILAŞTIRMA
  if (result.prod.commit) {
    if (result.prod.commit === result.dev.commit) {
      result.status = "synced";
    } else {
      result.status = "drift";
      // Fark hesabı yapılabilir (kaç commit geride vs.) - İleride eklenebilir.
    }
  }

  console.log(JSON.stringify(result));
} catch (e) {
  console.error(JSON.stringify({ error: e.message }));
}
