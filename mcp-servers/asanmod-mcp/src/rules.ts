/**
 * ASANMOD Rule Service
 * Kuralları JSON formatında yönetir, versiyonlama içerir
 */

export interface Rule {
  id: string;
  name: string;
  description: string;
  mandatory: boolean;
  forbiddenWords?: string[];
  checkFunction: string;
  version: string;
}

export const RULES: Record<string, Rule> = {
  "0": {
    id: "0",
    name: "Production-Ready Only",
    description: "Mock, placeholder, TODO, FIXME yasak",
    mandatory: true,
    forbiddenWords: [
      "mock",
      "placeholder",
      "TODO",
      "FIXME",
      "coming soon",
      "later",
      "yakında",
      "fake",
      "dummy",
      "stub",
      "temp",
      "sample",
      "will implement",
      "test-only",
      "henüz yok",
      "şimdilik",
      "boş",
      "örnek",
      "geçici",
    ],
    checkFunction: "check_production_ready",
    version: "3.0",
  },
  "0-TERMINAL": {
    id: "0-TERMINAL",
    name: "Terminal & MCP Operations",
    description: "Kullanıcıya hiçbir şey yaptırma - her şeyi BEN yap",
    mandatory: true,
    checkFunction: "check_terminal_usage",
    version: "3.0",
  },
  "1": {
    id: "1",
    name: "MCP-First Verification",
    description: "Tüm verification MCP ile yapılmalı",
    mandatory: true,
    checkFunction: "check_mcp_usage",
    version: "3.0",
  },
  "2": {
    id: "2",
    name: "Multi-Tenant + RBAC",
    description: "Role-based access control zorunlu",
    mandatory: true,
    checkFunction: "check_rbac",
    version: "3.0",
  },
  "3": {
    id: "3",
    name: "Token Optimization",
    description: "Gereksiz raporlar yok, compact JSON",
    mandatory: false,
    checkFunction: "check_token_usage",
    version: "3.0",
  },
  "4": {
    id: "4",
    name: "Bitti Verification",
    description: "Bitti demeden önce checklist zorunlu",
    mandatory: true,
    checkFunction: "check_verification",
    version: "3.0",
  },
  "0-LINT-QUALITY": {
    id: "0-LINT-QUALITY",
    name: "Lint Quality - Zero Tolerance",
    description:
      "ESLint: 0 error, 0 warning | TypeScript: 0 error, 0 warning | Prettier: 0 formatting issue | Pre-commit hook: Tüm kontroller zorunlu | Commit policy: 0/0 olmadan commit yapılamaz",
    mandatory: true,
    checkFunction: "verify_lint_quality",
    version: "3.1",
  },
  "7": {
    id: "7",
    name: "LINT ZORUNLU",
    description: "Lint errors/warnings varsa iş durur",
    mandatory: true,
    checkFunction: "verify_lint",
    version: "3.0",
  },
  "11": {
    id: "11",
    name: "Tag Format Validation",
    description:
      "Tag formatı X.X.Y olmalı, sadece patch (son rakam) artırılabilir",
    mandatory: true,
    checkFunction: "verify_tag_format",
    version: "2.1",
  },
};

export function getRule(ruleId: string): Rule | null {
  return RULES[ruleId] || null;
}

export function getAllRules(): Rule[] {
  return Object.values(RULES);
}

export function getMandatoryRules(): Rule[] {
  return Object.values(RULES).filter((rule) => rule.mandatory);
}

// MOD Output Style Rules
export interface MODOutputStyle {
  requiredFormats: string[];
  forbiddenFormats: string[];
  templates: Record<string, string>;
}

export const MOD_OUTPUT_STYLE: MODOutputStyle = {
  requiredFormats: [
    "Tablo format (╔═══╗) - Görsel",
    "Checklist format (✅ ❌ ⏳ 🔄) - Status",
    "Emoji + Metrik + Dosya Ref - Compact",
    "Kısa insight (1-2 cümle max) - Token optimization",
    "JSON format (compact) - Opsiyonel",
  ],
  forbiddenFormats: [
    "Uzun açıklamalar",
    "Kod blokları User'a",
    "Teknik detaylar User'a",
  ],
  templates: {
    sessionResume:
      "╔════════════════════════════════════════════════════════╗\n║         MOD SESSION RESUME - Status Report            ║\n╠════════════════════════════════════════════════════════╣\n║ Active Workers: {count}                                ║\n╚════════════════════════════════════════════════════════╝",
    taskAssignment:
      "📋 Task Assigned: {task_name}\n👷 Worker: {worker_id}\n📁 Files: {file_count} files\n⏱️  Estimated: {time}\n📊 Status: ⏳ Pending",
    verificationReport:
      "╔════════════════════════════════════════════════════════╗\n║         MOD VERIFICATION REPORT - {worker_id}          ║\n╠════════════════════════════════════════════════════════╣\n║ ✅ TypeScript: {errors} errors                        ║\n║ ✅ Build: {status}                                    ║\n║ ✅ Console Errors: {count} found                      ║\n╚════════════════════════════════════════════════════════╝",
  },
};

// Workflow Patterns
export interface WorkflowPattern {
  mod: string[];
  worker: string[];
}

export const WORKFLOW_PATTERNS: WorkflowPattern = {
  mod: [
    "Session start → State file oku + Git history parse et",
    "Task assign → Template kullan (3-5 satır) + State file güncelle",
    "Worker 'bitti' → MCP re-verify (ZORUNLU):",
    "  - npm run lint → errors: 0, warnings: 0 (ZORUNLU!)",
    "  - code_analysis.build_check() → exitCode: 0",
    "  - playwright.console_errors() → errorCount: 0",
    "Lint check FAIL → REJECT! Worker'a düzeltmesini söyle!",
    "Compare: Worker output vs MOD output",
    "Match → ACCEPT, No match → REJECT",
    "Commit → State file ile birlikte commit (identity: [MOD])",
    "Report → JSON format (compact)",
  ],
  worker: [
    "Read task → Template uygula",
    "Execute → Real tools (MCP)",
    "Pre-commit checks (ZORUNLU - HEPsi 0 olmalı!):",
    "  - npm run lint → errors: 0, warnings: 0 (ZORUNLU!)",
    "  - code_analysis.typescript_check() → exitCode: 0",
    "  - code_analysis.build_check() → exitCode: 0",
    "  - playwright.console_errors() → errorCount: 0",
    "Lint check FAIL → İŞ DURDUR! Düzelt, sonra devam et!",
    "Commit → 1 file = 1 commit (identity tag ile: [W1], [W2], vb.)",
    "State update → .state/current-status.json güncelle (otomatik)",
    "Report → Compact JSON (ham veri)",
  ],
};

// MCP List (12 Total - Updated 2026-11-11)
export const MCP_LIST = [
  "postgres-official - Database queries, Prisma verification",
  "git (custom) - Git operations, commit management",
  "filesystem - File operations, directory management",
  "sequential-thinking - Complex problems, reasoning",
  "memory - Persistent memory, context retention",
  "everything - General utilities, helper functions",
  "asanmod - ASANMOD rule verification and checks",
  "cursor-ide-browser (optional) - Manual browser automation (debug/smoke)",
  "prisma - Database schema management, migrations",
  "gemini - AI queries, error solutions, code analysis",
  "security-check - Security scanning, code vulnerability detection (Semgrep alternatifi)",
  "context7 - Library documentation, code examples",
];

// Verification Checklist
export interface VerificationChecklist {
  priority1: string[];
  priority2: string[];
  priority3: string[];
  rejectionCriteria: string[];
}

export const VERIFICATION_CHECKLIST: VerificationChecklist = {
  priority1: [
    "grep -r 'mock\\|placeholder\\|TODO\\|FIXME' . → 0 sonuç",
    "Tüm task'lar tamamlandı mı?",
  ],
  priority2: ["npm run lint → errors: 0, warnings: 0"],
  priority3: [
    "code_analysis.build_check() → exitCode: 0",
    "code_analysis.typescript_check() → errorCount: 0",
    "playwright.console_errors() → errorCount: 0",
    "pm2 status → All processes online",
    "postgres.count() → Database claims match",
  ],
  rejectionCriteria: [
    "Mock/placeholder bulundu → 'BİTMEDİ!'",
    "TODO/FIXME bulundu → 'BİTMEDİ!'",
    "Task eksik → 'BİTMEDİ!'",
    "Lint errors > 0 → 'BİTMEDİ! Lint errors düzelt!'",
    "Console errors > 0 → 'BİTMEDİ!'",
    "Build fail → 'BİTMEDİ!'",
  ],
};
