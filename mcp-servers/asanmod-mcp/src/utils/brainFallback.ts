/**
 * Brain Fallback Utility
 * Provides graceful degradation when Brain API is unavailable
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

interface BrainResponse {
  success: boolean;
  fallback?: boolean;
  data?: any;
  error?: string;
}

const BRAIN_CACHE_PATH = join(tmpdir(), "asanmod-brain-cache.json");
const BRAIN_TIMEOUT = 3000; // 3 seconds

/**
 * Query Brain API with fallback to cache and static defaults
 */
export async function queryBrainWithFallback(
  endpoint: string,
  options?: RequestInit
): Promise<BrainResponse> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BRAIN_TIMEOUT);

    const response = await fetch(`http://localhost:8250${endpoint}`, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache successful responses
    cacheResponse(endpoint, data);

    return { success: true, data };
  } catch (error: any) {
    console.warn(`[BRAIN] Fallback mode - ${error.message}`);

    // Try cache
    const cached = getCachedResponse(endpoint);
    if (cached) {
      return {
        success: true,
        fallback: true,
        data: cached,
        error: "Using cached data - Brain unavailable",
      };
    }

    // Ultimate fallback - static defaults
    return getStaticFallback(endpoint);
  }
}

/**
 * Cache successful Brain responses
 */
function cacheResponse(endpoint: string, data: any): void {
  try {
    const cache = existsSync(BRAIN_CACHE_PATH)
      ? JSON.parse(readFileSync(BRAIN_CACHE_PATH, "utf-8"))
      : {};

    cache[endpoint] = {
      data,
      timestamp: Date.now(),
    };

    writeFileSync(BRAIN_CACHE_PATH, JSON.stringify(cache, null, 2));
  } catch (e) {
    // Ignore cache errors
    console.warn(`[BRAIN] Cache write failed: ${e}`);
  }
}

/**
 * Get cached response if available and fresh
 */
function getCachedResponse(endpoint: string): any | null {
  try {
    if (!existsSync(BRAIN_CACHE_PATH)) return null;

    const cache = JSON.parse(readFileSync(BRAIN_CACHE_PATH, "utf-8"));
    const entry = cache[endpoint];

    // Cache valid for 1 hour
    if (entry && Date.now() - entry.timestamp < 3600000) {
      return entry.data;
    }
  } catch (e) {
    // Ignore cache read errors
    console.warn(`[BRAIN] Cache read failed: ${e}`);
  }
  return null;
}

/**
 * Get static fallback data for critical endpoints
 */
function getStaticFallback(endpoint: string): BrainResponse {
  // Static fallback data for critical endpoints
  const fallbacks: Record<string, any> = {
    "/brain/health": {
      status: "unknown",
      fallback: true,
      service: "asanmod-brain",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    },
    "/brain/rules": {
      rules: [],
      count: 0,
      note: "Brain offline - using static fallback",
    },
    "/brain/mcps": {
      mcps: [],
      count: 0,
      note: "Brain offline - using static fallback",
    },
    "/brain/stats": {
      entities: 0,
      error_solutions: 0,
      git_commits: 0,
      code_patterns: 0,
      note: "Brain offline - using static fallback",
    },
  };

  const fallbackData = fallbacks[endpoint] || null;

  return {
    success: fallbackData !== null,
    fallback: true,
    data: fallbackData,
    error: fallbackData
      ? "Brain unavailable, using static fallback"
      : "Brain unavailable, no cache, no fallback",
  };
}
