import { join } from "path";
import { getWorkspaceRoot } from "../utils/paths.js";
import { searchFilesMCP, readMultipleFilesMCP } from "../utils/mcpClient.js";

export interface TodoItem {
  file: string;
  line: number;
  type: "TODO" | "FIXME" | "NOTE" | "HACK" | "XXX";
  content: string;
  assignee?: string; // Extracted from content if present e.g. @MOD
}

export interface GetTodosResult {
  todos: TodoItem[];
  count: number;
  countsByType: Record<string, number>;
}

/**
 * v8.0: MCP-only implementation with concurrency/time budget
 */
export async function getTodos(path: string = "."): Promise<GetTodosResult> {
  const todos: TodoItem[] = [];
  const countsByType: Record<string, number> = {
    TODO: 0,
    FIXME: 0,
    NOTE: 0,
    HACK: 0,
    XXX: 0,
  };

  // Time budget: 30 seconds max
  const TIME_BUDGET_MS = 30000;
  const startTime = Date.now();

  // Concurrency limit: max 50 files read in parallel
  const MAX_CONCURRENT_READS = 50;

  try {
    // Use getWorkspaceRoot to find the correct project root
    const workspaceRoot = getWorkspaceRoot(import.meta.url);
    const searchPath = path === "." ? workspaceRoot : join(workspaceRoot, path);

    // Step 1: Search for source files using MCP (parallel patterns)
    const patterns = ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"];
    const searchPromises = patterns.map((pattern) =>
      searchFilesMCP(pattern, searchPath)
    );
    const searchResults = await Promise.allSettled(searchPromises);

    // Collect all unique file paths
    const codeFilesSet = new Set<string>();
    for (const result of searchResults) {
      if (result.status === "fulfilled") {
        result.value.forEach((file) => codeFilesSet.add(file));
      }
    }

    const codeFiles = Array.from(codeFilesSet);

    // Limit files to prevent timeout (max 1000 files)
    const limitedFiles = codeFiles.slice(0, 1000);

    // Step 2: Read files in batches (concurrency limit)
    const lines: string[] = [];
    const batches: string[][] = [];
    for (let i = 0; i < limitedFiles.length; i += MAX_CONCURRENT_READS) {
      batches.push(limitedFiles.slice(i, i + MAX_CONCURRENT_READS));
    }

    for (const batch of batches) {
      // Check time budget
      if (Date.now() - startTime > TIME_BUDGET_MS) {
        process.stderr.write(
          `[getTodos] Time budget exceeded (${TIME_BUDGET_MS}ms), stopping.\n`
        );
        break;
      }

      // Read batch using MCP readMultipleFilesMCP
      try {
        const fileContents = await readMultipleFilesMCP(batch);

        // Process each file's content
        for (const [filePath, content] of fileContents.entries()) {
          const fileLines = content.split("\n");
          fileLines.forEach((line, index) => {
            if (/TODO|FIXME|NOTE|HACK|XXX/i.test(line)) {
              lines.push(`${filePath}:${index + 1}:${line.trim()}`);
            }
          });
        }
      } catch (batchError) {
        // Skip batch if read fails, continue with next batch
        process.stderr.write(
          `[getTodos] Batch read failed: ${batchError instanceof Error ? batchError.message : "Unknown error"}\n`
        );
        continue;
      }
    }

    for (const line of lines) {
      try {
        // Format: file:line:content
        const parts = line.split(":");
        if (parts.length < 3) continue;

        const file = parts[0];
        const lineNum = parseInt(parts[1], 10);
        if (isNaN(lineNum)) continue;

        const contentRaw = parts.slice(2).join(":").trim();
        if (!contentRaw) continue;

        // Extract type
        const typeMatch = contentRaw.match(/(TODO|FIXME|NOTE|HACK|XXX)/);
        const type = (typeMatch ? typeMatch[0] : "TODO") as TodoItem["type"];

        // Extract content (remove type prefix)
        const content = contentRaw
          .replace(/^(TODO|FIXME|NOTE|HACK|XXX)[:\s]*/, "")
          .trim();

        // Extract assignee (@name)
        const assigneeMatch = content.match(/@(\w+)/);
        const assignee = assigneeMatch ? assigneeMatch[1] : undefined;

        todos.push({
          file,
          line: lineNum,
          type,
          content,
          assignee,
        });

        countsByType[type]++;
      } catch (lineError) {
        // Skip invalid lines, continue processing
        continue;
      }
    }
  } catch (error) {
    // Top-level error handling
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    // Return empty result with error info in details if needed
    // For now, just return empty list to not break the flow
    return {
      todos: [],
      count: 0,
      countsByType: {
        TODO: 0,
        FIXME: 0,
        NOTE: 0,
        HACK: 0,
        XXX: 0,
      },
    };
  }

  return {
    todos,
    count: todos.length,
    countsByType,
  };
}
