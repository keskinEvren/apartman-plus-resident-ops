# MCP Server Configuration

> **Model Context Protocol (MCP) servers provide AI agents with direct access to external tools.**

## Available MCPs

### 1. Filesystem MCP
Provides file read/write capabilities.

**Config Example:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem", "/path/to/project"]
    }
  }
}
```

### 2. PostgreSQL MCP
Provides database query capabilities.

**Config Example:**
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/dbname"
      }
    }
  }
}
```

### 3. Context7 MCP
Provides documentation search capabilities.

**Config Example:**
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-context7"]
    }
  }
}
```

## Setup Instructions

1. Copy the example config to your Claude/Cursor settings
2. Replace placeholders with actual paths/credentials
3. Restart the AI assistant

## Wizard Auto-Configuration

The ASANMOD Wizard will automatically generate appropriate MCP configs based on your project setup during `npm run wizard`.
