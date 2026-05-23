#!/usr/bin/env node

/**
 * ASANMOD MCP Server
 * MOD ve Worker arasında merkezi doğrulama ve denetim katmanı
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// CONSOLIDATED TOOLS (Big 5)
import { qualityGate } from "./tools/qualityGate.js";
import { securityAudit } from "./tools/securityAudit.js";
import { runQualityScan } from "./tools/runQualityScan.js";
import { infrastructureCheck } from "./tools/infrastructureCheck.js";
import { getTodos } from "./tools/getTodos.js";
import { coreGateway } from "./tools/coreGateway.js";
import { safeWrite } from "./tools/safeWrite.js";
import { scaffold } from "./tools/scaffold.js";
import { analyzeImpactTool } from "./tools/analyzeImpact.js";
import { verifyMCPOnly } from "./tools/verifyMCPOnly.js";

// Legacy Imports (Still needed for implementations used by consolidated tools)
// [PRUNED v4.7.2] Granular checks moved to Big 5 tools
import { checkProductionReady } from "./tools/checkProductionReady.js";
import { verifyTask } from "./tools/verifyTask.js";
import { getRuleInfo, getAllRulesInfo } from "./tools/getRule.js";
import { checkPreCommit } from "./tools/checkPreCommit.js";
import { verifyBuild } from "./tools/verifyBuild.js";
import { lintFix } from "./tools/lintFix.js";
import { generateReport } from "./tools/reportGenerate.js";
// Deprecated individual verify imports removed
import {
  restartPM2Process,
  stopPM2Process,
  startPM2Process,
} from "./tools/pm2Management.js";
// Deprecated infra imports removed
import { verifyTagFormat } from "./tools/verifyTagFormat.js";
import { sessionStart } from "./tools/sessionStart.js";
import { verifyDone } from "./tools/verifyDone.js";
import { getDashboard } from "./tools/getDashboard.js";
import { getPattern } from "./tools/getPattern.js";
import { getModIdentity, getProjectContext } from "./tools/memoryOptimizer.js";
// Deprecated deployment imports removed
import {
  handleUpdateMemory,
  generateMemoryObservations,
} from "./tools/updateMemory.js";
import { handleAddPattern, generatePatternEntity } from "./tools/addPattern.js";
import {
  handleDetectPatterns,
  generatePatternEntities,
} from "./tools/detectPatterns.js";
import {
  handleLearning,
  generateLearningObservations,
} from "./tools/learning.js";
import {
  handleContextLoad,
  generateContextQueries,
} from "./tools/contextLoad.js";
import {
  autoSyncMemoryFromCommit,
  generateAutoSyncMemoryObservations,
} from "./tools/autoSyncMemoryFromCommit.js";
import {
  brainHealth,
  brainStats,
  brainQuery,
  brainFindErrorSolution,
  brainLearnError,
  brainSync,
  brainPatterns,
  brainAutoSuggest,
  brainMarkSolution,
  brainToolDefinitions,
} from "./tools/brainQuery.js";
// [PRUNED v5.0] Legacy Indexing & Smart Read Tools Removed

const server = new Server(
  {
    name: "asanmod-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize handler (required for MCP SDK)
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  return {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: "asanmod-mcp",
      version: "1.0.0",
    },
  };
});

import { runUISmokeTest } from "./tools/runUISmokeTest.js";
import { executeMission } from "./tools/executeMission.js";

// List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // --- ASANMOD v5.0 AGENTIC OS TOOLS (CORE) ---
    {
      name: "asanmod_execute_mission",
      description:
        "[ULTRA CORE] Coordinates all Big 5 checks (Quality, Infra, Security) in a single atomical operation.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Target path (default: .)" },
          fix: { type: "boolean", description: "Auto-repair quality issues" },
          missionType: {
            type: "string",
            enum: ["full", "quality", "infra", "security"],
            description: "Mission depth",
          },
        },
      },
    },
    {
      name: "asanmod_safe_write",
      description:
        "[GATEKEEPER] Atomic Safe Writer. Verifies code integrity (build/lint/test) before saving to disk. Prevents broken code adoption.",
      inputSchema: {
        type: "object",
        properties: {
          targetFile: {
            type: "string",
            description: "Absolute path to the target file.",
          },
          content: { type: "string", description: "New content for the file." },
        },
        required: ["targetFile", "content"],
      },
    },
    {
      name: "asanmod_scaffold",
      description:
        "[GOLDEN MOLD] Intelligent Scaffolder. Generates standardized files (Page, Component, Service) from God Templates to prevent entropy.",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["page", "component", "service"],
            description: "Type of artifact to generate",
          },
          name: {
            type: "string",
            description: "Name of the artifact (e.g. UserSettings)",
          },
          module: {
            type: "string",
            description: "Module name for context (default: common)",
          },
          outputDir: {
            type: "string",
            description: "Target output directory (relative to root)",
          },
        },
        required: ["type", "name"],
      },
    },
    {
      name: "asanmod_run_quality_scan",
      description:
        "Runs the Batch Quality Scanner (npm run scan). Returns JSON report of issues.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "asanmod_run_ui_smoke_test",
      description:
        "Runs the Headless UI Smoke Test (npm run verify:ui). Can target specific routes.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Optional specific route to test (e.g. /super-admin)",
          },
        },
      },
    },
    {
      name: "asanmod_quality_gate",
      description:
        "[ULTRA CORE] Consolidates Lint, TypeScript, Formatting, and Dead Code checks. Supports AUTO-REPAIR via `fix: true`.",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["lint", "types", "format", "dead-code", "all"],
            description: "Type of check to run",
          },
          fix: {
            type: "boolean",
            description: "Auto-repair issues if possible (e.g. eslint --fix)",
          },
          path: {
            type: "string",
            description: "Target path (optional)",
          },
        },
        required: ["type"],
      },
    },
    {
      name: "asanmod_security_audit",
      description:
        "[ULTRA CORE] Consolidates RBAC, Secrets, Isolation, and Prod Protection checks.",
      inputSchema: {
        type: "object",
        properties: {
          check: {
            type: "string",
            enum: ["rbac", "secrets", "isolation", "prod-protect", "all"],
            description: "Security aspect to audit",
          },
          path: {
            type: "string",
            description: "Target path (optional)",
          },
        },
        required: ["check"],
      },
    },
    {
      name: "asanmod_infrastructure_check",
      description:
        "[ULTRA CORE] Consolidates PM2, Database, and Cache health checks.",
      inputSchema: {
        type: "object",
        properties: {
          target: {
            type: "string",
            enum: ["pm2", "db", "cache", "all"],
            description: "Infrastructure component to check",
          },
        },
        required: ["target"],
      },
    },
    {
      name: "asanmod_get_todos",
      description:
        "[ULTRA CORE] Global Ultra Todo Array. Scans codebase for TODO, FIXME, NOTE, HACK.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Search path (default: .)",
          },
        },
      },
    },
    {
      name: "asanmod_verify_mcp_only",
      description:
        "[v8.0] Verifies that MCP-only file operations rule is enforced. Checks for forbidden fs imports in asanmod-mcp/src.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Path to check (default: mcp-servers/asanmod-mcp/src)",
          },
        },
      },
    },
    {
      name: "asanmod_core_gateway",
      description:
        "[SHARPEN] Unified gateway for Big 5 tools with anti-error logic. Routes to quality, security, infrastructure, todos, or brain operations.",
      inputSchema: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: [
              "quality",
              "security",
              "infrastructure",
              "todos",
              "brain",
              "all",
            ],
            description: "Operation to perform",
          },
          type: {
            type: "string",
            enum: ["lint", "types", "format", "dead-code", "all"],
            description: "Quality check type (required if operation=quality)",
          },
          check: {
            type: "string",
            enum: ["rbac", "secrets", "isolation", "prod-protect", "all"],
            description: "Security check type (required if operation=security)",
          },
          target: {
            type: "string",
            enum: ["pm2", "db", "cache", "all"],
            description:
              "Infrastructure target (required if operation=infrastructure)",
          },
          query: {
            type: "string",
            description: "Brain query term (required if operation=brain)",
          },
          queryType: {
            type: "string",
            enum: ["patterns", "rules", "commits", "all"],
            description: "Brain query type",
          },
          fix: {
            type: "boolean",
            description: "Auto-repair issues (for quality operation)",
          },
          path: {
            type: "string",
            description: "Target path (optional)",
          },
          mode: {
            type: "string",
            description: "Mode for todos operation",
          },
        },
        required: ["operation"],
      },
    },
    // --- CORE WORKFLOW TOOLS (UNCHANGED) ---
    // [PRUNED v4.7.2] Granular verification tools removed. Use Big 5 instead.
    /* LEGACY TOOLS DEPRECATED v5.0
    {
      name: "asanmod_check_pre_commit",
      description: "Commit öncesi tüm kontrolleri çalıştırır.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    */
    // ... other legacy tools removed ...
    // Actually, let's just cut the block.
    {
      name: "asanmod_pm2_restart",
      description:
        "PM2 process restart with environment variable update. Uses stop/start from ecosystem.config.cjs to ensure env vars are updated (asanmod-dev-backend, asanmod-dev-frontend, asanmod-prod-backend, asanmod-prod-frontend, asanmod-brain).",
      inputSchema: {
        type: "object",
        properties: {
          processName: {
            type: "string",
            enum: [
              "asanmod-dev-backend",
              "asanmod-dev-frontend",
              "asanmod-prod-backend",
              "asanmod-prod-frontend",
              "asanmod-brain",
            ],
            description: "Restart edilecek process adı",
          },
        },
        required: ["processName"],
      },
    },
    {
      name: "asanmod_pm2_stop",
      description:
        "PM2 process stop (asanmod-dev-backend, asanmod-dev-frontend, asanmod-prod-backend, asanmod-prod-frontend, asanmod-brain).",
      inputSchema: {
        type: "object",
        properties: {
          processName: {
            type: "string",
            enum: [
              "asanmod-dev-backend",
              "asanmod-dev-frontend",
              "asanmod-prod-backend",
              "asanmod-prod-frontend",
              "asanmod-brain",
            ],
            description: "Stop edilecek process adı",
          },
        },
        required: ["processName"],
      },
    },
    {
      name: "asanmod_pm2_start",
      description:
        "PM2 process start from ecosystem.config.cjs to ensure correct environment variables (asanmod-dev-backend, asanmod-dev-frontend, asanmod-prod-backend, asanmod-prod-frontend, asanmod-brain).",
      inputSchema: {
        type: "object",
        properties: {
          processName: {
            type: "string",
            enum: [
              "asanmod-dev-backend",
              "asanmod-dev-frontend",
              "asanmod-prod-backend",
              "asanmod-prod-frontend",
              "asanmod-brain",
            ],
            description: "Start edilecek process adı",
          },
        },
        required: ["processName"],
      },
    },
    // [PRUNED v4.7.2] Infra & Deployment tools moved to Big 5 tools

    {
      name: "asanmod_verify_tag_format",
      description:
        "Tag format validation (Rule 11) - X.X.Y formatı, sadece patch (son rakam) artırılabilir.",
      inputSchema: {
        type: "object",
        properties: {
          tag: {
            type: "string",
            description: "Kontrol edilecek tag (format: v1.2.3)",
          },
        },
        required: ["tag"],
      },
    },
    {
      name: "asanmod_session_start",
      description:
        "[CORE] MOD session start için tüm işlemleri tek seferde yapar (9 adım → 1 function). State file, git history, pending tasks, workers status hepsini bir arada döner.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "asanmod_verify_done",
      description:
        "Tüm verification check'lerini tek seferde yapar (8 tool call → 1 function). Lint, production-ready, console errors, PM2 health, TypeScript, build, RBAC, security hepsini bir arada kontrol eder.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Kontrol edilecek path (opsiyonel)",
          },
        },
      },
    },
    {
      name: "asanmod_get_dashboard",
      description:
        "Tüm durumu tek seferde döner (PM2, git, tasks, workers hepsi bir arada). Unified status dashboard - tek tool call ile tüm sistem durumunu görüntüler.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "asanmod_get_pattern",
      description:
        "Workflow pattern'lerini doküman okumadan döner. Smart documentation access - sadece gerekli pattern'i getirir (mod-workflow, worker-workflow, mod-output-style, verification-checklist, all).",
      inputSchema: {
        type: "object",
        properties: {
          patternType: {
            type: "string",
            enum: [
              "mod-workflow",
              "worker-workflow",
              "mod-output-style",
              "verification-checklist",
              "all",
            ],
            description:
              "Pattern tipi (mod-workflow, worker-workflow, mod-output-style, verification-checklist, all)",
          },
        },
        required: ["patternType"],
      },
    },
    {
      name: "asanmod_get_mod_identity",
      description:
        "Memory MCP Optimization - Selective read. Memory MCP'den sadece MOD kimliğini okur (tüm graph yerine). Daha az token, daha hızlı.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "asanmod_get_project_context",
      description:
        "Memory MCP Optimization - Selective read. Memory MCP'den sadece proje context'ini okur (tüm graph yerine). Daha az token, daha hızlı.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "asanmod_update_memory",
      description:
        "Rule değişikliklerini Memory MCP'ye otomatik olarak günceller. Version tracking ve context preservation ile.",
      inputSchema: {
        type: "object",
        properties: {
          ruleChanges: {
            type: "array",
            description:
              "Rule değişiklikleri array'i (detectChanges'dan gelen format)",
            items: {
              type: "object",
              properties: {
                ruleName: { type: "string" },
                changeType: {
                  type: "string",
                  enum: ["added", "modified", "deleted"],
                },
                oldContent: { type: "string" },
                newContent: { type: "string" },
                filePath: { type: "string" },
                lineNumber: { type: "number" },
              },
            },
          },
          path: {
            type: "string",
            description: "Kontrol edilecek path (opsiyonel)",
          },
        },
        required: ["ruleChanges"],
      },
    },
    {
      name: "asanmod_add_pattern",
      description:
        "Yeni pattern'leri Memory MCP'ye otomatik olarak ekler. ASANMOD-specific pattern detection için kullanılır.",
      inputSchema: {
        type: "object",
        properties: {
          patternName: {
            type: "string",
            description: "Pattern adı (örn: PATTERN_ASANMOD_RBAC)",
          },
          description: {
            type: "string",
            description: "Pattern açıklaması",
          },
          source: {
            type: "string",
            description: "Pattern'in bulunduğu yer (file path, task ID, vb.)",
          },
          usage: {
            type: "string",
            description: "Pattern kullanım örneği (opsiyonel)",
          },
          learnedFrom: {
            type: "string",
            description:
              "Pattern'in öğrenildiği kaynak (task ID, date, vb.) (opsiyonel)",
          },
          path: {
            type: "string",
            description: "Kontrol edilecek path (opsiyonel)",
          },
        },
        required: ["patternName", "description", "source"],
      },
    },
    {
      name: "asanmod_detect_patterns",
      description:
        "ASANMOD codebase'de yeni pattern'leri otomatik olarak tespit eder. RBAC, Multi-Tenant, MCP-First, DEV-PROD pattern'lerini bulur.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Kontrol edilecek path (opsiyonel, tüm proje için empty)",
          },
        },
      },
    },
    {
      name: "asanmod_learning",
      description:
        "Task'tan öğrenilen pattern'leri, best practice'leri ve hata pattern'lerini Memory MCP'ye kaydeder. ASANMOD learning system.",
      inputSchema: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "Task ID (opsiyonel)",
          },
          taskDescription: {
            type: "string",
            description: "Task açıklaması (opsiyonel)",
          },
          patterns: {
            type: "array",
            description: "Öğrenilen pattern'ler",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                source: { type: "string" },
                usage: { type: "string" },
              },
            },
          },
          bestPractices: {
            type: "array",
            description: "Best practice'ler",
            items: { type: "string" },
          },
          errors: {
            type: "array",
            description: "Hata pattern'leri (tekrar etmemek için)",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                solution: { type: "string" },
              },
            },
          },
          path: {
            type: "string",
            description: "Kontrol edilecek path (opsiyonel)",
          },
        },
      },
    },
    {
      name: "asanmod_context_load",
      description:
        "Session başlangıcında ASANMOD context'ini otomatik yükler. ASANMOD_PROJECT, pattern'ler, rule'lar ve MCP'leri yükler.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Kontrol edilecek path (opsiyonel)",
          },
        },
      },
    },
    {
      name: "asanmod_auto_sync_memory_from_commit",
      description:
        "Git commit'lerinden otomatik olarak Memory MCP'ye bilgi kaydeder. Post-commit hook'tan otomatik çağrılır. Her commit'te backend, frontend, ASANMOD değişiklikleri Memory MCP'ye işlenir.",
      inputSchema: {
        type: "object",
        properties: {
          commitHash: {
            type: "string",
            description: "Commit hash (opsiyonel, default: HEAD)",
          },
          path: {
            type: "string",
            description: "Kontrol edilecek path (opsiyonel)",
          },
        },
      },
    },
    {
      name: "asanmod_brain_health",
      description: "Brain Daemon durumunu kontrol eder (port 8250).",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "asanmod_brain_stats",
      description:
        "Brain Daemon istatistiklerini döner (entities, observations, error_solutions, patterns).",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "asanmod_brain_query",
      description:
        "[CORE] Brain knowledge base'i sorgular (entities, patterns, solutions).",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Arama sorgusu",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "asanmod_brain_find_error_solution",
      description:
        "Brain'den hata çözümü arar. Error fix commit'leri ve önceki çözümlerden öğrenilen bilgileri döner.",
      inputSchema: {
        type: "object",
        properties: {
          errorMessage: {
            type: "string",
            description: "Hata mesajı",
          },
        },
        required: ["errorMessage"],
      },
    },
    {
      name: "asanmod_brain_learn_error",
      description:
        "Brain'e yeni hata çözümü öğretir. BRAIN block ile commit'lerden otomatik öğrenilir, bu tool manuel öğretme için.",
      inputSchema: {
        type: "object",
        properties: {
          errorMessage: {
            type: "string",
            description: "Hata mesajı",
          },
          solution: {
            type: "string",
            description: "Çözüm açıklaması",
          },
          solutionCode: {
            type: "string",
            description: "Çözüm kodu (opsiyonel)",
          },
          filesChanged: {
            type: "array",
            items: { type: "string" },
            description: "Değiştirilen dosyalar (opsiyonel)",
          },
          pattern: {
            type: "string",
            description: "İlgili pattern (opsiyonel)",
          },
        },
        required: ["errorMessage", "solution"],
      },
    },
    {
      name: "asanmod_brain_sync",
      description: "Force sync between Memory MCP and Brain SQLite.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "asanmod_brain_patterns",
      description: "Brain'deki tüm pattern'leri döner.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "asanmod_brain_auto_suggest",
      description: "Mevcut context'e göre pattern/çözüm önerileri sunar.",
      inputSchema: {
        type: "object",
        properties: {
          context: {
            type: "string",
            description:
              "Context açıklaması (opsiyonel, otomatik algılanabilir)",
          },
          files: {
            type: "array",
            items: { type: "string" },
            description: "İlgili dosyalar",
          },
        },
      },
    },
    {
      name: "asanmod_brain_mark_solution",
      description: "Bir hatanın başarıyla çözüldüğünü işaretler.",
      inputSchema: {
        type: "object",
        properties: {
          errorId: {
            type: "string",
            description: "Hata ID (e.g. Brain'den dönen ID)",
          },
          success: {
            type: "boolean",
            description: "Başarılı mı?",
          },
        },
        required: ["errorId", "success"],
      },
    },
    {
      name: "asanmod_brain_tool_definitions",
      description: "Brain-aware MCP tool tanımlarını döner.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

// CALL TOOL HANDLERS
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // --- CONSOLIDATED TOOLS Handlers ---
      case "asanmod_quality_gate":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await qualityGate(args as any), null, 2),
            },
          ],
        };
      case "asanmod_security_audit":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await securityAudit(args as any), null, 2),
            },
          ],
        };
      case "asanmod_infrastructure_check":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await infrastructureCheck(args as any),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_get_todos":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await getTodos((args as any).path), null, 2),
            },
          ],
        };
      case "asanmod_verify_mcp_only":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await verifyMCPOnly((args as any).path),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_core_gateway":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await coreGateway(args as any), null, 2),
            },
          ],
        };
      case "asanmod_safe_write":
        return {
          content: [
            {
              type: "text",
              text: await safeWrite(args as any),
            },
          ],
        };
      case "asanmod_scaffold":
        return {
          content: [
            {
              type: "text",
              text: await scaffold(args as any),
            },
          ],
        };
      case "asanmod_analyze_impact":
        return await analyzeImpactTool.handler(args as any);

      // --- LEGACY/EXISTING TOOLS Handlers ---
      case "asanmod_verify_lint":
        // [LEGACY] verifyLint is removed. Using placeholder.
        const lintRes = {
          content: [
            { type: "text", text: "Use asanmod_quality_gate instead." },
          ],
        };

        return {
          content: [{ type: "text", text: JSON.stringify(lintRes, null, 2) }],
        };
      case "asanmod_check_production_ready":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await checkProductionReady((args as any).path),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_verify_task":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await verifyTask((args as any).task_id),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_get_rule":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await getRuleInfo((args as any).rule_id),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_check_pre_commit":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await checkPreCommit(), null, 2),
            },
          ],
        };
      case "asanmod_verify_build":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await verifyBuild(), null, 2),
            },
          ],
        };
      case "asanmod_lint_fix":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await lintFix((args as any).path), null, 2),
            },
          ],
        };
      case "asanmod_report_generate":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                generateReport((args as any).context, (args as any).checks),
                null,
                2
              ),
            },
          ],
        };
      // [PRUNED v4.7.2] Granular verification handlers moved to Big 5 tools

      case "asanmod_pm2_restart":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await restartPM2Process((args as any).processName),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_pm2_stop":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await stopPM2Process((args as any).processName),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_pm2_start":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await startPM2Process((args as any).processName),
                null,
                2
              ),
            },
          ],
        };
      // [PRUNED v4.7.2] Infra & Deployment handlers moved to Big 5 tools

      case "asanmod_session_start":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await sessionStart(), null, 2),
            },
          ],
        };
      case "asanmod_verify_done":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await verifyDone((args as any).path),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_get_dashboard":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await getDashboard(), null, 2),
            },
          ],
        };
      case "asanmod_get_pattern":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await getPattern((args as any).patternType),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_get_mod_identity":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await getModIdentity(), null, 2),
            },
          ],
        };
      case "asanmod_get_project_context":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await getProjectContext(), null, 2),
            },
          ],
        };
      case "asanmod_update_memory":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await handleUpdateMemory({
                  ruleChanges: (args as any).ruleChanges,
                  path: (args as any).path,
                }),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_add_pattern":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await handleAddPattern(args as any),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_detect_patterns":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await handleDetectASANMODPatterns((args as any).path),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_learning":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await handleASANMODLearning(args as any),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_context_load":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await handleASANMODContextLoad((args as any).path),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_auto_sync_memory_from_commit":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await autoSyncMemoryFromCommit({
                  commitHash: (args as any).commitHash,
                  path: (args as any).path,
                }),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_brain_health":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await brainHealth(), null, 2),
            },
          ],
        };
      case "asanmod_brain_stats":
        return {
          content: [
            { type: "text", text: JSON.stringify(await brainStats(), null, 2) },
          ],
        };
      case "asanmod_brain_query":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await brainQuery((args as any).query),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_brain_find_error_solution":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await brainFindErrorSolution((args as any).errorMessage),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_brain_learn_error":
        const {
          errorMessage,
          solution,
          solutionCode,
          filesChanged,
          pattern,
          tags,
        } = args as any;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await brainLearnError(errorMessage, solution, {
                  solutionCode,
                  filesChanged,
                  pattern,
                  tags,
                }),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_brain_sync":
        return {
          content: [
            { type: "text", text: JSON.stringify(await brainSync(), null, 2) },
          ],
        };
      case "asanmod_brain_patterns":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await brainPatterns(), null, 2),
            },
          ],
        };
      case "asanmod_brain_auto_suggest":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await brainAutoSuggest(
                  (args as any).errorMessage || (args as any).context
                ),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_brain_mark_solution":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await brainMarkSolution(
                  (args as any).errorId,
                  (args as any).success
                ),
                null,
                2
              ),
            },
          ],
        };
      case "asanmod_brain_tool_definitions":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(brainToolDefinitions, null, 2),
            },
          ],
        };

      // [PRUNED v5.0] Legacy Handlers Removed

      case "asanmod_run_quality_scan":
        return await runQualityScan();

      case "asanmod_run_ui_smoke_test":
        return await runUISmokeTest(args as { path?: string });

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: `Unknown error occurred` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Don't output to stderr - Cursor Agent may parse this incorrectly
  // console.error("ASANMOD MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
