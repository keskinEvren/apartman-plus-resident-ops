#!/usr/bin/env node

/**
 * ASANMOD v1.0.0 - Command Validator (Immutable Guardrail)
 *
 * Validates agent commands before execution.
 * Rejects direct PM2 calls and suggests correct wrapper usage.
 *
 * Usage: node scripts/mod-tools/validate-command.cjs "<command>"
 *
 * @example
 * node scripts/mod-tools/validate-command.cjs "pm2 restart app-prod"
 * → REJECT, suggests: ./scripts/mod-tools/pm prod restart
 */

const FORBIDDEN_PATTERNS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ASANMOD v1.0.0 CRITICAL: BYPASS PREVENTION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /--no-verify/i,
    reason: "🚨 CRITICAL: Git hook bypass flag detected",
    suggestion: () =>
      "ASANMOD CRITICAL: Never use --no-verify! It bypasses all security checks. Remove this flag and run a proper commit.",
  },
  {
    pattern: /pm2\s+delete/i,
    reason: "Direct PM2 delete operation (dangerous)",
    suggestion: () =>
      "Use ./scripts/mod-tools/pm prod stop instead. Direct delete bypasses ASANMOD controls.",
  },
  {
    pattern: /pm2\s+scale/i,
    reason: "Direct PM2 scale operation",
    suggestion: () =>
      "Contact system administrator for scaling operations. Direct pm2 scale is not allowed.",
  },
  {
    pattern: /pm2\s+monit/i,
    reason: "Direct PM2 monit command",
    suggestion: () =>
      "Use ./scripts/mod-tools/pm prod status for monitoring. Direct pm2 monit bypasses wrapper.",
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // UNIVERSAL PATTERNS (No hardcoded project names)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /pm2\s+(restart|stop|start|logs|show)\s+app-(prod|dev)/i,
    reason: "Direct PM2 command with process name",
    suggestion: (match) => {
      const action = match[1].toLowerCase();
      const env = match[2].toLowerCase();
      return `./scripts/mod-tools/pm ${env} ${action}`;
    },
  },
  {
    pattern: /pm2\s+restart\s+all/i,
    reason: "Direct PM2 restart all",
    suggestion: () => "./scripts/mod-tools/pm prod restart",
  },
  {
    pattern: /pm2\s+logs\s+app-/i,
    reason: "Direct PM2 logs command",
    suggestion: () => "./scripts/mod-tools/pm prod logs",
  },
  {
    pattern: /console\.log\s*\(/i,
    reason: "Console.log in backend code",
    suggestion: () =>
      "Use proper logging or remove console.log (blocked by pre-commit hook)",
  },
  {
    pattern: /prisma\s+migrate\s+dev/i,
    reason: "Prisma migrate without proper setup",
    suggestion: () => "npx prisma migrate dev --name <descriptive_name>",
  },
];

const VALID_PATTERNS = [
  /\.\/scripts\/mod-tools\/pm/,
  /npm\s+run\s+(verify|fix|deploy|dev|status|scan|format)/,
  /npx\s+prisma/,
  /node\s+scripts\/mod-tools\//,
];

function validateCommand(command) {
  const normalizedCommand = command.trim();

  // Check if it's a valid pattern first
  for (const pattern of VALID_PATTERNS) {
    if (pattern.test(normalizedCommand)) {
      return {
        valid: true,
        command: normalizedCommand,
      };
    }
  }

  // Check for forbidden patterns
  for (const { pattern, reason, suggestion } of FORBIDDEN_PATTERNS) {
    const match = normalizedCommand.match(pattern);
    if (match) {
      return {
        valid: false,
        command: normalizedCommand,
        reason,
        suggestion: suggestion(match),
      };
    }
  }

  // Unknown command - neither valid nor forbidden
  return {
    valid: true,
    command: normalizedCommand,
    warning: "Command not in known patterns, proceed with caution",
  };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node validate-command.cjs "<command>"');
    console.log("");
    console.log("Examples:");
    console.log('  node validate-command.cjs "pm2 restart app-prod"');
    console.log(
      '  node validate-command.cjs "./scripts/mod-tools/pm prod restart"',
    );
    process.exit(0);
  }

  const command = args.join(" ");
  const result = validateCommand(command);

  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  🛡️  ASANMOD v1.0.0 COMMAND VALIDATOR                   ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`📝 Command: "${command}"`);
  console.log("");

  if (result.valid) {
    console.log("✅ VALID - Command is allowed");
    if (result.warning) {
      console.log(`⚠️  Warning: ${result.warning}`);
    }
    process.exit(0);
  } else {
    console.log("❌ REJECTED - Command violates ASANMOD rules");
    console.log("");
    console.log(`📛 Reason: ${result.reason}`);
    console.log("");
    console.log("💡 Use instead:");
    console.log(`   ${result.suggestion}`);
    console.log("");
    console.log("─────────────────────────────────────────────────────────");
    console.log("📖 Reference: docs/AGENT_QUICK_REF.md");
    process.exit(1);
  }
}

main();
