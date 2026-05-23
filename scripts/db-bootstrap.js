#!/usr/bin/env node
/**
 * ASANMOD Database Bootstrap
 *
 * Interactive PostgreSQL database setup
 * - Checks PostgreSQL installation
 * - Creates database
 * - Updates .env with connection string
 * - Runs migrations
 */

const { execSync } = require("child_process");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log("\n🗄️  ASANMOD Database Bootstrap\n");

  // 1. Check PostgreSQL installation
  try {
    const version = execSync("psql --version", { encoding: "utf-8" });
    console.log(`✅ PostgreSQL found: ${version.trim()}\n`);
  } catch {
    console.error("❌ PostgreSQL not installed!\n");
    console.log("Please install PostgreSQL:");
    console.log("  macOS:   brew install postgresql@14");
    console.log(
      "  Ubuntu:  sudo apt-get install postgresql postgresql-contrib",
    );
    console.log("  Windows: https://www.postgresql.org/download/windows/\n");
    process.exit(1);
  }

  // 2. Ask for database configuration
  const dbName = (await ask("Database name [asanmod_dev]: ")) || "asanmod_dev";
  const dbUser = (await ask("PostgreSQL user [postgres]: ")) || "postgres";
  const dbPassword = await ask("PostgreSQL password (leave empty if none): ");

  // 3. Create database
  console.log(`\n📦 Creating database '${dbName}'...`);
  try {
    const createCmd = dbPassword
      ? `PGPASSWORD="${dbPassword}" createdb -U ${dbUser} ${dbName}`
      : `createdb -U ${dbUser} ${dbName}`;

    execSync(createCmd, { stdio: "pipe" });
    console.log("✅ Database created successfully");
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("⚠️  Database already exists (continuing...)");
    } else {
      console.error("❌ Failed to create database:", error.message);
      console.log("\nTry creating manually:");
      console.log(`  createdb -U ${dbUser} ${dbName}\n`);
      process.exit(1);
    }
  }

  // 4. Update .env file
  console.log("\n📝 Updating .env file...");
  const dbUrl = dbPassword
    ? `postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}`
    : `postgresql://${dbUser}@localhost:5432/${dbName}`;

  const envPath = path.join(__dirname, "..", ".env");
  const envExamplePath = path.join(__dirname, "..", ".env.example");

  let envContent;
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  } else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, "utf-8");
  } else {
    console.error("❌ Neither .env nor .env.example found!");
    process.exit(1);
  }

  // Replace DATABASE_URL
  envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${dbUrl}"`);

  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env updated with DATABASE_URL");

  // 5. Run migrations
  console.log("\n🔄 Running database migrations...");
  try {
    execSync("npm run db:push", {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });
    console.log("✅ Migrations completed");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.log("\nYou can run migrations manually with:");
    console.log("  npm run db:push\n");
  }

  // Success summary
  const safeUrl = dbUrl.replace(dbPassword || "", dbPassword ? "***" : "");
  console.log("\n✅ Database bootstrap complete!\n");
  console.log(`Database: ${dbName}`);
  console.log(`Connection: ${safeUrl}\n`);
  console.log("Next steps:");
  console.log("  npm run seed      # Seed database (optional)");
  console.log("  npm run dev       # Start development server\n");

  rl.close();
}

main().catch((err) => {
  console.error("\n❌ Bootstrap failed:", err);
  process.exit(1);
});
