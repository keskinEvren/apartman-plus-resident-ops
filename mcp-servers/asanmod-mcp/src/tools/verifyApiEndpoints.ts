/**
 * Tool: asanmod_verify_api_endpoints
 * API endpoint kontrolü (health check, critical endpoints)
 */

import { execSync } from "child_process";

export interface ApiEndpointsResult {
  success: boolean;
  endpoints: Array<{
    url: string;
    status: "healthy" | "unhealthy" | "skipped";
    responseTime?: number;
    error?: string;
  }>;
  unhealthy: number;
  error?: string;
}

export async function verifyApiEndpoints(
  environment?: "dev" | "prod"
): Promise<ApiEndpointsResult> {
  const endpoints: ApiEndpointsResult["endpoints"] = [];
  let unhealthy = 0;

  try {
    const baseUrl =
      environment === "prod"
        ? (process.env.ASANMOD_API_BASE_PROD || "https://asanmod.example.com")
        : environment === "dev"
          ? (process.env.ASANMOD_API_BASE_DEV || "http://localhost:8202")
          : (process.env.ASANMOD_API_BASE_LOCAL || "http://localhost:8202");

    const healthEndpoints = [
      `${baseUrl}/api/v1/health`,
      `${baseUrl}/api/v1/auth/health`,
    ];

    for (const url of healthEndpoints) {
      try {
        const startTime = Date.now();
        const response = execSync(
          `curl -s -o /dev/null -w "%{http_code}" "${url}" --max-time 5`,
          {
            encoding: "utf-8",
          }
        );
        const responseTime = Date.now() - startTime;
        const statusCode = parseInt(response, 10);

        if (statusCode >= 200 && statusCode < 300) {
          endpoints.push({
            url,
            status: "healthy",
            responseTime,
          });
        } else {
          unhealthy++;
          endpoints.push({
            url,
            status: "unhealthy",
            responseTime,
            error: `HTTP ${statusCode}`,
          });
        }
      } catch (err: any) {
        unhealthy++;
        endpoints.push({
          url,
          status: "unhealthy",
          error: err.message || "Request failed",
        });
      }
    }

    return {
      success: unhealthy === 0,
      endpoints,
      unhealthy,
    };
  } catch (err: any) {
    return {
      success: false,
      endpoints: [],
      unhealthy: 0,
      error: err.message || "API endpoints check failed",
    };
  }
}
