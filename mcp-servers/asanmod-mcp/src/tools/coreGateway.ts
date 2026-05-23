/**
 * ASANMOD Core Gateway
 * Unified entry point for Big 5 tools with anti-error logic
 * Routes requests to appropriate consolidated tools
 */

import {
  qualityGate,
  QualityGateOptions,
  QualityGateResult,
} from "./qualityGate.js";
import {
  securityAudit,
  SecurityAuditOptions,
  SecurityAuditResult,
} from "./securityAudit.js";
import {
  infrastructureCheck,
  InfraCheckOptions,
  InfraCheckResult,
} from "./infrastructureCheck.js";
import { getTodos } from "./getTodos.js";
import { brainQuery } from "./brainQuery.js";
import { readFileMCP, fileExistsMCP } from "../utils/mcpClient.js";
import path from "path";

// JIT Context Map Interface
interface ContextMap {
  mappings: {
    pattern: string;
    context: string;
    ruleFile: string;
  }[];
  default: string;
}

// Minimal pattern matcher helper
function matchPattern(filePath: string | undefined, pattern: string): boolean {
  if (!filePath) return false;
  // Simple glob-like conversion: src/app/** -> startsWith
  const prefix = pattern.replace("**", "");
  return filePath.startsWith(prefix) || filePath.includes(prefix);
}

export interface CoreGatewayOptions {
  operation:
    | "quality"
    | "security"
    | "infrastructure"
    | "todos"
    | "brain"
    | "context"
    | "all";
  // Quality-specific options
  type?: "lint" | "types" | "format" | "dead-code" | "all";
  fix?: boolean;
  // Security-specific options
  check?: "rbac" | "secrets" | "isolation" | "prod-protect" | "all";
  // Infrastructure-specific options
  target?: "pm2" | "db" | "cache" | "all";
  // Brain-specific options
  query?: string;
  queryType?: "patterns" | "rules" | "commits" | "all";
  // Common options
  path?: string;
  mode?: string; // For todos
}

export interface GatewayResult {
  success: boolean;
  operation: string;
  result: any;
  error?: string;
  suggestion?: string; // Anti-error: Suggests correct usage
}

/**
 * Anti-error logic: Validates parameters and suggests corrections
 */
function validateOptions(options: CoreGatewayOptions): {
  valid: boolean;
  error?: string;
  suggestion?: string;
} {
  const { operation } = options;

  // Validate operation
  const validOperations = [
    "quality",
    "security",
    "infrastructure",
    "todos",
    "brain",
    "context",
    "all",
  ];
  if (!validOperations.includes(operation)) {
    return {
      valid: false,
      error: `Invalid operation: ${operation}`,
      suggestion: `Use one of: ${validOperations.join(", ")}`,
    };
  }

  // Validate operation-specific parameters
  if (operation === "quality") {
    if (!options.type) {
      return {
        valid: false,
        error: "Missing required parameter: type",
        suggestion:
          "Add 'type' parameter: 'lint', 'types', 'format', 'dead-code', or 'all'",
      };
    }
    const validTypes = ["lint", "types", "format", "dead-code", "all"];
    if (!validTypes.includes(options.type)) {
      return {
        valid: false,
        error: `Invalid type: ${options.type}`,
        suggestion: `Use one of: ${validTypes.join(", ")}`,
      };
    }
  }

  if (operation === "security") {
    if (!options.check) {
      return {
        valid: false,
        error: "Missing required parameter: check",
        suggestion:
          "Add 'check' parameter: 'rbac', 'secrets', 'isolation', 'prod-protect', or 'all'",
      };
    }
    const validChecks = ["rbac", "secrets", "isolation", "prod-protect", "all"];
    if (!validChecks.includes(options.check)) {
      return {
        valid: false,
        error: `Invalid check: ${options.check}`,
        suggestion: `Use one of: ${validChecks.join(", ")}`,
      };
    }
  }

  if (operation === "infrastructure") {
    if (!options.target) {
      return {
        valid: false,
        error: "Missing required parameter: target",
        suggestion: "Add 'target' parameter: 'pm2', 'db', 'cache', or 'all'",
      };
    }
    const validTargets = ["pm2", "db", "cache", "all"];
    if (!validTargets.includes(options.target)) {
      return {
        valid: false,
        error: `Invalid target: ${options.target}`,
        suggestion: `Use one of: ${validTargets.join(", ")}`,
      };
    }
  }

  if (operation === "brain") {
    if (!options.query) {
      return {
        valid: false,
        error: "Missing required parameter: query",
        suggestion: "Add 'query' parameter with search term",
      };
    }
  }

  return { valid: true };
}

/**
 * Core Gateway: Routes to Big 5 tools with anti-error logic
 */
export async function coreGateway(
  options: CoreGatewayOptions
): Promise<GatewayResult> {
  // Anti-error: Validate parameters first
  const validation = validateOptions(options);
  if (!validation.valid) {
    return {
      success: false,
      operation: options.operation,
      result: null,
      error: validation.error,
      suggestion: validation.suggestion,
    };
  }

  try {
    const { operation } = options;

    // Route to appropriate Big 5 tool
    if (operation === "quality") {
      const qualityOptions: QualityGateOptions = {
        type: options.type || "all",
        fix: options.fix || false,
        path: options.path,
      };
      const result = await qualityGate(qualityOptions);
      return {
        success: result.success,
        operation: "quality",
        result,
      };
    }

    if (operation === "security") {
      const securityOptions: SecurityAuditOptions = {
        check: options.check || "all",
        path: options.path,
      };
      const result = await securityAudit(securityOptions);
      return {
        success: result.success,
        operation: "security",
        result,
      };
    }

    if (operation === "infrastructure") {
      const infraOptions: InfraCheckOptions = {
        target: options.target || "all",
      };
      const result = await infrastructureCheck(infraOptions);
      return {
        success: result.success,
        operation: "infrastructure",
        result,
      };
    }

    if (operation === "todos") {
      const todosResult = await getTodos(options.path);
      return {
        success: true,
        operation: "todos",
        result: todosResult,
      };
    }

    if (operation === "brain") {
      if (!options.query) {
        return {
          success: false,
          operation: "brain",
          result: null,
          error: "Missing required parameter: query",
          suggestion: "Add 'query' parameter with search term",
        };
      }
      const brainResult = await brainQuery(options.query);
      return {
        success: brainResult.success !== false,
        operation: "brain",
        result: brainResult,
      };
    }

    // Handle "all" operation - run all Big 5 in parallel
    if (operation === "all") {
      const [
        qualityResult,
        securityResult,
        infraResult,
        todosResult,
        brainResult,
      ] = await Promise.allSettled([
        qualityGate({
          type: "all",
          fix: options.fix || false,
          path: options.path,
        }),
        securityAudit({ check: "all", path: options.path }),
        infrastructureCheck({ target: "all" }),
        getTodos(options.path),
        options.query
          ? brainQuery(options.query)
          : Promise.resolve({ success: true, data: [] }),
      ]);

      return {
        success: true,
        operation: "all",
        result: {
          quality:
            qualityResult.status === "fulfilled"
              ? qualityResult.value
              : { error: qualityResult.reason },
          security:
            securityResult.status === "fulfilled"
              ? securityResult.value
              : { error: securityResult.reason },
          infrastructure:
            infraResult.status === "fulfilled"
              ? infraResult.value
              : { error: infraResult.reason },
          todos:
            todosResult.status === "fulfilled"
              ? todosResult.value
              : { error: todosResult.reason },
          brain:
            brainResult.status === "fulfilled"
              ? brainResult.value
              : { error: brainResult.reason },
        },
      };
    }

    // Handle "context" operation - JIT Rule Loading
    if (operation === "context") {
      // Virtual operation
      const rootDir = process.cwd();
      const mapPath = path.resolve(rootDir, "docs/rules/context-map.json");

      let contextRules = "";
      let activeContext = "DEFAULT";

      // v8.0: Use MCP for file operations
      if (await fileExistsMCP(mapPath)) {
        try {
          const mapContent = await readFileMCP(mapPath);
          const mapData: ContextMap = JSON.parse(mapContent);
          const targetPath = options.path
            ? path.relative(rootDir, options.path)
            : "";

          // Find first matching rule
          const match = mapData.mappings.find((m) =>
            matchPattern(targetPath, m.pattern)
          );

          if (match) {
            activeContext = match.context;
            const rulePath = path.resolve(rootDir, match.ruleFile);
            if (await fileExistsMCP(rulePath)) {
              contextRules = await readFileMCP(rulePath);
            }
          } else {
            // Fallback to default
            const defaultPath = path.resolve(rootDir, mapData.default);
            if (await fileExistsMCP(defaultPath)) {
              contextRules = await readFileMCP(defaultPath);
            }
          }
        } catch (e) {
          process.stderr.write(`[coreGateway] Context Load Error: ${e}\n`);
        }
      }

      return {
        success: true,
        operation: "context",
        result: {
          context: activeContext,
          rules: contextRules.substring(0, 2000) + "...", // Truncate for token sanity
        },
      };
    }

    return {
      success: false,
      operation: options.operation,
      result: null,
      error: "Unhandled operation",
      suggestion:
        "Use one of: quality, security, infrastructure, todos, brain, context, all",
    };
  } catch (error) {
    return {
      success: false,
      operation: options.operation,
      result: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
