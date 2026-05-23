/**
 * Tool Tier System
 * Categorizes ASANMOD tools into tiers for better organization and discovery
 */

export const TOOL_TIERS = {
  CORE: {
    description: "[CORE] Günlük kullanım - Her session",
    tools: [
      "asanmod_session_start",
      "asanmod_session_audit",
      "asanmod_get_dashboard",
      "asanmod_brain_query",
      "asanmod_brain_health",
      "asanmod_brain_stats",
      "asanmod_verify_lint",
      "asanmod_verify_typescript",
      "asanmod_check_pre_commit",
      "asanmod_check_production_ready",
      "asanmod_pm2_logs",
      "asanmod_pm2_restart",
      "asanmod_get_rule",
      "asanmod_get_pattern",
      // 'asanmod_assign_task' removed - WORKER system eliminated
    ], // 15 tools
  },

  VERIFICATION: {
    description: "[VERIFY] Commit öncesi doğrulama",
    tools: [
      "asanmod_verify_build",
      "asanmod_verify_security",
      "asanmod_verify_rbac_patterns",
      "asanmod_verify_environment_isolation",
      "asanmod_verify_formatting",
      "asanmod_verify_imports",
      "asanmod_verify_migrations",
      "asanmod_verify_unused_code",
      "asanmod_verify_console_errors",
      "asanmod_verify_prod_protection",
      "asanmod_verify_pm2_health",
      "asanmod_verify_git_commit_message",
      "asanmod_verify_database_connection",
      "asanmod_verify_environment_variables",
      "asanmod_verify_dependencies",
      "asanmod_verify_api_endpoints",
      "asanmod_verify_code_complexity",
      "asanmod_verify_file_size",
      "asanmod_verify_documentation",
      "asanmod_verify_network_connectivity",
      "asanmod_verify_performance",
      "asanmod_verify_prod_deployment",
      "asanmod_verify_dev_prod_sync",
      "asanmod_verify_build_cache",
      "asanmod_verify_migration_sync",
    ], // 25 tools
  },

  BRAIN: {
    description: "[BRAIN] Öğrenme ve memory",
    tools: [
      "asanmod_brain_find_error_solution",
      "asanmod_brain_learn_error",
      "asanmod_brain_sync",
      "asanmod_brain_patterns",
      "asanmod_brain_auto_suggest",
      "asanmod_brain_mark_solution",
      "asanmod_update_memory",
      "asanmod_add_pattern",
      "asanmod_asanmod_learning",
      "asanmod_auto_sync_memory_from_commit",
    ], // 10 tools
  },

  ADVANCED: {
    description: "[ADVANCED] Nadir kullanım",
    tools: [
      // Sync tools
      "asanmod_sync_memory_to_docs",
      "asanmod_sync_docs_to_memory",
      "asanmod_bidirectional_sync",
      // Detection tools
      "asanmod_detect_changes",
      "asanmod_detect_asanmod_patterns",
      "asanmod_comprehensive_change_detection",
      "asanmod_automatic_pattern_learning",
      // Cursor tools
      "asanmod_sync_memory_to_cursor_rules",
      "asanmod_cursor_settings_integration",
      "asanmod_cursor_agent_context",
      "asanmod_cursor_composer_chat_integration",
      // Test tools
      "asanmod_test_self_update",
      "asanmod_test_context_preservation",
      "asanmod_test_asanmod_specific",
      "asanmod_test_cursor_integration",
      "asanmod_test_performance",
      // Other
      "asanmod_create_changelog",
      "asanmod_update_version",
      "asanmod_verify_version_consistency",
      "asanmod_verify_task",
      "asanmod_verify_done",
      "asanmod_lint_fix",
      "asanmod_report_generate",
      "asanmod_optimize_pre_commit",
      "asanmod_get_incremental_check_recommendations",
      "asanmod_search_docs",
      "asanmod_get_mod_identity",
      "asanmod_get_project_context",
      "asanmod_get_patterns",
      "asanmod_selective_memory_read",
      "asanmod_enforce_task_completion",
      "asanmod_should_report_progress",
      "asanmod_should_document",
      "asanmod_enforce_todo_completion",
      "asanmod_register_todo_list",
      "asanmod_enforce_commit_after_edit",
      "asanmod_track_file_edit",
      "asanmod_mark_file_committed",
      "asanmod_get_uncommitted_files",
      "asanmod_clear_commit_tracker",
      "asanmod_should_report_todo_progress",
      "asanmod_check_update_status",
      "asanmod_check_git_sync",
      "asanmod_file_watcher",
      "asanmod_verify_prod_fix_sync",
      "asanmod_check_prod_fix_commit",
      "asanmod_verify_deployment_tracking",
      "asanmod_verify_tag_format",
      "asanmod_pm2_stop",
      "asanmod_pm2_start",
    ], // 53 tools
  },
} as const;

export type ToolTier = keyof typeof TOOL_TIERS;

/**
 * Get tier for a specific tool
 */
export function getToolTier(toolName: string): ToolTier | null {
  for (const [tier, config] of Object.entries(TOOL_TIERS)) {
    if ((config.tools as readonly string[]).includes(toolName)) {
      return tier as ToolTier;
    }
  }
  return null;
}

/**
 * Get all tools in a tier
 */
export function getToolsInTier(tier: ToolTier): readonly string[] {
  return TOOL_TIERS[tier].tools;
}

/**
 * Get tier description
 */
export function getTierDescription(tier: ToolTier): string {
  return TOOL_TIERS[tier].description;
}
