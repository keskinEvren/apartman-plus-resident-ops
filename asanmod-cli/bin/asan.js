#!/usr/bin/env node
const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const program = new Command();

const colors = {
  cyan: (msg) => `\x1b[36m${msg}\x1b[0m`,
  red: (msg) => `\x1b[31m${msg}\x1b[0m`,
  green: (msg) => `\x1b[32m${msg}\x1b[0m`,
  yellow: (msg) => `\x1b[33m${msg}\x1b[0m`
};

const pkg = require('../package.json');

// ─────────────────────────────────────────────────────────────────────────────
// CORE UTILS: Dynamic Root Resolution
// ─────────────────────────────────────────────────────────────────────────────

function findProjectRoot(startPath = process.cwd()) {
  let curr = startPath;
  while (curr !== path.parse(curr).root) {
    if (fs.existsSync(path.join(curr, 'asanmod.config.json'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return null;
}

const PROJECT_ROOT = findProjectRoot() || process.cwd();
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts/mod-tools');

function executeScript(scriptName, args = []) {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);

  if (!fs.existsSync(scriptPath)) {
    console.error(colors.red(`❌ Hata: Script bu projede bulunamadı -> ${scriptPath}`));
    console.error(colors.yellow(`   Bu proje 'asan init' ile başlatılmış mı?`));
    process.exit(1);
  }

  const isShell = scriptName.endsWith('.sh');
  const cmd = isShell ? 'bash' : 'node';
  const finalArgs = [scriptPath, ...args];

  console.log(colors.cyan(`⚡ Executing: ${cmd} ${scriptName}...`));

  const child = spawn(cmd, finalArgs, {
    stdio: 'inherit',
    cwd: PROJECT_ROOT,
    env: { ...process.env, ASAN_CLI: 'true' }
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.log(colors.red(`💀 Komut başarısız oldu. Code: ${code}`));
      process.exit(code);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI COMMANDS
// ─────────────────────────────────────────────────────────────────────────────

program
  .name('asan')
  .description('ASANMOD v1.0.0 - Autonomous Software Factory CLI')
  .version(pkg.version);

// 🔍 VERIFY
program.command('verify')
  .description('Sistem doğrulaması (0/0/0 Disiplini)')
  .action(() => executeScript('fast-verify.sh'));

// 📊 STATUS
program.command('status')
  .description('Sistem durumunu ve bariyerleri göster')
  .action(() => executeScript('v10-dashboard.cjs'));

// 🧙‍♂️ WIZARD (Ghost-Dev Entry)
program.command('wizard')
  .description('Stratejik mülakatı başlat ve projeyi mühürle')
  .action(() => executeScript('asan-wizard.js'));

// 🚀 INIT
program.command('init')
  .description('Projeyi ASANMOD standartlarına göre başlat')
  .action(() => executeScript('asan-init.js'));

// 🔧 FIX
program.command('fix')
  .description('Otomatik düzeltmeleri uygula')
  .action(() => executeScript('super-fix.sh'));

program.parse();
