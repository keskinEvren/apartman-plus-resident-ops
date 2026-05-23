/**
 * Tool: asanmod_verify_network_connectivity
 * Network connectivity kontrolü (external services, database, Redis)
 */

import { execSync } from "child_process";

export interface NetworkConnectivityResult {
  success: boolean;
  connections: Array<{
    service: string;
    host: string;
    port: number;
    status: "connected" | "failed" | "skipped";
    error?: string;
  }>;
  failed: number;
  error?: string;
}

export async function verifyNetworkConnectivity(): Promise<NetworkConnectivityResult> {
  const connections: NetworkConnectivityResult["connections"] = [];
  let failed = 0;

  try {
    // Database connection (PostgreSQL) - Default port: 5432
    try {
      execSync("nc -z localhost 5432", {
        encoding: "utf-8",
        stdio: "ignore",
        timeout: 3000,
      });
      connections.push({
        service: "PostgreSQL",
        host: "localhost",
        port: 5432,
        status: "connected",
      });
    } catch {
      failed++;
      connections.push({
        service: "PostgreSQL",
        host: "localhost",
        port: 5432,
        status: "failed",
        error: "Connection timeout",
      });
    }

    // Redis connection - Default port: 6379
    try {
      execSync("nc -z localhost 6379", {
        encoding: "utf-8",
        stdio: "ignore",
        timeout: 3000,
      });
      connections.push({
        service: "Redis",
        host: "localhost",
        port: 6379,
        status: "connected",
      });
    } catch {
      failed++;
      connections.push({
        service: "Redis",
        host: "localhost",
        port: 6379,
        status: "failed",
        error: "Connection timeout",
      });
    }

    // MinIO connection
    try {
      execSync("nc -z localhost 8200", {
        encoding: "utf-8",
        stdio: "ignore",
        timeout: 3000,
      });
      connections.push({
        service: "MinIO",
        host: "localhost",
        port: 8200,
        status: "connected",
      });
    } catch {
      failed++;
      connections.push({
        service: "MinIO",
        host: "localhost",
        port: 8200,
        status: "failed",
        error: "Connection timeout",
      });
    }

    return {
      success: failed === 0,
      connections,
      failed,
    };
  } catch (err: any) {
    return {
      success: false,
      connections: [],
      failed: 0,
      error: err.message || "Network connectivity check failed",
    };
  }
}
