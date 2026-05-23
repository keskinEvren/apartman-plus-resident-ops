/**
 * Tool: PM2 Management Tools
 * PM2 process yönetimi (restart, stop, start, logs)
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export interface PM2ActionResult {
  success: boolean;
  process: string;
  action: "restart" | "stop" | "start";
  message?: string;
  error?: string;
}

export interface PM2LogsResult {
  success: boolean;
  process: string;
  logType: "out" | "error" | "both";
  lines: number;
  logs?: string[];
  error?: string;
}

const PM2_LOG_DIR = "/root/.pm2/logs";

/**
 * PM2 process restart with environment variable update
 *
 * ⚠️ CRITICAL: PM2 `restart` does NOT update environment variables from config file.
 * This function uses stop/start to ensure environment variables are updated.
 */
export async function restartPM2Process(
  processName: string
): Promise<PM2ActionResult> {
  try {
    // Validate process name
    const validProcesses = [
      "asanmod-dev-backend",
      "asanmod-dev-frontend",
      "asanmod-prod-backend",
      "asanmod-prod-frontend",
      "asanmod-brain",
    ];

    if (!validProcesses.includes(processName)) {
      return {
        success: false,
        process: processName,
        action: "restart",
        error: `Invalid process name. Valid: ${validProcesses.join(", ")}`,
      };
    }

    // CRITICAL: Use stop/start instead of restart to update environment variables
    // PM2 restart does NOT update env vars from ecosystem.config.cjs
    const projectRoot = process.cwd();
    const configFile = path.join(projectRoot, "ecosystem.config.cjs");

    // Check if config file exists
    if (!fs.existsSync(configFile)) {
      // Fallback to simple restart if config not found
      execSync(`pm2 restart ${processName}`, {
        encoding: "utf-8",
        timeout: 10000,
      });
      return {
        success: true,
        process: processName,
        action: "restart",
        message: `Process ${processName} restarted (config file not found, using simple restart)`,
      };
    }

    // Stop process
    execSync(`pm2 stop ${processName}`, {
      encoding: "utf-8",
      timeout: 10000,
    });

    // Start from config (this updates environment variables)
    execSync(`pm2 start ${configFile} --only ${processName}`, {
      encoding: "utf-8",
      timeout: 10000,
      cwd: projectRoot,
    });

    return {
      success: true,
      process: processName,
      action: "restart",
      message: `Process ${processName} restarted with environment variable update`,
    };
  } catch (err: any) {
    // Fallback to simple restart on error
    try {
      execSync(`pm2 restart ${processName}`, {
        encoding: "utf-8",
        timeout: 10000,
      });
      return {
        success: true,
        process: processName,
        action: "restart",
        message: `Process ${processName} restarted (fallback to simple restart)`,
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        process: processName,
        action: "restart",
        error: err.message || fallbackErr.message || "PM2 restart failed",
      };
    }
  }
}

/**
 * PM2 process stop
 */
export async function stopPM2Process(
  processName: string
): Promise<PM2ActionResult> {
  try {
    const validProcesses = [
      "asanmod-dev-backend",
      "asanmod-dev-frontend",
      "asanmod-prod-backend",
      "asanmod-prod-frontend",
      "asanmod-brain",
    ];

    if (!validProcesses.includes(processName)) {
      return {
        success: false,
        process: processName,
        action: "stop",
        error: `Invalid process name. Valid: ${validProcesses.join(", ")}`,
      };
    }

    const output = execSync(`pm2 stop ${processName}`, {
      encoding: "utf-8",
      timeout: 10000,
    });

    return {
      success: true,
      process: processName,
      action: "stop",
      message: `Process ${processName} stopped successfully`,
    };
  } catch (err: any) {
    return {
      success: false,
      process: processName,
      action: "stop",
      error: err.message || "PM2 stop failed",
    };
  }
}

/**
 * PM2 process start from config file
 *
 * ⚠️ CRITICAL: Always start from ecosystem.config.cjs to ensure correct environment variables.
 */
export async function startPM2Process(
  processName: string
): Promise<PM2ActionResult> {
  try {
    const validProcesses = [
      "asanmod-dev-backend",
      "asanmod-dev-frontend",
      "asanmod-prod-backend",
      "asanmod-prod-frontend",
      "asanmod-brain",
    ];

    if (!validProcesses.includes(processName)) {
      return {
        success: false,
        process: processName,
        action: "start",
        error: `Invalid process name. Valid: ${validProcesses.join(", ")}`,
      };
    }

    const projectRoot = process.cwd();
    const configFile = path.join(projectRoot, "ecosystem.config.cjs");

    // Check if config file exists
    if (!fs.existsSync(configFile)) {
      // Fallback to simple start if config not found
      execSync(`pm2 start ${processName}`, {
        encoding: "utf-8",
        timeout: 10000,
      });
      return {
        success: true,
        process: processName,
        action: "start",
        message: `Process ${processName} started (config file not found, using simple start)`,
      };
    }

    // Start from config file (ensures correct environment variables)
    execSync(`pm2 start ${configFile} --only ${processName}`, {
      encoding: "utf-8",
      timeout: 10000,
      cwd: projectRoot,
    });

    return {
      success: true,
      process: processName,
      action: "start",
      message: `Process ${processName} started from ecosystem.config.cjs`,
    };
  } catch (err: any) {
    // Fallback to simple start on error
    try {
      execSync(`pm2 start ${processName}`, {
        encoding: "utf-8",
        timeout: 10000,
      });
      return {
        success: true,
        process: processName,
        action: "start",
        message: `Process ${processName} started (fallback to simple start)`,
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        process: processName,
        action: "start",
        error: err.message || fallbackErr.message || "PM2 start failed",
      };
    }
  }
}

/**
 * PM2 logs okuma
 *
 * ⚠️ IMPORTANT: This function is DEPRECATED. Use filesystem MCP directly instead!
 *
 * PM2 logs okuma için filesystem MCP kullanılmalı:
 * - mcp_filesystem_read_text_file({path: "/root/.pm2/logs/asanmod-dev-backend-out.log", tail: 50})
 * - mcp_filesystem_read_text_file({path: "/root/.pm2/logs/asanmod-dev-backend-error.log", tail: 50})
 *
 * Rule 0-TERMINAL: Terminal komutları ve fs.readFileSync YASAK! Filesystem MCP ZORUNLU!
 */
export async function readPM2Logs(
  processName: string,
  logType: "out" | "error" | "both" = "out",
  lines: number = 50
): Promise<PM2LogsResult> {
  try {
    const validProcesses = [
      "asanmod-dev-backend",
      "asanmod-dev-frontend",
      "asanmod-prod-backend",
      "asanmod-prod-frontend",
      "asanmod-brain",
    ];

    if (!validProcesses.includes(processName)) {
      return {
        success: false,
        process: processName,
        logType,
        lines,
        error: `Invalid process name. Valid: ${validProcesses.join(", ")}`,
      };
    }

    // ⚠️ DEPRECATED: Use filesystem MCP instead!
    // This function is kept for backward compatibility but should use filesystem MCP
    // Agent should call: mcp_filesystem_read_text_file({path: "/root/.pm2/logs/{processName}-out.log", tail: lines})

    const logs: string[] = [];

    if (logType === "out" || logType === "both") {
      const outLogPath = path.join(PM2_LOG_DIR, `${processName}-out.log`);
      if (fs.existsSync(outLogPath)) {
        const content = fs.readFileSync(outLogPath, "utf-8");
        const logLines = content.split("\n").filter((line) => line.trim());
        logs.push(...logLines.slice(-lines).map((line) => `[OUT] ${line}`));
      }
    }

    if (logType === "error" || logType === "both") {
      const errorLogPath = path.join(PM2_LOG_DIR, `${processName}-error.log`);
      if (fs.existsSync(errorLogPath)) {
        const content = fs.readFileSync(errorLogPath, "utf-8");
        const logLines = content.split("\n").filter((line) => line.trim());
        logs.push(...logLines.slice(-lines).map((line) => `[ERROR] ${line}`));
      }
    }

    // ⚠️ DEPRECATED WARNING: Bu fonksiyon fs.readFileSync kullanıyor!
    // Agent seviyesinde filesystem MCP kullanılmalı: mcp_filesystem_read_text_file({path: '/root/.pm2/logs/{processName}-out.log', tail: lines})

    return {
      success: true,
      process: processName,
      logType,
      lines,
      logs: logs.slice(-lines), // Son N satırı döndür
    };
  } catch (err: any) {
    return {
      success: false,
      process: processName,
      logType,
      lines,
      error: err.message || "PM2 logs read failed. Use filesystem MCP instead!",
    };
  }
}
