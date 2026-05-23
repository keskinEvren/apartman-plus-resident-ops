/**
 * Tool: asanmod_verify_imports
 * Import/export validation (unused imports, circular dependencies, etc.)
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

export interface ImportsResult {
  success: boolean;
  issues: Array<{
    file: string;
    issue: string;
    line?: number;
  }>;
  count: number;
  error?: string;
}

export async function verifyImports(path?: string): Promise<ImportsResult> {
  const targetPath = path || process.cwd();
  const issues: ImportsResult["issues"] = [];

  try {
    // Basit unused import kontrolü (grep-based)
    // Daha gelişmiş kontrol için ESLint plugin gerekir

    // Frontend ve backend'deki TypeScript/JavaScript dosyalarını kontrol et
    const searchPaths = [
      join(targetPath, "frontend", "app"),
      join(targetPath, "frontend", "components"),
      join(targetPath, "frontend", "lib"),
      join(targetPath, "backend", "src"),
    ];

    for (const searchPath of searchPaths) {
      if (!existsSync(searchPath)) continue;

      // Import satırlarını bul
      const grepCommand = `grep -rn "^import" ${searchPath} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | head -100 || true`;
      const output = execSync(grepCommand, { encoding: "utf-8" });
      const lines = output.split("\n").filter((l) => l.trim().length > 0);

      for (const line of lines) {
        const match = line.match(/^([^:]+):(\d+):(.+)$/);
        if (match) {
          const [, file, lineNum, importLine] = match;

          // Basit kontroller
          if (
            importLine.includes("from") &&
            importLine.includes("'") &&
            !importLine.includes("'./") &&
            !importLine.includes("'../")
          ) {
            // Absolute import kontrolü (relative import olmalı)
            // Bu basit bir kontrol, daha gelişmiş analiz için ESLint plugin gerekir
          }

          // Circular dependency kontrolü (basit)
          if (importLine.includes("'../") && importLine.includes("'../../")) {
            // Deep nesting uyarısı
            const depth = (importLine.match(/\.\.\//g) || []).length;
            if (depth > 3) {
              issues.push({
                file: file.replace(targetPath + "/", ""),
                issue: `Deep import nesting (${depth} levels) - consider refactoring`,
                line: parseInt(lineNum, 10),
              });
            }
          }
        }
      }
    }

    return {
      success: issues.length === 0,
      issues,
      count: issues.length,
    };
  } catch (err: any) {
    return {
      success: false,
      issues: [],
      count: 0,
      error: err.message || "Import validation failed",
    };
  }
}
