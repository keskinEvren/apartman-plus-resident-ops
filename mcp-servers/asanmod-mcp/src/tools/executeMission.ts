import { qualityGate } from "./qualityGate.js";
import { infrastructureCheck } from "./infrastructureCheck.js";
import { securityAudit } from "./securityAudit.js";

/**
 * ASANMOD v5.0 Master Execute Mission
 * [ULTRA CORE] Coordinates all Big 5 checks in a single atomical operation.
 */
export const executeMission = async (params: any) => {
  const { path = ".", fix = false, missionType = "full" } = params;

  const results: any = {
    quality: null,
    infrastructure: null,
    security: null,
    overallSuccess: true,
  };

  try {
    // 1. Quality Gate
    results.quality = await qualityGate({ type: "all", fix, path });
    if (!results.quality.success) results.overallSuccess = false;

    // 2. Infrastructure Check
    results.infrastructure = await infrastructureCheck({ target: "all" });
    if (!results.infrastructure.success) results.overallSuccess = false;

    // 3. Security Audit (Optional for some missions)
    if (missionType === "full" || missionType === "security") {
      results.security = await securityAudit({ check: "all", path });
      if (!results.security.success) results.overallSuccess = false;
    }

    return results;
  } catch (error: any) {
    return {
      success: false,
      error: `Mission failed: ${error.message}`,
      results,
    };
  }
};
