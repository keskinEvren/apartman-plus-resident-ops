/**
 * ASANMOD MCP Tool: automaticPatternLearning
 * Commit'lerden ve codebase değişikliklerinden otomatik olarak pattern'leri öğrenir ve Memory MCP'ye kaydeder
 *
 * Seviye 2: Pattern Learning Otomasyonu
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

interface AutomaticPatternLearningResult {
  success: boolean;
  commitHash: string;
  patternsDetected: DetectedPattern[];
  patternsLearned: number;
  patternsCreated: number;
  memoryObservationsFormat: Array<{
    entityName: string;
    contents: string[];
  }>;
  timestamp: string;
  errors: string[];
}

interface DetectedPattern {
  name: string;
  type:
    | "RBAC"
    | "MultiTenant"
    | "MCPFirst"
    | "DevProd"
    | "API"
    | "Component"
    | "Service"
    | "Other";
  description: string;
  source: string; // File path or commit hash
  codeSnippet?: string;
  confidence: "high" | "medium" | "low";
  suggestedEntityName: string; // PATTERN_ASANMOD_*
  usage?: string;
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
 * Detect patterns from commit message
 */
function detectPatternsFromCommitMessage(
  commitMessage: string,
  commitHash: string
): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Check for explicit pattern mention
  const patternMatch = commitMessage.match(/Pattern:\s*(PATTERN_ASANMOD_\w+)/i);
  if (patternMatch) {
    const patternName = patternMatch[1];
    patterns.push({
      name: patternName.replace("PATTERN_ASANMOD_", "").replace(/_/g, " "),
      type: "Other",
      description: `Pattern mentioned in commit: ${commitMessage.split("\n")[0]}`,
      source: `commit:${commitHash}`,
      confidence: "high",
      suggestedEntityName: patternName,
      usage: commitMessage,
    });
  }

  // Detect RBAC pattern
  if (
    commitMessage.toLowerCase().includes("rbac") ||
    commitMessage.toLowerCase().includes("role") ||
    commitMessage.toLowerCase().includes("permission")
  ) {
    patterns.push({
      name: "RBAC Implementation",
      type: "RBAC",
      description: "RBAC pattern detected from commit message",
      source: `commit:${commitHash}`,
      confidence: "medium",
      suggestedEntityName: "PATTERN_ASANMOD_RBAC",
      usage: commitMessage,
    });
  }

  // Detect Multi-Tenant pattern
  if (
    commitMessage.toLowerCase().includes("multi-tenant") ||
    commitMessage.toLowerCase().includes("organization") ||
    commitMessage.toLowerCase().includes("org isolation")
  ) {
    patterns.push({
      name: "Multi-Tenant Isolation",
      type: "MultiTenant",
      description: "Multi-tenant pattern detected from commit message",
      source: `commit:${commitHash}`,
      confidence: "medium",
      suggestedEntityName: "PATTERN_ASANMOD_MULTI_TENANT",
      usage: commitMessage,
    });
  }

  // Detect MCP-First pattern
  if (
    commitMessage.toLowerCase().includes("mcp") ||
    commitMessage.toLowerCase().includes("model context protocol")
  ) {
    patterns.push({
      name: "MCP-First Architecture",
      type: "MCPFirst",
      description: "MCP-First pattern detected from commit message",
      source: `commit:${commitHash}`,
      confidence: "medium",
      suggestedEntityName: "PATTERN_ASANMOD_MCP_FIRST",
      usage: commitMessage,
    });
  }

  // Detect DEV-PROD pattern
  if (
    commitMessage.toLowerCase().includes("dev-prod") ||
    commitMessage.toLowerCase().includes("environment isolation") ||
    commitMessage.toLowerCase().includes("prod protection")
  ) {
    patterns.push({
      name: "DEV-PROD Isolation",
      type: "DevProd",
      description: "DEV-PROD isolation pattern detected from commit message",
      source: `commit:${commitHash}`,
      confidence: "medium",
      suggestedEntityName: "PATTERN_ASANMOD_DEV_PROD",
      usage: commitMessage,
    });
  }

  return patterns;
}

/**
 * Detect patterns from code changes
 */
function detectPatternsFromCode(
  commitHash: string,
  projectRoot: string
): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  try {
    // Get changed files
    const changedFiles = execSync(
      `git diff-tree --no-commit-id --name-only -r ${commitHash}`,
      {
        encoding: "utf-8",
        cwd: projectRoot,
      }
    )
      .trim()
      .split("\n")
      .filter((f) => f.trim());

    for (const file of changedFiles) {
      const fullPath = join(projectRoot, file);

      if (!existsSync(fullPath)) {
        continue;
      }

      // Detect API endpoint pattern
      if (file.includes("routes/") || file.includes("controllers/")) {
        const content = readFileSync(fullPath, "utf-8");

        // Check for REST API pattern
        if (
          content.includes("router.get") ||
          content.includes("router.post") ||
          content.includes("router.put") ||
          content.includes("router.delete")
        ) {
          const routeMatch = content.match(
            /router\.(get|post|put|delete)\s*\(['"]([^'"]+)['"]/
          );
          if (routeMatch) {
            patterns.push({
              name: `REST API ${routeMatch[1].toUpperCase()} Endpoint`,
              type: "API",
              description: `REST API endpoint pattern: ${routeMatch[1].toUpperCase()} ${routeMatch[2]}`,
              source: file,
              codeSnippet: routeMatch[0],
              confidence: "high",
              suggestedEntityName: `PATTERN_ASANMOD_API_${routeMatch[1].toUpperCase()}`,
              usage: `API endpoint: ${routeMatch[1].toUpperCase()} ${routeMatch[2]}`,
            });
          }
        }
      }

      // Detect React component pattern
      if (
        file.includes("components/") ||
        (file.includes("app/") && file.endsWith(".tsx"))
      ) {
        const content = readFileSync(fullPath, "utf-8");

        // Check for React component pattern
        if (
          content.includes("export default function") ||
          content.includes("export function")
        ) {
          const componentMatch = content.match(
            /export\s+(default\s+)?function\s+(\w+)/
          );
          if (componentMatch) {
            patterns.push({
              name: `React Component: ${componentMatch[2]}`,
              type: "Component",
              description: `React component pattern: ${componentMatch[2]}`,
              source: file,
              confidence: "high",
              suggestedEntityName: `PATTERN_ASANMOD_COMPONENT_${componentMatch[2].toUpperCase()}`,
              usage: `Component: ${componentMatch[2]}`,
            });
          }
        }
      }

      // Detect service pattern
      if (file.includes("services/")) {
        const content = readFileSync(fullPath, "utf-8");

        // Check for service class/function pattern
        if (
          content.includes("class ") ||
          content.includes("export async function")
        ) {
          const serviceMatch = content.match(
            /(?:class|export\s+async\s+function)\s+(\w+)/
          );
          if (serviceMatch) {
            patterns.push({
              name: `Service: ${serviceMatch[1]}`,
              type: "Service",
              description: `Service pattern: ${serviceMatch[1]}`,
              source: file,
              confidence: "high",
              suggestedEntityName: `PATTERN_ASANMOD_SERVICE_${serviceMatch[1].toUpperCase()}`,
              usage: `Service: ${serviceMatch[1]}`,
            });
          }
        }
      }

      // Detect RBAC pattern in code
      if (
        file.includes("middleware/") ||
        file.includes("controllers/") ||
        file.includes("services/")
      ) {
        const content = readFileSync(fullPath, "utf-8");

        if (
          content.includes("organizationId") &&
          (content.includes("SUPER_ADMIN") ||
            content.includes("ADMIN") ||
            content.includes("authorize"))
        ) {
          patterns.push({
            name: "RBAC with Organization Filter",
            type: "RBAC",
            description:
              "RBAC pattern with organizationId filtering detected in code",
            source: file,
            confidence: "high",
            suggestedEntityName: "PATTERN_ASANMOD_RBAC_ORG_FILTER",
            usage: "RBAC pattern with organization isolation",
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
 * Automatic pattern learning from commit
 */
export async function automaticPatternLearning(params: {
  commitHash?: string; // Opsiyonel, default: HEAD
  path?: string;
}): Promise<AutomaticPatternLearningResult> {
  const { commitHash: providedHash, path } = params;
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const result: AutomaticPatternLearningResult = {
    success: true,
    commitHash: "",
    patternsDetected: [],
    patternsLearned: 0,
    patternsCreated: 0,
    memoryObservationsFormat: [],
    timestamp: new Date().toISOString(),
    errors: [],
  };

  try {
    // Get commit hash
    const commitHash =
      providedHash ||
      execSync("git rev-parse HEAD", {
        encoding: "utf-8",
        cwd: projectRoot,
      }).trim();

    result.commitHash = commitHash;

    // Get commit message
    const commitMessage = execSync(`git log -1 --format="%B" ${commitHash}`, {
      encoding: "utf-8",
      cwd: projectRoot,
    }).trim();

    // Detect patterns from commit message
    const patternsFromMessage = detectPatternsFromCommitMessage(
      commitMessage,
      commitHash
    );

    // Detect patterns from code changes
    const patternsFromCode = detectPatternsFromCode(commitHash, projectRoot);

    // Combine and deduplicate patterns
    const allPatterns = [...patternsFromMessage, ...patternsFromCode];
    const uniquePatterns = new Map<string, DetectedPattern>();

    for (const pattern of allPatterns) {
      const key = pattern.suggestedEntityName;
      if (!uniquePatterns.has(key) || pattern.confidence === "high") {
        uniquePatterns.set(key, pattern);
      }
    }

    result.patternsDetected = Array.from(uniquePatterns.values());
    result.patternsLearned = result.patternsDetected.length;

    // Generate Memory MCP observations
    const observations: Array<{ entityName: string; contents: string[] }> = [];

    for (const pattern of result.patternsDetected) {
      const patternContents: string[] = [
        `Pattern learned from commit: ${commitHash}`,
        `Pattern description: ${pattern.description}`,
        `Pattern source: ${pattern.source}`,
        `Pattern confidence: ${pattern.confidence}`,
        `Learned: ${result.timestamp}`,
      ];

      if (pattern.codeSnippet) {
        patternContents.push(`Code snippet: ${pattern.codeSnippet}`);
      }

      if (pattern.usage) {
        patternContents.push(`Usage: ${pattern.usage}`);
      }

      observations.push({
        entityName: pattern.suggestedEntityName,
        contents: patternContents,
      });

      result.patternsCreated++;
    }

    // Summary observation
    if (result.patternsDetected.length > 0) {
      observations.push({
        entityName: "ASANMOD_PROJECT",
        contents: [
          `[COMMIT ${commitHash}] ${result.patternsDetected.length} pattern(s) learned automatically`,
          ...result.patternsDetected.map(
            (p) => `  - ${p.suggestedEntityName}: ${p.description}`
          ),
        ],
      });
    }

    result.memoryObservationsFormat = observations;

    return result;
  } catch (error: any) {
    result.success = false;
    result.errors.push(`Automatic pattern learning error: ${error.message}`);
    return result;
  }
}
