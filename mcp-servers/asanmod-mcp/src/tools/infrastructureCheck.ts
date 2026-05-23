import { verifyPM2Health } from "./verifyPM2Health.js";
import { verifyDatabaseConnection } from "./verifyDatabaseConnection.js";
// Build cache verification could also go here
import { verifyBuildCache } from "./verifyBuildCache.js";

export interface InfraCheckOptions {
  target: "pm2" | "db" | "cache" | "all";
}

export interface InfraCheckResult {
  success: boolean;
  summary: string;
  details: any;
}

export async function infrastructureCheck(
  options: InfraCheckOptions
): Promise<InfraCheckResult> {
  const { target } = options;
  let success = true;
  let summaryParts: string[] = [];
  let details: any = {};

  try {
    // Paralel execution optimization: Run independent checks in parallel when target === "all"
    if (target === "all") {
      // Run all checks in parallel using Promise.allSettled
      const [pm2Result, dbResult, cacheResult] = await Promise.allSettled([
        verifyPM2Health("both").catch((error) => ({
          success: false,
          processes: [],
          offline: 999,
          error: error?.message || "PM2 health check failed",
        })),
        verifyDatabaseConnection("both").catch((error) => ({
          success: false,
          error: error?.message || "Database connection check failed",
        })),
        verifyBuildCache().catch((error) => ({
          success: false,
          error: error?.message || "Build cache check failed",
        })),
      ]);

      // Process PM2 result
      if (pm2Result.status === "fulfilled") {
        details.pm2 = pm2Result.value;
        const pm2 = pm2Result.value;
        const totalCount = pm2.processes?.length || 0;
        const onlineCount = totalCount - (pm2.offline || 0);
        const allOnline = pm2.success && pm2.offline === 0;

        if (!allOnline) {
          success = false;
          summaryParts.push(`PM2: ${onlineCount}/${totalCount} online`);
        } else {
          summaryParts.push("PM2: ALL ONLINE");
        }
      } else {
        success = false;
        details.pm2 = {
          error: pm2Result.reason?.message || "PM2 health check failed",
        };
        summaryParts.push("PM2: ERROR");
      }

      // Process DB result
      if (dbResult.status === "fulfilled") {
        details.db = dbResult.value;
        if (!dbResult.value.success) {
          success = false;
          summaryParts.push("DB: FAIL");
        } else {
          summaryParts.push("DB: CONNECTED");
        }
      } else {
        success = false;
        details.db = {
          error: dbResult.reason?.message || "Database connection check failed",
        };
        summaryParts.push("DB: ERROR");
      }

      // Process Cache result
      if (cacheResult.status === "fulfilled") {
        details.cache = cacheResult.value;
        if (!cacheResult.value.success) {
          // Cache failure rarely critical for health, but worth noting
          summaryParts.push("Cache: ISSUE");
        } else {
          summaryParts.push("Cache: OK");
        }
      } else {
        details.cache = {
          error: cacheResult.reason?.message || "Build cache check failed",
        };
        summaryParts.push("Cache: ERROR");
      }
    } else {
      // Sequential execution for single target (with error handling)
      if (target === "pm2") {
        try {
          const pm2Result = await verifyPM2Health("both").catch((error) => ({
            success: false,
            processes: [],
            offline: 999,
            error: error?.message || "PM2 health check failed",
          }));
          details.pm2 = pm2Result;
          const totalCount = pm2Result.processes?.length || 0;
          const onlineCount = totalCount - (pm2Result.offline || 0);
          const allOnline = pm2Result.success && pm2Result.offline === 0;

          if (!allOnline) {
            success = false;
            summaryParts.push(`PM2: ${onlineCount}/${totalCount} online`);
          } else {
            summaryParts.push("PM2: ALL ONLINE");
          }
        } catch (error) {
          success = false;
          details.pm2 = {
            error: error instanceof Error ? error.message : "Unknown error",
          };
          summaryParts.push("PM2: ERROR");
        }
      }

      if (target === "db") {
        try {
          const dbResult = await verifyDatabaseConnection("both").catch(
            (error) => ({
              success: false,
              error: error?.message || "Database connection check failed",
            })
          );
          details.db = dbResult;
          if (!dbResult.success) {
            success = false;
            summaryParts.push("DB: FAIL");
          } else {
            summaryParts.push("DB: CONNECTED");
          }
        } catch (error) {
          success = false;
          details.db = {
            error: error instanceof Error ? error.message : "Unknown error",
          };
          summaryParts.push("DB: ERROR");
        }
      }

      if (target === "cache") {
        try {
          const cacheResult = await verifyBuildCache().catch((error) => ({
            success: false,
            error: error?.message || "Build cache check failed",
          }));
          details.cache = cacheResult;
          if (!cacheResult.success) {
            summaryParts.push("Cache: ISSUE");
          } else {
            summaryParts.push("Cache: OK");
          }
        } catch (error) {
          details.cache = {
            error: error instanceof Error ? error.message : "Unknown error",
          };
          summaryParts.push("Cache: ERROR");
        }
      }
    }
  } catch (error) {
    success = false;
    details.error = error instanceof Error ? error.message : "Unknown error";
    summaryParts.push(`Infrastructure Check: ${details.error}`);
  }

  return {
    success,
    summary: summaryParts.join(" | "),
    details,
  };
}
