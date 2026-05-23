/**
 * ASANMOD MCP Tool: Cursor Composer/Chat Integration
 * Pattern önerileri ve context-aware suggestions için format üretir
 *
 * Phase 6: Cursor IDE Integration
 */

import { existsSync } from "fs";
import { join } from "path";

interface CursorComposerChatIntegrationResult {
  success: boolean;
  patternSuggestions: Array<{
    pattern: string;
    description: string;
    usage: string;
    confidence: "high" | "medium" | "low";
  }>;
  contextSuggestions: Array<{
    context: string;
    suggestion: string;
    source: string;
  }>;
  integrationFormat: {
    composerSuggestions: any;
    chatSuggestions: any;
  };
  timestamp: string;
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
 * Generate pattern suggestions for Cursor Composer/Chat
 */
export function generatePatternSuggestions(): Array<{
  pattern: string;
  description: string;
  usage: string;
  confidence: "high" | "medium" | "low";
}> {
  return [
    {
      pattern: "PATTERN_ASANMOD_RBAC",
      description: "RBAC pattern with organizationId filtering",
      usage:
        "Use when implementing role-based access control with organization isolation",
      confidence: "high",
    },
    {
      pattern: "PATTERN_ASANMOD_MULTI_TENANT",
      description:
        "Multi-tenant pattern with enforceOrganizationIsolation middleware",
      usage: "Use when implementing multi-tenant features",
      confidence: "high",
    },
    {
      pattern: "PATTERN_ASANMOD_DEV_PROD",
      description: "DEV-PROD environment isolation pattern",
      usage: "Use when implementing environment-specific logic",
      confidence: "high",
    },
    {
      pattern: "PATTERN_ASANMOD_MCP_FIRST",
      description: "MCP-First pattern (Filesystem MCP, Memory MCP mandatory)",
      usage: "Use when implementing file operations or context management",
      confidence: "high",
    },
  ];
}

/**
 * Generate context-aware suggestions
 */
export function generateContextSuggestions(): Array<{
  context: string;
  suggestion: string;
  source: string;
}> {
  return [
    {
      context: "File operations",
      suggestion:
        "Use Filesystem MCP (mcp_filesystem_read_text_file, mcp_filesystem_edit_file) - Terminal commands FORBIDDEN",
      source: "RULE_0_MCP_FIRST",
    },
    {
      context: "Context/memory operations",
      suggestion:
        "Use Memory MCP (mcp_memory_create_entities, mcp_memory_add_observations) - Manual context YASAK",
      source: "RULE_0_MCP_FIRST",
    },
    {
      context: "RBAC implementation",
      suggestion:
        "Use PATTERN_ASANMOD_RBAC - organizationId filter for ADMIN/MANAGER/HR_SPECIALIST, no filter for SUPER_ADMIN",
      source: "PATTERN_ASANMOD_RBAC",
    },
    {
      context: "Environment-specific code",
      suggestion:
        "Use PATTERN_ASANMOD_DEV_PROD - Default DEV, PROD only when explicitly requested",
      source: "RULE_7_PROD_PROTECTION",
    },
    {
      context: "Production-ready code",
      suggestion:
        "Check for 19 forbidden words (mock, placeholder, TODO, FIXME, etc.) - grep control MANDATORY",
      source: "RULE_0",
    },
  ];
}

/**
 * Integrate with Cursor Composer/Chat
 */
export async function integrateCursorComposerChat(
  path?: string
): Promise<CursorComposerChatIntegrationResult> {
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const patternSuggestions = generatePatternSuggestions();
  const contextSuggestions = generateContextSuggestions();

  const result: CursorComposerChatIntegrationResult = {
    success: true,
    patternSuggestions,
    contextSuggestions,
    integrationFormat: {
      composerSuggestions: {
        patterns: patternSuggestions,
        note: "Use these patterns in Cursor Composer when generating code",
      },
      chatSuggestions: {
        contextAware: contextSuggestions,
        note: "Use these suggestions in Cursor Chat based on user context",
      },
    },
    timestamp: new Date().toISOString(),
  };

  return result;
}

/**
 * MCP Tool Handler
 */
export async function handleCursorComposerChatIntegration(args: {
  path?: string;
}): Promise<CursorComposerChatIntegrationResult> {
  return integrateCursorComposerChat(args.path);
}
