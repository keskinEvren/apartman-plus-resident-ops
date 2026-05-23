/**
 * Smart Documentation Access - Pattern Getter
 * Workflow pattern'lerini doküman okumadan döner
 */

import {
  WORKFLOW_PATTERNS,
  MOD_OUTPUT_STYLE,
  VERIFICATION_CHECKLIST,
} from "../rules.js";
import { cache } from "../cache.js";

export interface PatternResult {
  success: boolean;
  pattern?: any;
  error?: string;
}

export type PatternType =
  | "mod-workflow"
  | "worker-workflow"
  | "mod-output-style"
  | "verification-checklist"
  | "all";

export async function getPattern(
  patternType: PatternType
): Promise<PatternResult> {
  // Cache check
  const cacheKey = cache.getPatternKey(patternType);
  const cached = cache.get<PatternResult>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    let pattern: any;

    switch (patternType) {
      case "mod-workflow":
        pattern = {
          type: "mod-workflow",
          steps: WORKFLOW_PATTERNS.mod,
          description:
            "MOD workflow pattern - Session start, task assignment, verification, reporting",
        };
        break;

      case "worker-workflow":
        pattern = {
          type: "worker-workflow",
          steps: WORKFLOW_PATTERNS.worker,
          description:
            "WORKER workflow pattern - Task reading, execution, pre-commit checks, reporting",
        };
        break;

      case "mod-output-style":
        pattern = {
          type: "mod-output-style",
          ...MOD_OUTPUT_STYLE,
          description:
            "MOD output style rules - Tabular format, checklist format, emoji + metric",
        };
        break;

      case "verification-checklist":
        pattern = {
          type: "verification-checklist",
          ...VERIFICATION_CHECKLIST,
          description:
            "Verification checklist - Priority-based checks, rejection criteria",
        };
        break;

      case "all":
        pattern = {
          modWorkflow: WORKFLOW_PATTERNS.mod,
          workerWorkflow: WORKFLOW_PATTERNS.worker,
          modOutputStyle: MOD_OUTPUT_STYLE,
          verificationChecklist: VERIFICATION_CHECKLIST,
          description: "All patterns - Complete ASANMOD pattern collection",
        };
        break;

      default:
        return {
          success: false,
          error: `Unknown pattern type: ${patternType}. Available: mod-workflow, worker-workflow, mod-output-style, verification-checklist, all`,
        };
    }

    const result: PatternResult = {
      success: true,
      pattern,
    };

    // Cache (24 saat TTL)
    cache.set(cacheKey, result);

    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
