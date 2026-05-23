/**
 * Hard-Lock Verification (v3.2-SHARPEN)
 * 4 mandatory checks with certificate signatures
 * Impossible to bypass - requires actual MCP tool execution
 */

import { createHash } from "crypto";
import { writeFileSync, existsSync } from "fs";
import { join } from "path";
import { qualityGate } from "./qualityGate.js";
import { infrastructureCheck } from "./infrastructureCheck.js";
import { checkVisualUI } from "./checkVisualUI.js";
import { checkBrainConflicts } from "./checkBrainConflicts.js";
import { compactify, CompactOutput } from "./compactOutput.js";

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const CERTIFICATE_FILE = join(
  PROJECT_ROOT,
  ".state",
  "verification-certificate.json"
);

export interface VerificationChecks {
  static: {
    passed: boolean;
    signature: string;
    details: any;
    error?: string;
  };
  infrastructure: {
    passed: boolean;
    signature: string;
    details: any;
    error?: string;
  };
  visual: {
    passed: boolean;
    signature: string;
    details: any;
    error?: string;
  };
  brain: {
    passed: boolean;
    signature: string;
    details: any;
    error?: string;
  };
}

export interface HardLockVerificationResult {
  certificate: {
    timestamp: string;
    checks: VerificationChecks;
    signatures: string[]; // MCP tool execution signatures
  };
  passed: boolean; // Hard-lock: Only true if ALL signatures valid
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    allPassed: boolean;
  };
  compact?: CompactOutput;
  error?: string;
}

/**
 * Generate signature for check result
 */
function generateSignature(
  checkName: string,
  result: any,
  executionId: string
): string {
  const data = JSON.stringify({
    check: checkName,
    executionId,
    timestamp: new Date().toISOString(),
    result: result,
  });
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Hard-Lock Verification with 4 mandatory checks
 */
export async function verifyDone(
  path?: string
): Promise<HardLockVerificationResult> {
  const timestamp = new Date().toISOString();
  const executionId = createHash("md5")
    .update(`${timestamp}-${Math.random()}`)
    .digest("hex");

  const checks: VerificationChecks = {
    static: { passed: false, signature: "", details: {} },
    infrastructure: { passed: false, signature: "", details: {} },
    visual: { passed: false, signature: "", details: {} },
    brain: { passed: false, signature: "", details: {} },
  };

  try {
    // 1. Static Analysis (MANDATORY)
    const staticCheck = await qualityGate({ type: "all", fix: false, path });
    checks.static = {
      passed: staticCheck.success,
      signature: generateSignature("static", staticCheck, executionId),
      details: staticCheck,
    };

    if (!staticCheck.success) {
      return {
        certificate: {
          timestamp,
          checks,
          signatures: [checks.static.signature],
        },
        passed: false, // Hard-lock: Failed check blocks verification
        summary: {
          totalChecks: 4,
          passedChecks: 0,
          failedChecks: 1,
          allPassed: false,
        },
        error: "Static analysis check failed",
      };
    }

    // 2. Infrastructure (MANDATORY)
    const infraCheck = await infrastructureCheck({ target: "all" });
    checks.infrastructure = {
      passed: infraCheck.success,
      signature: generateSignature("infrastructure", infraCheck, executionId),
      details: infraCheck,
    };

    if (!infraCheck.success) {
      return {
        certificate: {
          timestamp,
          checks,
          signatures: [
            checks.static.signature,
            checks.infrastructure.signature,
          ],
        },
        passed: false, // Hard-lock: Failed check blocks verification
        summary: {
          totalChecks: 4,
          passedChecks: 1,
          failedChecks: 1,
          allPassed: false,
        },
        error: "Infrastructure check failed",
      };
    }

    // 3. Visual/UI (MANDATORY if frontend changes detected)
    const visualCheck = await checkVisualUI(path);
    checks.visual = {
      passed: visualCheck.success,
      signature: visualCheck.signature,
      details: visualCheck,
    };

    if (!visualCheck.success) {
      return {
        certificate: {
          timestamp,
          checks,
          signatures: [
            checks.static.signature,
            checks.infrastructure.signature,
            checks.visual.signature,
          ],
        },
        passed: false, // Hard-lock: Failed check blocks verification
        summary: {
          totalChecks: 4,
          passedChecks: 2,
          failedChecks: 1,
          allPassed: false,
        },
        error: "Visual/UI check failed",
      };
    }

    // 4. Brain Solution Check (MANDATORY)
    const brainCheck = await checkBrainConflicts(path);
    checks.brain = {
      passed: brainCheck.success,
      signature: brainCheck.signature,
      details: brainCheck,
    };

    if (!brainCheck.success) {
      return {
        certificate: {
          timestamp,
          checks,
          signatures: [
            checks.static.signature,
            checks.infrastructure.signature,
            checks.visual.signature,
            checks.brain.signature,
          ],
        },
        passed: false, // Hard-lock: Failed check blocks verification
        summary: {
          totalChecks: 4,
          passedChecks: 3,
          failedChecks: 1,
          allPassed: false,
        },
        error: "Brain conflict check failed",
      };
    }

    // All checks passed - generate certificate
    const allSignatures = [
      checks.static.signature,
      checks.infrastructure.signature,
      checks.visual.signature,
      checks.brain.signature,
    ];

    // Create compact output
    const errors: string[] = [];
    if (!checks.static.passed) errors.push("Static analysis failed");
    if (!checks.infrastructure.passed)
      errors.push("Infrastructure check failed");
    if (!checks.visual.passed) errors.push("Visual/UI check failed");
    if (!checks.brain.passed) errors.push("Brain conflict check failed");

    const compact = compactify({
      type: "verification",
      errors,
      files: 0,
      commits: 0,
      metadata: { signatures: allSignatures },
    });

    const certificate = {
      timestamp,
      checks,
      signatures: allSignatures,
    };

    // Save certificate to file for pre-commit hook validation
    try {
      const { mkdirSync } = require("fs");
      const certDir = join(PROJECT_ROOT, ".state");
      if (!existsSync(certDir)) {
        mkdirSync(certDir, { recursive: true });
      }
      writeFileSync(
        CERTIFICATE_FILE,
        JSON.stringify(certificate, null, 2),
        "utf-8"
      );
    } catch (error) {
      // Certificate file write failed - non-critical
    }

    return {
      certificate,
      passed: true, // Only if ALL 4 checks passed
      summary: {
        totalChecks: 4,
        passedChecks: 4,
        failedChecks: 0,
        allPassed: true,
      },
      compact,
    };
  } catch (error: any) {
    return {
      certificate: {
        timestamp,
        checks,
        signatures: Object.values(checks)
          .filter((c) => c.signature)
          .map((c) => c.signature),
      },
      passed: false,
      summary: {
        totalChecks: 4,
        passedChecks: 0,
        failedChecks: 4,
        allPassed: false,
      },
      error: error.message,
    };
  }
}
