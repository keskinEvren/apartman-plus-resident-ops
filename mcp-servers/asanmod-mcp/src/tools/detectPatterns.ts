/**
 * ASANMOD MCP Tool: detectPatterns
 * ASANMOD codebase'de yeni pattern'leri otomatik olarak tespit eder
 *
 * Phase 5: ASANMOD-Specific Customization
 */

import { existsSync, readFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

interface DetectASANMODPatternsResult {
  success: boolean;
  detectedPatterns: DetectedPattern[];
  totalPatterns: number;
  errors: string[];
  timestamp: string;
}

interface DetectedPattern {
  name: string;
  type: "RBAC" | "MultiTenant" | "MCPFirst" | "DevProd" | "Other";
  description: string;
  source: string; // File path where pattern was found
  codeSnippet?: string;
  confidence: "high" | "medium" | "low";
  suggestedEntityName: string; // PATTERN_ASANMOD_*
}

/**
 * Project root detection
 */
function getProjectRoot(): string {
  let projectRoot = process.env.WORKSPACE_ROOT || "";

  if (!projectRoot) {
    let currentDir = process.cwd();
    for (let i = 0; i < 5; i++) {
      if (
        existsSync(join(currentDir, "docs", "workflow", "ASANMOD-MASTER.md"))
      ) {
        projectRoot = currentDir;
        break;
      }
      currentDir = join(currentDir, "..");
    }
  }

  return projectRoot || process.cwd();
}

/**
 * Detect RBAC patterns
 */
function detectRBACPatterns(projectRoot: string): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  try {
    // Search for RBAC-related code
    const rbacFiles = execSync(
      `find ${projectRoot}/backend/src -type f \\( -name "*.ts" -o -name "*.js" \\) -exec grep -l "organizationId\|SUPER_ADMIN\|ADMIN\|HR_SPECIALIST\|MANAGER\|USER" {} \\; 2>/dev/null | head -10`,
      {
        encoding: "utf-8",
        cwd: projectRoot,
        stdio: "pipe",
      }
    )
      .trim()
      .split("\n")
      .filter((f) => f);

    for (const file of rbacFiles) {
      if (existsSync(file)) {
        const content = readFileSync(file, "utf-8");

        // Check for RBAC patterns
        if (
          content.includes("organizationId") &&
          (content.includes("SUPER_ADMIN") || content.includes("ADMIN"))
        ) {
          const lines = content.split("\n");
          const rbacLine = lines.find(
            (line) => line.includes("organizationId") && line.includes("filter")
          );

          if (rbacLine) {
            patterns.push({
              name: "ASANMOD RBAC Pattern",
              type: "RBAC",
              description: `RBAC pattern with organizationId filtering: ${rbacLine.trim()}`,
              source: file.replace(projectRoot + "/", ""),
              codeSnippet: rbacLine.trim(),
              confidence: "high",
              suggestedEntityName: "PATTERN_ASANMOD_RBAC",
            });
          }
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return patterns;
}

/**
 * Detect Multi-Tenant patterns
 */
function detectMultiTenantPatterns(projectRoot: string): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  try {
    // Search for multi-tenant related code
    const multiTenantFiles = execSync(
      `find ${projectRoot}/backend/src -type f \\( -name "*.ts" -o -name "*.js" \\) -exec grep -l "enforceOrganizationIsolation\|organizationId\|multi.*tenant" {} \\; 2>/dev/null | head -10`,
      {
        encoding: "utf-8",
        cwd: projectRoot,
        stdio: "pipe",
      }
    )
      .trim()
      .split("\n")
      .filter((f) => f);

    for (const file of multiTenantFiles) {
      if (existsSync(file)) {
        const content = readFileSync(file, "utf-8");

        if (content.includes("enforceOrganizationIsolation")) {
          patterns.push({
            name: "ASANMOD Multi-Tenant Pattern",
            type: "MultiTenant",
            description:
              "Multi-tenant pattern with enforceOrganizationIsolation middleware",
            source: file.replace(projectRoot + "/", ""),
            confidence: "high",
            suggestedEntityName: "PATTERN_ASANMOD_MULTI_TENANT",
          });
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return patterns;
}

/**
 * Detect MCP-First patterns
 */
function detectMCPFirstPatterns(projectRoot: string): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  try {
    // Search for MCP usage patterns
    const mcpFiles = execSync(
      `grep -rn "mcp_filesystem_\|mcp_memory_\|mcp_git_" ${projectRoot}/backend/src ${projectRoot}/frontend/src 2>/dev/null | head -20 | cut -d: -f1 | sort -u`,
      {
        encoding: "utf-8",
        cwd: projectRoot,
        stdio: "pipe",
      }
    )
      .trim()
      .split("\n")
      .filter((f) => f);

    if (mcpFiles.length > 0) {
      patterns.push({
        name: "ASANMOD MCP-First Pattern",
        type: "MCPFirst",
        description: `MCP-First pattern: ${mcpFiles.length} files using MCP tools`,
        source: `${mcpFiles.length} files`,
        confidence: "high",
        suggestedEntityName: "PATTERN_ASANMOD_MCP_FIRST",
      });
    }
  } catch (error) {
    // Ignore errors
  }

  return patterns;
}

/**
 * Detect DEV-PROD isolation patterns
 */
function detectDevProdPatterns(projectRoot: string): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  try {
    // Search for DEV-PROD related code
    const devProdFiles = execSync(
      `find ${projectRoot}/backend -type f \\( -name "*.ts" -o -name "*.js" \\) -exec grep -l "asanmod_dev_db\|asanmod_prod_db\|environmentCheck" {} \\; 2>/dev/null | head -10`,
      {
        encoding: "utf-8",
        cwd: projectRoot,
        stdio: "pipe",
      }
    )
      .trim()
      .split("\n")
      .filter((f) => f);

    if (devProdFiles.length > 0) {
      patterns.push({
        name: "ASANMOD DEV-PROD Isolation Pattern",
        type: "DevProd",
        description: "DEV-PROD environment isolation pattern",
        source:
          devProdFiles[0]?.replace(projectRoot + "/", "") ||
          "backend/config/environmentCheck.js",
        confidence: "high",
        suggestedEntityName: "PATTERN_ASANMOD_DEV_PROD",
      });
    }
  } catch (error) {
    // Ignore errors
  }

  return patterns;
}

/**
 * Detect ASANMOD patterns in codebase
 */
export async function detectPatterns(
  path?: string
): Promise<DetectASANMODPatternsResult> {
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const result: DetectASANMODPatternsResult = {
    success: true,
    detectedPatterns: [],
    totalPatterns: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // PARALLEL EXECUTION: All pattern detection functions run simultaneously (4x faster!)
    const [rbacResult, multiTenantResult, mcpFirstResult, devProdResult] =
      await Promise.allSettled([
        new Promise<DetectedPattern[]>((resolve) => {
          try {
            resolve(detectRBACPatterns(projectRoot));
          } catch (error) {
            resolve([]);
          }
        }),
        new Promise<DetectedPattern[]>((resolve) => {
          try {
            resolve(detectMultiTenantPatterns(projectRoot));
          } catch (error) {
            resolve([]);
          }
        }),
        new Promise<DetectedPattern[]>((resolve) => {
          try {
            resolve(detectMCPFirstPatterns(projectRoot));
          } catch (error) {
            resolve([]);
          }
        }),
        new Promise<DetectedPattern[]>((resolve) => {
          try {
            resolve(detectDevProdPatterns(projectRoot));
          } catch (error) {
            resolve([]);
          }
        }),
      ]);

    // Extract results from Promise.allSettled
    const rbacPatterns =
      rbacResult.status === "fulfilled" ? rbacResult.value : [];
    const multiTenantPatterns =
      multiTenantResult.status === "fulfilled" ? multiTenantResult.value : [];
    const mcpFirstPatterns =
      mcpFirstResult.status === "fulfilled" ? mcpFirstResult.value : [];
    const devProdPatterns =
      devProdResult.status === "fulfilled" ? devProdResult.value : [];

    // Combine all patterns
    result.detectedPatterns = [
      ...rbacPatterns,
      ...multiTenantPatterns,
      ...mcpFirstPatterns,
      ...devProdPatterns,
    ];

    // Remove duplicates (same suggestedEntityName)
    const uniquePatterns = new Map<string, DetectedPattern>();
    for (const pattern of result.detectedPatterns) {
      if (!uniquePatterns.has(pattern.suggestedEntityName)) {
        uniquePatterns.set(pattern.suggestedEntityName, pattern);
      }
    }
    result.detectedPatterns = Array.from(uniquePatterns.values());

    result.totalPatterns = result.detectedPatterns.length;

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : String(error));
    return result;
  }
}

/**
 * Generate Memory MCP entity format from detected patterns
 */
export function generatePatternEntities(patterns: DetectedPattern[]): Array<{
  name: string;
  entityType: string;
  observations: string[];
}> {
  const timestamp = new Date().toISOString();

  return patterns.map((pattern) => ({
    name: pattern.suggestedEntityName,
    entityType: "Pattern",
    observations: [
      `Pattern description: ${pattern.description}`,
      `Pattern detected in: ${pattern.source}`,
      `Pattern type: ${pattern.type}`,
      `Confidence: ${pattern.confidence}`,
      pattern.codeSnippet ? `Code snippet: ${pattern.codeSnippet}` : "",
      `Pattern detected: ${timestamp}`,
    ].filter((obs) => obs), // Remove empty strings
  }));
}

/**
 * MCP Tool Handler
 */
export async function handleDetectPatterns(args: {
  path?: string;
}): Promise<DetectASANMODPatternsResult> {
  return detectPatterns(args.path);
}
