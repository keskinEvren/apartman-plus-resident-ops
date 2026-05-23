# MCP Server Setup

Model Context Protocol (MCP) servers provide AI assistants with direct access to your codebase and database.

## 1. Configure Template

Copy and customize the configuration template:

```bash
cd mcp-servers
cp config.template.json config.json
```

## 2. Update Placeholders

Edit `config.json` and replace:

- `${PROJECT_ROOT}` → **Absolute path** to your project directory
  - Example: `/home/user/projects/my-app`
- `${DATABASE_URL}` → Your PostgreSQL connection string
  - Example: `postgresql://user:pass@localhost:5432/mydb`

## 3. Add to AI Assistant

### For Claude Desktop

Add the entire `config.json` content to Claude's MCP configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

### For Cursor

Cursor automatically detects MCP servers in project root. No additional configuration needed.

## 4. Restart AI Assistant

Restart Claude Desktop or Cursor to load the MCP servers.

## 5. Verify

Ask your AI assistant:

> "List available MCP tools"

You should see tools for filesystem access and database queries.

## Available Services

- **Filesystem Server**: Read/write project files
- **PostgreSQL Server**: Query database, inspect schema
- **Git Server** (optional): Git operations
- **SSH Server** (optional): Remote server access

## Security Notes

⚠️ **NEVER commit `config.json` to version control!**

The `.gitignore` is configured to exclude it, but verify:

```bash
git status | grep config.json
# Should return nothing
```
