/**
 * ASANMOD MCP - Brain Query Tools
 * Tools for querying and interacting with the ASANMOD Brain Daemon
 *
 * @module tools/brainQuery
 * @version 1.0.0
 * @created 2026-12-13
 */

import { cache } from "../cache.js";

const BRAIN_API = process.env.BRAIN_API || "http://localhost:8250";

// Cache TTL for Brain queries (5 minutes)
const BRAIN_QUERY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface BrainResponse {
  success: boolean;
  [key: string]: any;
}

/**
 * Make HTTP request to Brain API
 */
async function brainRequest(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: object
): Promise<BrainResponse> {
  try {
    if (!endpoint || !BRAIN_API) {
      return {
        success: false,
        error: "Brain API endpoint or URL is missing",
        brainRunning: false,
      };
    }

    const url = `${BRAIN_API}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body && method === "POST") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      return {
        success: false,
        error: `Brain API HTTP error: ${response.status} ${response.statusText}`,
        brainRunning: false,
      };
    }

    const data = await response.json();

    // Null check for response data
    if (!data || typeof data !== "object") {
      return {
        success: false,
        error: "Brain API returned invalid response",
        brainRunning: false,
      };
    }

    return data as BrainResponse;
  } catch (error) {
    return {
      success: false,
      error: `Brain API error: ${error instanceof Error ? error.message : String(error)}`,
      brainRunning: false,
    };
  }
}

/**
 * Check if Brain Daemon is running
 */
export async function brainHealth(): Promise<{
  running: boolean;
  version?: string;
  error?: string;
}> {
  try {
    const result = await brainRequest("/brain/health");

    // Null check for result
    if (!result) {
      return {
        running: false,
        error: "Brain API returned null response",
      };
    }

    return {
      running: result.success === true,
      version: result.version || undefined,
      error: result.error || undefined,
    };
  } catch (error) {
    return {
      running: false,
      error: `brainHealth error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get Brain statistics
 */
export async function brainStats(): Promise<{
  success: boolean;
  stats?: {
    entities: number;
    observations: number;
    relations: number;
    error_solutions: number;
    git_commits: number;
    code_patterns: number;
    brain_commits: number;
    successful_solutions: number;
    last_sync?: string;
  };
  error?: string;
}> {
  try {
    const result = await brainRequest("/brain/stats");

    // Null check for result
    if (!result) {
      return {
        success: false,
        error: "Brain API returned null response",
      };
    }

    return {
      success: result.success === true,
      stats: result.stats || undefined,
      error: result.error || undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: `brainStats error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Query Brain knowledge base
 * OPTIMIZED: Uses cache to reduce API calls (TTL: 5 minutes)
 */
export async function brainQuery(query: string): Promise<{
  success: boolean;
  entities?: any[];
  patterns?: any[];
  solutions?: any[];
  error?: string;
}> {
  try {
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return {
        success: false,
        error: "Query parameter is required and must be a non-empty string",
      };
    }

    // Generate cache key from query
    const cacheKey = `brain:query:${query.trim().toLowerCase()}`;

    // Check cache first
    const cached = cache.get<{
      success: boolean;
      entities?: any[];
      patterns?: any[];
      solutions?: any[];
      error?: string;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    // Cache miss - make API request
    const result = await brainRequest(
      `/brain/query?q=${encodeURIComponent(query)}`
    );

    // Null check for result
    if (!result) {
      return {
        success: false,
        error: "Brain API returned null response",
      };
    }

    // Null check for result.results
    const results = result.results || {};

    const response = {
      success: result.success || false,
      entities: Array.isArray(results.entities) ? results.entities : undefined,
      patterns: Array.isArray(results.patterns) ? results.patterns : undefined,
      solutions: Array.isArray(results.solutions)
        ? results.solutions
        : undefined,
      error: result.error || (result.success ? undefined : "Unknown error"),
    };

    // Cache successful responses only
    if (response.success && !response.error) {
      cache.set(cacheKey, response, BRAIN_QUERY_CACHE_TTL);
    }

    return response;
  } catch (error) {
    return {
      success: false,
      error: `brainQuery error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Find solution for an error
 */
export async function brainFindErrorSolution(errorMessage: string): Promise<{
  success: boolean;
  found: boolean;
  solutions?: Array<{
    id: number;
    pattern: string;
    solution: string;
    solutionCode?: string;
    solutionFiles?: string[];
    successRate: number;
    matchScore: number;
  }>;
  bestSolution?: {
    id: number;
    pattern: string;
    solution: string;
    solutionCode?: string;
    solutionFiles?: string[];
    successRate: number;
  };
  error?: string;
}> {
  const result = await brainRequest("/brain/find-solution", "POST", {
    errorMessage,
  });
  return {
    success: result.success,
    found: result.found || false,
    solutions: result.solutions,
    bestSolution: result.bestSolution,
    error: result.error,
  };
}

/**
 * Learn from an error and its solution
 */
export async function brainLearnError(
  errorMessage: string,
  solution: string,
  options?: {
    solutionCode?: string;
    filesChanged?: string[];
    pattern?: string;
    tags?: string[];
    commitHash?: string;
  }
): Promise<{
  success: boolean;
  id?: number;
  pattern?: string;
  error?: string;
}> {
  const result = await brainRequest("/brain/learn-error", "POST", {
    error: { errorMessage },
    solution,
    ...options,
  });
  return {
    success: result.success,
    id: result.id,
    pattern: result.pattern,
    error: result.error,
  };
}

/**
 * Trigger Memory MCP sync
 */
export async function brainSync(
  type: "full" | "incremental" = "full"
): Promise<{
  success: boolean;
  entities?: number;
  observations?: number;
  relations?: number;
  duration?: number;
  error?: string;
}> {
  const result = await brainRequest("/brain/sync", "POST", { type });
  return {
    success: result.success,
    entities: result.entities,
    observations: result.observations,
    relations: result.relations,
    duration: result.duration,
    error: result.error,
  };
}

/**
 * Get all known patterns
 */
export async function brainPatterns(query?: string): Promise<{
  success: boolean;
  count?: number;
  patterns?: Array<{
    pattern_name: string;
    pattern_type: string;
    description: string;
    usage_count: number;
    effectiveness_score: number;
  }>;
  error?: string;
}> {
  const endpoint = query
    ? `/brain/patterns?q=${encodeURIComponent(query)}`
    : "/brain/patterns";
  const result = await brainRequest(endpoint);
  return {
    success: result.success,
    count: result.count,
    patterns: result.patterns,
    error: result.error,
  };
}

/**
 * Mark a solution as successful or failed
 */
export async function brainMarkSolution(
  solutionId: number,
  success: boolean
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const result = await brainRequest("/brain/mark-solution", "POST", {
    solutionId,
    success,
  });
  return {
    success: result.success,
    message: result.message,
    error: result.error,
  };
}

/**
 * Get auto-suggestion for common errors
 */
export async function brainAutoSuggest(errorMessage: string): Promise<{
  success: boolean;
  found: boolean;
  suggestion?: {
    type: string;
    cause: string;
    solution: string;
    confidence: number;
  };
  error?: string;
}> {
  const result = await brainRequest(
    `/brain/auto-suggest?error=${encodeURIComponent(errorMessage)}`
  );
  return {
    success: result.success,
    found: result.found || false,
    suggestion: result.suggestion,
    error: result.error,
  };
}

// Export all functions
export default {
  brainHealth,
  brainStats,
  brainQuery,
  brainFindErrorSolution,
  brainLearnError,
  brainSync,
  brainPatterns,
  brainMarkSolution,
  brainAutoSuggest,
};

// Tool definitions for ASANMOD MCP
export const brainToolDefinitions = [
  {
    name: "asanmod_brain_health",
    description: "Check if Brain Daemon is running",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "asanmod_brain_stats",
    description: "Get Brain Daemon statistics",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "asanmod_brain_query",
    description: "Query Brain knowledge base",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "asanmod_brain_find_error_solution",
    description: "Find solution for an error from Brain",
    inputSchema: {
      type: "object",
      properties: {
        errorMessage: {
          type: "string",
          description: "Error message to find solution for",
        },
      },
      required: ["errorMessage"],
    },
  },
  {
    name: "asanmod_brain_learn_error",
    description: "Teach Brain a new error solution",
    inputSchema: {
      type: "object",
      properties: {
        errorMessage: {
          type: "string",
          description: "Error message",
        },
        solution: {
          type: "string",
          description: "Solution description",
        },
        solutionCode: {
          type: "string",
          description: "Solution code snippet (optional)",
        },
        filesChanged: {
          type: "array",
          items: { type: "string" },
          description: "Files changed to fix the error (optional)",
        },
        pattern: {
          type: "string",
          description: "PATTERN_ASANMOD_* pattern name (optional)",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Searchable tags (optional)",
        },
      },
      required: ["errorMessage", "solution"],
    },
  },
  {
    name: "asanmod_brain_sync",
    description: "Trigger Brain to Memory MCP sync",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["full", "incremental"],
          description: "Sync type (default: full)",
        },
      },
    },
  },
  {
    name: "asanmod_brain_patterns",
    description: "Get known code patterns from Brain",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (optional)",
        },
      },
    },
  },
  {
    name: "asanmod_brain_auto_suggest",
    description: "Get auto-suggested solution for common errors",
    inputSchema: {
      type: "object",
      properties: {
        errorMessage: {
          type: "string",
          description: "Error message",
        },
      },
      required: ["errorMessage"],
    },
  },
  {
    name: "asanmod_brain_mark_solution",
    description:
      "Mark a solution as successful or failed to improve Brain learning",
    inputSchema: {
      type: "object",
      properties: {
        solutionId: {
          type: "number",
          description: "Solution ID from brain_find_error_solution",
        },
        success: {
          type: "boolean",
          description: "Whether the solution worked (true) or not (false)",
        },
      },
      required: ["solutionId", "success"],
    },
  },
];
