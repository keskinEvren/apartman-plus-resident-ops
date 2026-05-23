---
type: reference
agent_role: architect
context_depth: 4
required_knowledge: ["asanmod_core"]
last_audited: "2026-01-18"
---

# ASANMOD v1.0.0: MCP Server Integration Specification

> **Technical standard for Model Context Protocol (MCP) servers within ASANMOD.**

---

## 🛠️ 1. Core MCP Servers

### 1.1 ASANMOD MCP (`asanmod-mcp`)

- **Binary:** `mcp-servers/asanmod-mcp/dist/index.js`
- **Function:** Enforces ASANMOD quality gates and provides unified diagnostic tools (`quality_gate`, `security_audit`, `infrastructure_check`).

### 1.2 Context MCP (`context-mcp`)

- **Binary:** `mcp-servers/context-mcp/index.js` (Note: JIT compiled or direct Node execution)
- **Function:** Stateful conversation tracking and token optimization.

### 1.3 Git MCP (`git-mcp`)

- **Binary:** `mcp-servers/git-mcp/dist/index.js`
- **Function:** Enforces `type(scope): message` format and zero-tolerance linting on commit.

---

## ⚙️ 2. Runtime Configuration

Configuration must reside in the agent-specific config file (e.g., `package.json` or cursor configuration).

### Path Normalization

Always use absolute paths derived from the current workspace root.

```json
{
  "mcpServers": {
    "asanmod": {
      "command": "node",
      "args": ["mcp-servers/asanmod-mcp/dist/index.js"]
    }
  }
}
```

---

## 🚀 3. Integration & Buildup

Before activating an MCP server, the following build-chain must be verified:

1. **Install:** `npm install` in the specific server directory.
2. **Build:** `npm run build` (Ensures `dist/index.js` exists).
3. **Bind:** Add entry to the primary agent's MCP config.

---

## 🕵️ 4. Diagnostic Tree for MCP Failures

| Symptom                  | Probable Cause                   | Corrective Action                      |
| :----------------------- | :------------------------------- | :------------------------------------- |
| **Server Timeout**       | Binary not found at path.        | Verify `ls [path]` exists.             |
| **Tool Execution Error** | Missing environment variables.   | Sync `.env` to the server context.     |
| **Connection Refused**   | Port collision (TCP-based MCPs). | Run `pm diag` to find ghost processes. |

---

## 🔒 5. Security Constraints

- **No Hardcoded Tokens:** MCP servers must read credentials from environment variables.
- **Strict I/O:** Servers must only output JSON-RPC compliant messages to standard I/O.
- **Audit Logging:** Every MCP tool execution must leave a trace in `logs/mcp-[name].log`.

---

_ASANMOD v1.0.0 | MCP Infrastructure Hardened_
