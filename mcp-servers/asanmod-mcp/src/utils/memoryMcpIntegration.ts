/**
 * Memory MCP Integration for File Content Cache
 * Optional integration: Syncs file content cache to Memory MCP for persistence
 */

import { readFileSync, existsSync } from "fs";

export interface FileContentEntity {
  name: string;
  entityType: string;
  observations: string[];
}

/**
 * Create Memory MCP entity for file content
 */
export function createFileContentEntity(
  filePath: string,
  content: string,
  hash: string
): FileContentEntity {
  return {
    name: `FILE_CONTENT:${filePath}`,
    entityType: "FILE_CONTENT",
    observations: [
      `File path: ${filePath}`,
      `Content hash: ${hash}`,
      `Content length: ${content.length} characters`,
      `Content preview: ${content.substring(0, 500)}...`,
      // Store full content as observation (Memory MCP supports large observations)
      `FULL_CONTENT:${content}`,
    ],
  };
}

/**
 * Extract file content from Memory MCP entity
 */
export function extractFileContentFromEntity(
  entity: FileContentEntity
): string | null {
  const fullContentObs = entity.observations.find((obs) =>
    obs.startsWith("FULL_CONTENT:")
  );
  if (!fullContentObs) return null;

  return fullContentObs.substring("FULL_CONTENT:".length);
}

/**
 * Check if Memory MCP is available
 * Note: This is a placeholder - actual implementation would check MCP server availability
 */
export function isMemoryMCPAvailable(): boolean {
  // Check if Memory MCP path exists
  const memoryPaths = [
    process.env.MEMORY_MCP_PATH,
    "/root/.npm/_npx/15b07286cbcc3329/node_modules/@modelcontextprotocol/server-memory/dist/memory.jsonl",
  ];

  return memoryPaths.some((path) => path && existsSync(path));
}

/**
 * Sync file content to Memory MCP (optional)
 * This function should be called by the agent using mcp_memory_create_entities
 */
export function getFileContentMemoryFormat(
  filePath: string,
  content: string,
  hash: string
): {
  entities: Array<{ name: string; entityType: string; observations: string[] }>;
} {
  return {
    entities: [createFileContentEntity(filePath, content, hash)],
  };
}

/**
 * Search file content in Memory MCP
 * Returns Memory MCP query format
 */
export function getFileContentSearchQuery(filePath: string): string {
  return `FILE_CONTENT:${filePath}`;
}
