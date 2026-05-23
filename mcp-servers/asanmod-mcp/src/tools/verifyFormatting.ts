/**
 * Tool: asanmod_verify_formatting
 * Code formatting kontrolü (Prettier)
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "../utils/paths.js";

export interface FormattingResult {
  success: boolean;
  unformattedFiles: string[];
  count: number;
  error?: string;
}

export async function verifyFormatting(
  path?: string
): Promise<FormattingResult> {
  try {
    // Use getWorkspaceRoot to find the correct project root
    const workspaceRoot = getWorkspaceRoot(import.meta.url);
    const targetPath = path || workspaceRoot;
    const frontendPath = join(targetPath, "frontend");
    const backendPath = join(targetPath, "backend");

    const allUnformattedFiles: string[] = [];

    // Frontend Prettier check
    if (existsSync(frontendPath)) {
      try {
        const prettierConfigs = [
          ".prettierrc",
          ".prettierrc.json",
          ".prettierrc.js",
          "prettier.config.js",
          "package.json",
        ];

        let hasPrettierConfig = false;
        for (const config of prettierConfigs) {
          if (existsSync(join(frontendPath, config))) {
            hasPrettierConfig = true;
            break;
          }
        }

        if (hasPrettierConfig) {
          const checkCommand = `npx prettier --check "**/*.{ts,tsx,js,jsx,json,css,scss,md}" --ignore-path .gitignore 2>&1 || true`;
          const output = execSync(checkCommand, {
            encoding: "utf-8",
            maxBuffer: 10 * 1024 * 1024,
            cwd: frontendPath,
          });

          const lines = output.split("\n");
          for (const line of lines) {
            if (
              line.includes("Code style issues found") ||
              line.match(/^[^\s]+\s+$/)
            ) {
              const match = line.match(/^([^\s]+)/);
              if (
                match &&
                !match[1].includes("node_modules") &&
                !match[1].includes(".next")
              ) {
                allUnformattedFiles.push(`frontend/${match[1]}`);
              }
            }
          }
        }
      } catch (err: any) {
        // Ignore frontend errors, continue with backend
      }
    }

    // Backend Prettier check
    if (existsSync(backendPath)) {
      try {
        const prettierConfigs = [
          ".prettierrc",
          ".prettierrc.json",
          ".prettierrc.js",
          "prettier.config.js",
          "package.json",
        ];

        let hasPrettierConfig = false;
        for (const config of prettierConfigs) {
          if (existsSync(join(backendPath, config))) {
            hasPrettierConfig = true;
            break;
          }
        }

        if (hasPrettierConfig) {
          const checkCommand = `npx prettier --check "**/*.{js,ts,json,md}" --ignore-path .gitignore 2>&1 || true`;
          const output = execSync(checkCommand, {
            encoding: "utf-8",
            maxBuffer: 10 * 1024 * 1024,
            cwd: backendPath,
          });

          const lines = output.split("\n");
          for (const line of lines) {
            if (
              line.includes("Code style issues found") ||
              line.match(/^[^\s]+\s+$/)
            ) {
              const match = line.match(/^([^\s]+)/);
              if (match && !match[1].includes("node_modules")) {
                allUnformattedFiles.push(`backend/${match[1]}`);
              }
            }
          }
        }
      } catch (err: any) {
        // Ignore backend errors
      }
    }

    return {
      success: allUnformattedFiles.length === 0,
      unformattedFiles: allUnformattedFiles,
      count: allUnformattedFiles.length,
    };
  } catch (error) {
    return {
      success: false,
      unformattedFiles: [],
      count: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
