/**
 * Tool: asanmod_verify_pm2_health
 * PM2 process health kontrolü (DEV/PROD)
 */

import { execSync } from "child_process";

export interface PM2HealthResult {
  success: boolean;
  processes: Array<{
    name: string;
    status: string;
    cpu?: string;
    memory?: string;
    uptime?: string;
  }>;
  offline: number;
  error?: string;
}

export async function verifyPM2Health(
  environment?: "dev" | "prod" | "both"
): Promise<PM2HealthResult> {
  const processes: PM2HealthResult["processes"] = [];
  let offline = 0;

  try {
    // PM2 list çalıştır
    const output = execSync("pm2 jlist", { encoding: "utf-8" });
    const pm2Processes = JSON.parse(output);

    for (const proc of pm2Processes) {
      const name = proc.name || "";

      // Environment filter
      if (environment === "dev" && !name.includes("dev")) continue;
      if (environment === "prod" && !name.includes("prod")) continue;
      if (environment === "both" || !environment) {
        // Both - include all asanmod processes
        if (!name.includes("asanmod")) continue;
      }

      const status = proc.pm2_env?.status || "unknown";
      const isOffline =
        status === "stopped" || status === "errored" || status === "crashed";

      if (isOffline) offline++;

      processes.push({
        name,
        status,
        cpu: proc.monit?.cpu?.toString() || "N/A",
        memory: proc.monit?.memory
          ? `${Math.round(proc.monit.memory / 1024 / 1024)}MB`
          : "N/A",
        uptime: proc.pm2_env?.pm_uptime
          ? `${Math.round((Date.now() - proc.pm2_env.pm_uptime) / 1000 / 60)}min`
          : "N/A",
      });
    }

    return {
      success: offline === 0,
      processes,
      offline,
    };
  } catch (err: any) {
    return {
      success: false,
      processes: [],
      offline: 0,
      error: err.message || "PM2 health check failed",
    };
  }
}
