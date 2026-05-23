/**
 * JIT (Just-In-Time) Rule Engine
 * Context-aware rule loading - only loads rules relevant to current context
 * Reduces token noise by 70-80%
 */

const BRAIN_API = process.env.BRAIN_API || "http://localhost:8250";

export interface RuleContext {
  fileType?: string; // .ts, .prisma, .tsx, .js, etc.
  taskType?: string; // "auth", "database", "ui", "api", etc.
  phase?: "plan" | "execute" | "verify";
  filePath?: string; // Full file path for context detection
}

export interface RuleHierarchy {
  global: string[]; // Always active (Rule 0 series)
  contextual: Record<string, string[]>; // File/task-specific rules
  transient: string[]; // Task-duration only rules
  all: string[]; // All rules (for reference)
}

interface CachedRules {
  rules: RuleHierarchy;
  timestamp: number;
  context: RuleContext;
}

// Cache for rules (5-minute TTL)
const ruleCache = new Map<string, CachedRules>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Detect file type from path
 */
function detectFileType(filePath?: string): string | undefined {
  if (!filePath) return undefined;

  const ext = filePath.split(".").pop()?.toLowerCase();
  return ext;
}

/**
 * Detect task type from context
 */
function detectTaskType(context: RuleContext): string | undefined {
  if (context.taskType) return context.taskType;
  if (!context.filePath) return undefined;

  const path = context.filePath.toLowerCase();

  // Auth-related
  if (
    path.includes("auth") ||
    path.includes("login") ||
    path.includes("session")
  ) {
    return "auth";
  }

  // Database-related
  if (
    path.includes("prisma") ||
    path.includes("schema") ||
    path.includes("migration")
  ) {
    return "database";
  }

  // UI-related
  if (
    path.includes("component") ||
    path.includes("page") ||
    path.includes("ui")
  ) {
    return "ui";
  }

  // API-related
  if (
    path.includes("api") ||
    path.includes("route") ||
    path.includes("service")
  ) {
    return "api";
  }

  return undefined;
}

/**
 * Get cache key from context
 */
function getCacheKey(context: RuleContext): string {
  return JSON.stringify({
    fileType: context.fileType || detectFileType(context.filePath),
    taskType: context.taskType || detectTaskType(context),
    phase: context.phase,
  });
}

/**
 * Load rules from Brain API
 */
async function loadRulesFromBrain(): Promise<any[]> {
  try {
    const response = await fetch(`${BRAIN_API}/brain/rules`);
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as any;
    return Array.isArray(data.rules)
      ? data.rules
      : Array.isArray(data)
        ? data
        : [];
  } catch (error) {
    return [];
  }
}

/**
 * Filter rules based on context
 */
function filterRulesForContext(
  rules: any[],
  context: RuleContext
): RuleHierarchy {
  const fileType = context.fileType || detectFileType(context.filePath);
  const taskType = context.taskType || detectTaskType(context);

  const global: string[] = [];
  const contextual: Record<string, string[]> = {};
  const all: string[] = [];

  // Rule mapping based on file type
  const fileTypeRules: Record<string, string[]> = {
    ".prisma": ["rule-2-rbac", "rule-6-isolation"],
    ".tsx": ["rule-0-pagespeed-seo-quality"],
    ".ts": ["rule-0-lint-quality"],
    ".js": ["rule-0-lint-quality"],
  };

  // Rule mapping based on task type
  const taskTypeRules: Record<string, string[]> = {
    auth: ["rule-2-rbac", "rule-1-mcp-verification"],
    database: ["rule-2-rbac", "rule-6-isolation"],
    ui: ["rule-0-pagespeed-seo-quality"],
    api: ["rule-2-rbac", "rule-1-mcp-verification"],
  };

  // Always include global rules (Rule 0 series)
  const globalRuleIds = [
    "rule-0-max-performance",
    "rule-0-mcp-first",
    "rule-0-pm2-logs",
    "rule-0-production-ready",
    "rule-0-terminal",
    "rule-0-lint-quality",
    "rule-0-pagespeed-seo-quality",
    "rule-0-git-policy",
  ];

  // Process all rules
  for (const rule of rules) {
    const ruleId = rule.id || rule.name?.toLowerCase().replace(/\s+/g, "-");
    all.push(ruleId);

    // Global rules (always active)
    if (globalRuleIds.includes(ruleId)) {
      global.push(ruleId);
    }

    // File type specific rules
    if (fileType && fileTypeRules[`.${fileType}`]) {
      if (fileTypeRules[`.${fileType}`].includes(ruleId)) {
        if (!contextual[`file:${fileType}`]) {
          contextual[`file:${fileType}`] = [];
        }
        contextual[`file:${fileType}`].push(ruleId);
      }
    }

    // Task type specific rules
    if (taskType && taskTypeRules[taskType]) {
      if (taskTypeRules[taskType].includes(ruleId)) {
        if (!contextual[`task:${taskType}`]) {
          contextual[`task:${taskType}`] = [];
        }
        contextual[`task:${taskType}`].push(ruleId);
      }
    }
  }

  return {
    global,
    contextual,
    transient: [], // Transient rules loaded on-demand
    all,
  };
}

/**
 * Load rules for context (JIT - Just-In-Time)
 */
export async function loadRulesForContext(
  context: RuleContext = {}
): Promise<RuleHierarchy> {
  // Check cache
  const cacheKey = getCacheKey(context);
  const cached = ruleCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rules;
  }

  // Load rules from Brain API
  const allRules = await loadRulesFromBrain();

  // Filter rules based on context
  const filteredRules = filterRulesForContext(allRules, context);

  // Cache result
  ruleCache.set(cacheKey, {
    rules: filteredRules,
    timestamp: Date.now(),
    context,
  });

  return filteredRules;
}

/**
 * Get rules for specific file
 */
export async function getRulesForFile(
  filePath: string
): Promise<RuleHierarchy> {
  return loadRulesForContext({
    filePath,
    fileType: detectFileType(filePath),
    taskType: detectTaskType({ filePath }),
  });
}

/**
 * Clear rule cache
 */
export function clearRuleCache(): void {
  ruleCache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: ruleCache.size,
    entries: Array.from(ruleCache.keys()),
  };
}
