/**
 * Tool: asanmod_get_rule
 * Kural bilgisi döner (doküman okumadan).
 * Özel rule_id'ler: "all", "mod-output-style", "workflow", "checklist", "mcp-list"
 */

import {
  getRule,
  getAllRules,
  getMandatoryRules,
  MOD_OUTPUT_STYLE,
  WORKFLOW_PATTERNS,
  VERIFICATION_CHECKLIST,
  MCP_LIST,
} from "../rules.js";
import { cache } from "../cache.js";

export interface RuleResult {
  success: boolean;
  rule?: any;
  error?: string;
}

export async function getRuleInfo(ruleId: string): Promise<RuleResult> {
  // Cache check
  const cacheKey = cache.getRuleKey(ruleId);
  const cached = cache.get<RuleResult>(cacheKey);
  if (cached) {
    return cached;
  }

  // Özel rule_id'ler
  if (ruleId === "all") {
    const result: RuleResult = {
      success: true,
      rule: {
        allRules: getAllRules(),
        mandatory: getMandatoryRules(),
        modOutputStyle: MOD_OUTPUT_STYLE,
        workflow: WORKFLOW_PATTERNS,
        checklist: VERIFICATION_CHECKLIST,
        mcpList: MCP_LIST,
      },
    };
    cache.set(cacheKey, result);
    return result;
  }

  if (ruleId === "mod-output-style") {
    const result: RuleResult = {
      success: true,
      rule: MOD_OUTPUT_STYLE,
    };
    cache.set(cacheKey, result);
    return result;
  }

  if (ruleId === "workflow") {
    const result: RuleResult = {
      success: true,
      rule: WORKFLOW_PATTERNS,
    };
    cache.set(cacheKey, result);
    return result;
  }

  if (ruleId === "checklist") {
    const result: RuleResult = {
      success: true,
      rule: VERIFICATION_CHECKLIST,
    };
    cache.set(cacheKey, result);
    return result;
  }

  if (ruleId === "mcp-list") {
    const result: RuleResult = {
      success: true,
      rule: MCP_LIST,
    };
    cache.set(cacheKey, result);
    return result;
  }

  // Normal rule lookup
  const rule = getRule(ruleId);
  if (!rule) {
    return {
      success: false,
      error: `Rule ${ruleId} not found. Available: 0, 0-TERMINAL, 0-LINT-QUALITY, 1, 2, 3, 4, 7, all, mod-output-style, workflow, checklist, mcp-list`,
    };
  }

  const result: RuleResult = {
    success: true,
    rule,
  };

  // Cache (24 saat TTL)
  cache.set(cacheKey, result);

  return result;
}

export async function getAllRulesInfo() {
  return {
    success: true,
    rules: getAllRules(),
    mandatory: getMandatoryRules(),
    modOutputStyle: MOD_OUTPUT_STYLE,
    workflow: WORKFLOW_PATTERNS,
    checklist: VERIFICATION_CHECKLIST,
    mcpList: MCP_LIST,
  };
}
