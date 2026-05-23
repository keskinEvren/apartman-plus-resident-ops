/**
 * Tool: asanmod_verify_typescript
 * TypeScript hatalarını kontrol eder (frontend + backend)
 */

import { execSync } from "child_process";
import { join } from "path";
import { existsSync } from "fs";
import { fileExistsMCP } from "../utils/mcpClient.js";
import { getWorkspaceRoot } from "../utils/paths.js";

export interface TypeScriptResult {
  success: boolean;
  errors: number;
  frontend: {
    success: boolean;
    errors: number;
    output?: string;
  };
  backend: {
    success: boolean;
    errors: number;
    output?: string;
  };
  error?: string;
}

export async function verifyTypeScript(
  path?: string
): Promise<TypeScriptResult> {
  try {
    // Use getWorkspaceRoot to find the correct project root
    const workspaceRoot = getWorkspaceRoot(import.meta.url);
    const targetPath = path || workspaceRoot;
    const frontendPath = join(targetPath, "frontend");
    const backendPath = join(targetPath, "backend");

    const result: TypeScriptResult = {
      success: true,
      errors: 0,
      frontend: { success: true, errors: 0 },
      backend: { success: true, errors: 0 },
    };

    // Frontend TypeScript check
    if (existsSync(frontendPath)) {
      try {
        const tsCheck = execSync(`npx tsc --noEmit 2>&1 || true`, {
          encoding: "utf-8",
          maxBuffer: 10 * 1024 * 1024,
          cwd: frontendPath,
        });

        const errorMatch = tsCheck.match(/Found (\d+) error/i);
        const errors = errorMatch ? parseInt(errorMatch[1], 10) : 0;

        result.frontend = {
          success: errors === 0,
          errors,
          output: errors > 0 ? tsCheck.substring(0, 2000) : undefined,
        };

        result.errors += errors;
      } catch (err: any) {
        result.frontend = {
          success: false,
          errors: 1,
          output: err.message || "TypeScript check failed",
        };
        result.errors += 1;
      }
    }

    // Backend TypeScript check
    if (existsSync(backendPath)) {
      try {
        // Backend'de tsconfig.json var mı kontrol et
        const tsconfigPath = join(backendPath, "tsconfig.json");
        if (existsSync(tsconfigPath)) {
          const tsCheck = execSync(`npx tsc --noEmit 2>&1 || true`, {
            encoding: "utf-8",
            maxBuffer: 10 * 1024 * 1024,
            cwd: backendPath,
          });

          const errorMatch = tsCheck.match(/Found (\d+) error/i);
          const errors = errorMatch ? parseInt(errorMatch[1], 10) : 0;

          result.backend = {
            success: errors === 0,
            errors,
            output: errors > 0 ? tsCheck.substring(0, 2000) : undefined,
          };

          result.errors += errors;
        }
      } catch (err: any) {
        result.backend = {
          success: false,
          errors: 1,
          output: err.message || "TypeScript check failed",
        };
        result.errors += 1;
      }
    }

    result.success = result.errors === 0;

    return result;
  } catch (error) {
    return {
      success: false,
      errors: 1,
      frontend: {
        success: false,
        errors: 1,
        output:
          error instanceof Error ? error.message : "TypeScript check failed",
      },
      backend: {
        success: false,
        errors: 0,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
