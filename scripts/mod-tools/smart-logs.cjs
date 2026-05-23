const { execSync } = require("child_process");

// ASANMOD v1.1.1 - SMART LOGS (NOISE FILTER)
// Usage: node smart-logs.js --process=<name|all> --lines=<n>

const args = process.argv.slice(2);
const processArg = args.find((a) => a.startsWith("--process="));
const linesArg = args.find((a) => a.startsWith("--lines="));

const proc = processArg ? processArg.split("=")[1] : "all";
const lines = linesArg ? linesArg.split("=")[1] : "50";

console.log(`👁️ SENTINEL LOGS: Process=${proc} Lines=${lines} (Errors Only)`);

try {
  // PM2 Logs with grep for Error/Exception/Fail
  // Note: pm2 logs command streams, so we use 'pm2 logs --nostream --lines X'
  // But pm2 logs might not support --nostream efficiently for grep.
  // Better to read pm2 files directly or use 'pm2 logs --lines X --nostream'

  const cmd = `pm2 logs ${proc === "all" ? "" : proc} --lines ${lines} --nostream`;
  const output = execSync(cmd, { encoding: "utf8" });

  const filtered = output.split("\n").filter((line) => {
    const lower = line.toLowerCase();
    return (
      lower.includes("error") ||
      lower.includes("exception") ||
      lower.includes("fail") ||
      lower.includes("fatal")
    );
  });

  if (filtered.length === 0) {
    console.log("✅ No specific errors found in recent logs.");
  } else {
    console.log(filtered.join("\n"));
  }
} catch (e) {
  console.log("⚠️ Could not retrieve logs or pm2 not running.");
  // console.error(e.message);
}
