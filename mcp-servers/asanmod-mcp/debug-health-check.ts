import { qualityGate } from "./src/tools/qualityGate.js";
import { securityAudit } from "./src/tools/securityAudit.js";
import { infrastructureCheck } from "./src/tools/infrastructureCheck.js";
import { getTodos } from "./src/tools/getTodos.js";

async function testNewTools() {
  console.log("\n🚀 Starting AsanMod v3.1-ULTRA Verification...");

  // 1. Test Quality Gate (Lint)
  console.log("\n🧪 Testing Quality Gate (Lint)...");
  try {
    const qRes = await qualityGate({
      type: "lint",
      path: "src/tools/verifySecurity.ts",
    });
    console.log("PASS: Quality Gate lint check executed.");
    // console.log(JSON.stringify(qRes, null, 2));
  } catch (e) {
    console.error("FAIL: Quality Gate lint check", e);
  }

  // 2. Test Security Audit
  console.log("\n🧪 Testing Security Audit...");
  try {
    const sRes = await securityAudit({ check: "secrets" });
    console.log(
      `PASS: Security Audit executed. Found ${sRes.vulnerabilities} vulnerabilities.`
    );
    if (sRes.vulnerabilities > 0) {
      console.log(
        "Vulnerabilities found (Expected if strict mode is working):"
      );
      sRes.details.security.issues.forEach((i: any) =>
        console.log(` - ${i.file}:${i.line} [${i.issue}]`)
      );
    }
  } catch (e) {
    console.error("FAIL: Security Audit", e);
  }

  // 3. Test Infra Check
  console.log("\n🧪 Testing Infrastructure Check...");
  try {
    const iRes = await infrastructureCheck({ target: "pm2" });
    console.log(
      `PASS: Infra Check executed. PM2 status: ${iRes.success ? "OK" : "Issues found"}`
    );
  } catch (e) {
    console.error("FAIL: Infra Check", e);
  }

  // 4. Test Ultra Todo
  console.log("\n🧪 Testing Ultra Todo...");
  try {
    const tRes = await getTodos(".");
    console.log(`PASS: Ultra Todo executed. Found ${tRes.count} items.`);
    console.log("Counts by type:", tRes.countsByType);
  } catch (e) {
    console.error("FAIL: Ultra Todo", e);
  }

  console.log("\n✅ Verification Complete.");
}

testNewTools();
