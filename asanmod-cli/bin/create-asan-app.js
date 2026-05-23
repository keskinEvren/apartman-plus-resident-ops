#!/usr/bin/env node
/**
 * CREATE-ASAN-APP
 * Single-command bootstrapper for ASANMOD Enterprise Template
 *
 * Usage: npx create-asan-app my-project
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectName = process.argv[2] || 'my-asan-project';
const targetDir = path.resolve(process.cwd(), projectName);

console.log('\n🚀 ASANMOD v1.0.0: Bootstrapping Enterprise Template...\n');

// Step 1: Clone template
console.log('📦 Step 1/5: Cloning template...');
try {
  // For now, copy from local (in production, use git clone or degit)
  const templateDir = path.join(__dirname, '../[PROJECT_NAME]');
  if (!fs.existsSync(templateDir)) {
    console.error('❌ Template directory not found. Run this from the packages directory.');
    process.exit(1);
  }

  execSync(`cp -r ${templateDir} ${targetDir}`, { stdio: 'inherit' });
  console.log('✅ Template cloned\n');
} catch (error) {
  console.error('❌ Failed to clone template:', error.message);
  process.exit(1);
}

// Step 2: Install dependencies
console.log('📦 Step 2/5: Installing dependencies...');
try {
  execSync('npm install', { cwd: targetDir, stdio: 'inherit' });
  console.log('✅ Dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Step 3: Link CLI globally (optional)
console.log('🔗 Step 3/5: Setting up ASANMOD CLI...');
try {
  execSync('npm link', { cwd: path.join(__dirname, '../asanmod-cli'), stdio: 'inherit' });
  console.log('✅ CLI linked globally\n');
} catch (error) {
  console.warn('⚠️  CLI linking skipped (may require sudo)\n');
}

// Step 4: Initialize project
console.log('⚙️  Step 4/5: Running asan init...');
try {
  const initScript = path.join(targetDir, 'scripts/mod-tools/asan-init.js');
  execSync(`node ${initScript}`, { cwd: targetDir, stdio: 'inherit' });
  console.log('✅ Project initialized\n');
} catch (error) {
  console.error('❌ Initialization failed:', error.message);
  process.exit(1);
}

// Step 5: Final instructions
console.log('🎉 Step 5/5: Setup complete!\n');
console.log('━'.repeat(60));
console.log('📂 Project created at:', targetDir);
console.log('━'.repeat(60));
console.log('\n📋 Next Steps:\n');
console.log(`1. cd ${projectName}`);
console.log('2. Edit .env and set DATABASE_URL');
console.log('3. npm run db:generate');
console.log('4. npm run db:migrate');
console.log('5. npm run dev\n');
console.log('━'.repeat(60));
console.log('🧙‍♂️ Ghost-Dev Protocol Active');
console.log('━'.repeat(60));
console.log('\n💡 For autonomous setup, run: asan wizard\n');
