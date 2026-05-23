/**
 * ASANMOD MCP Tool: comprehensiveChangeDetection
 * Codebase, database, environment değişikliklerini kapsamlı olarak tespit eder
 *
 * Seviye 2: Codebase + Database Entegrasyonu
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";

interface ComprehensiveChangeDetectionResult {
  success: boolean;
  commitHash: string;
  timestamp: string;
  codebaseChanges: {
    backend: FileChange[];
    frontend: FileChange[];
    asanmod: FileChange[];
    docs: FileChange[];
    other: FileChange[];
  };
  databaseChanges: {
    migrations: MigrationChange[];
    schemaChanges: SchemaChange[];
  };
  environmentChanges: {
    envFiles: EnvFileChange[];
    configFiles: ConfigFileChange[];
  };
  significantChanges: {
    newFiles: string[];
    deletedFiles: string[];
    largeRefactorings: string[];
    architectureChanges: string[];
  };
  memoryObservationsFormat: Array<{
    entityName: string;
    contents: string[];
  }>;
  errors: string[];
}

interface FileChange {
  filePath: string;
  changeType: "added" | "modified" | "deleted";
  linesChanged: number;
  size: number;
  module?: string;
}

interface MigrationChange {
  migrationFile: string;
  changeType: "added" | "modified";
  description?: string;
  timestamp: string;
}

interface SchemaChange {
  modelName?: string;
  changeType: "added" | "modified" | "deleted";
  fieldName?: string;
  changeDescription: string;
}

interface EnvFileChange {
  filePath: string;
  variablesAdded: string[];
  variablesModified: string[];
  variablesDeleted: string[];
}

interface ConfigFileChange {
  filePath: string;
  changeType: "added" | "modified" | "deleted";
  changeDescription: string;
}

/**
 * Project root detection
 */
function getProjectRoot(): string {
  let projectRoot = process.env.WORKSPACE_ROOT || "";

  if (!projectRoot) {
    let currentDir = process.cwd();
    for (let i = 0; i < 5; i++) {
      if (
        existsSync(join(currentDir, "docs", "workflow", "ASANMOD-MASTER.md"))
      ) {
        projectRoot = currentDir;
        break;
      }
      currentDir = join(currentDir, "..");
    }
  }

  return projectRoot || process.cwd();
}

/**
 * Get changed files from commit
 */
function getChangedFiles(commitHash: string, projectRoot: string): string[] {
  try {
    const files = execSync(
      `git diff-tree --no-commit-id --name-only -r ${commitHash}`,
      {
        encoding: "utf-8",
        cwd: projectRoot,
      }
    )
      .trim()
      .split("\n")
      .filter((f) => f.trim());

    return files;
  } catch (error) {
    return [];
  }
}

/**
 * Categorize files
 */
function categorizeFile(filePath: string): {
  category: "backend" | "frontend" | "asanmod" | "docs" | "other";
  module?: string;
} {
  if (filePath.startsWith("backend/")) {
    // Extract module from path
    const moduleMatch = filePath.match(
      /backend\/(src|scripts|prisma)\/([^/]+)/
    );
    const module = moduleMatch ? moduleMatch[2] : "backend";
    return { category: "backend", module };
  } else if (filePath.startsWith("frontend/")) {
    const moduleMatch = filePath.match(
      /frontend\/(app|components|lib)\/([^/]+)/
    );
    const module = moduleMatch ? moduleMatch[2] : "frontend";
    return { category: "frontend", module };
  } else if (filePath.includes("asanmod") || filePath.includes("ASANMOD")) {
    return { category: "asanmod" };
  } else if (filePath.startsWith("docs/")) {
    return { category: "docs" };
  } else {
    return { category: "other" };
  }
}

/**
 * Detect database migration changes
 */
function detectMigrationChanges(
  commitHash: string,
  projectRoot: string
): MigrationChange[] {
  const migrations: MigrationChange[] = [];

  try {
    // Get changed files in prisma/migrations
    const changedFiles = getChangedFiles(commitHash, projectRoot);
    const migrationFiles = changedFiles.filter((f) =>
      f.includes("prisma/migrations/")
    );

    for (const file of migrationFiles) {
      const fullPath = join(projectRoot, file);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, "utf-8");
        const stats = statSync(fullPath);

        // Extract migration description from filename or content
        const migrationMatch = file.match(/migrations\/(\d+)_(.+)\.sql/);
        const description = migrationMatch
          ? migrationMatch[2]
          : "Unknown migration";

        migrations.push({
          migrationFile: file,
          changeType: "added", // New migrations are always added
          description,
          timestamp: stats.mtime.toISOString(),
        });
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return migrations;
}

/**
 * Detect Prisma schema changes
 */
function detectSchemaChanges(
  commitHash: string,
  projectRoot: string
): SchemaChange[] {
  const changes: SchemaChange[] = [];

  try {
    const schemaPath = join(projectRoot, "backend/prisma/schema.prisma");
    if (!existsSync(schemaPath)) {
      return changes;
    }

    // Get git diff for schema file
    const gitDiff = execSync(
      `git diff ${commitHash}~1 ${commitHash} -- "${schemaPath}" 2>/dev/null || echo ""`,
      {
        encoding: "utf-8",
        cwd: projectRoot,
      }
    ).trim();

    if (!gitDiff) {
      return changes;
    }

    // Parse schema changes
    const lines = gitDiff.split("\n");
    let currentModel: string | undefined;

    for (const line of lines) {
      // Detect model changes
      if (line.startsWith("+") && line.includes("model ")) {
        const modelMatch = line.match(/model\s+(\w+)/);
        if (modelMatch) {
          currentModel = modelMatch[1];
          changes.push({
            modelName: currentModel,
            changeType: "added",
            changeDescription: `New model: ${currentModel}`,
          });
        }
      } else if (line.startsWith("-") && line.includes("model ")) {
        const modelMatch = line.match(/model\s+(\w+)/);
        if (modelMatch) {
          changes.push({
            modelName: modelMatch[1],
            changeType: "deleted",
            changeDescription: `Deleted model: ${modelMatch[1]}`,
          });
        }
      } else if (line.startsWith("+") && line.match(/\s+\w+\s+\w+/)) {
        // Field added
        const fieldMatch = line.match(/\s+(\w+)\s+(\w+)/);
        if (fieldMatch && currentModel) {
          changes.push({
            modelName: currentModel,
            fieldName: fieldMatch[1],
            changeType: "added",
            changeDescription: `Field added: ${currentModel}.${fieldMatch[1]}`,
          });
        }
      } else if (line.startsWith("-") && line.match(/\s+\w+\s+\w+/)) {
        // Field deleted
        const fieldMatch = line.match(/\s+(\w+)\s+(\w+)/);
        if (fieldMatch && currentModel) {
          changes.push({
            modelName: currentModel,
            fieldName: fieldMatch[1],
            changeType: "deleted",
            changeDescription: `Field deleted: ${currentModel}.${fieldMatch[1]}`,
          });
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return changes;
}

/**
 * Detect environment file changes
 */
function detectEnvChanges(
  commitHash: string,
  projectRoot: string
): EnvFileChange[] {
  const changes: EnvFileChange[] = [];

  try {
    const envFiles = [
      "backend/.env",
      "backend/.env.dev",
      "backend/.env.prod",
      ".env",
      ".env.local",
    ];

    for (const envFile of envFiles) {
      const fullPath = join(projectRoot, envFile);
      if (!existsSync(fullPath)) {
        continue;
      }

      // Get git diff
      const gitDiff = execSync(
        `git diff ${commitHash}~1 ${commitHash} -- "${fullPath}" 2>/dev/null || echo ""`,
        {
          encoding: "utf-8",
          cwd: projectRoot,
        }
      ).trim();

      if (!gitDiff) {
        continue;
      }

      const variablesAdded: string[] = [];
      const variablesModified: string[] = [];
      const variablesDeleted: string[] = [];

      const lines = gitDiff.split("\n");
      for (const line of lines) {
        if (
          line.startsWith("+") &&
          line.includes("=") &&
          !line.startsWith("+++")
        ) {
          const varMatch = line.match(/^\+([A-Z_]+)=/);
          if (varMatch) {
            variablesAdded.push(varMatch[1]);
          }
        } else if (
          line.startsWith("-") &&
          line.includes("=") &&
          !line.startsWith("---")
        ) {
          const varMatch = line.match(/^-([A-Z_]+)=/);
          if (varMatch) {
            variablesDeleted.push(varMatch[1]);
          }
        } else if (line.startsWith("+") && line.includes("=")) {
          const varMatch = line.match(/^\+([A-Z_]+)=/);
          if (varMatch) {
            variablesModified.push(varMatch[1]);
          }
        }
      }

      if (
        variablesAdded.length > 0 ||
        variablesModified.length > 0 ||
        variablesDeleted.length > 0
      ) {
        changes.push({
          filePath: envFile,
          variablesAdded,
          variablesModified,
          variablesDeleted,
        });
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return changes;
}

/**
 * Detect significant changes (new files, large refactorings, etc.)
 */
function detectSignificantChanges(
  commitHash: string,
  projectRoot: string
): {
  newFiles: string[];
  deletedFiles: string[];
  largeRefactorings: string[];
  architectureChanges: string[];
} {
  const result = {
    newFiles: [] as string[],
    deletedFiles: [] as string[],
    largeRefactorings: [] as string[],
    architectureChanges: [] as string[],
  };

  try {
    const changedFiles = getChangedFiles(commitHash, projectRoot);

    for (const file of changedFiles) {
      const fullPath = join(projectRoot, file);

      // Check if new file
      try {
        execSync(
          `git log --diff-filter=A --format="%H" -- "${file}" | head -1`,
          {
            encoding: "utf-8",
            cwd: projectRoot,
          }
        );
        if (existsSync(fullPath)) {
          result.newFiles.push(file);
        }
      } catch {
        // Not a new file
      }

      // Check if deleted file
      try {
        execSync(
          `git log --diff-filter=D --format="%H" -- "${file}" | head -1`,
          {
            encoding: "utf-8",
            cwd: projectRoot,
          }
        );
        if (!existsSync(fullPath)) {
          result.deletedFiles.push(file);
        }
      } catch {
        // Not a deleted file
      }

      // Detect large refactorings (many files changed in same module)
      const categorized = categorizeFile(file);
      if (
        categorized.category === "backend" ||
        categorized.category === "frontend"
      ) {
        // Count files in same module
        const moduleFiles = changedFiles.filter((f) => {
          const cat = categorizeFile(f);
          return (
            cat.category === categorized.category &&
            cat.module === categorized.module
          );
        });

        if (moduleFiles.length > 5) {
          result.largeRefactorings.push(
            `${categorized.category}/${categorized.module} (${moduleFiles.length} files)`
          );
        }
      }

      // Detect architecture changes (new directories, major file moves)
      if (
        file.includes("src/") &&
        (file.includes("/controllers/") ||
          file.includes("/services/") ||
          file.includes("/middleware/"))
      ) {
        result.architectureChanges.push(file);
      }
    }

    // Remove duplicates
    result.largeRefactorings = [...new Set(result.largeRefactorings)];
    result.architectureChanges = [...new Set(result.architectureChanges)];
  } catch (error) {
    // Ignore errors
  }

  return result;
}

/**
 * Comprehensive change detection
 */
export async function comprehensiveChangeDetection(params: {
  commitHash?: string; // Opsiyonel, default: HEAD
  path?: string;
}): Promise<ComprehensiveChangeDetectionResult> {
  const { commitHash: providedHash, path } = params;
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const result: ComprehensiveChangeDetectionResult = {
    success: true,
    commitHash: "",
    timestamp: new Date().toISOString(),
    codebaseChanges: {
      backend: [],
      frontend: [],
      asanmod: [],
      docs: [],
      other: [],
    },
    databaseChanges: {
      migrations: [],
      schemaChanges: [],
    },
    environmentChanges: {
      envFiles: [],
      configFiles: [],
    },
    significantChanges: {
      newFiles: [],
      deletedFiles: [],
      largeRefactorings: [],
      architectureChanges: [],
    },
    memoryObservationsFormat: [],
    errors: [],
  };

  try {
    // Get commit hash
    const commitHash =
      providedHash ||
      execSync("git rev-parse HEAD", {
        encoding: "utf-8",
        cwd: projectRoot,
      }).trim();

    result.commitHash = commitHash;

    // Get changed files
    const changedFiles = getChangedFiles(commitHash, projectRoot);

    // Categorize and analyze files
    for (const file of changedFiles) {
      const categorized = categorizeFile(file);
      const fullPath = join(projectRoot, file);

      // Get file stats
      let size = 0;
      let linesChanged = 0;

      if (existsSync(fullPath)) {
        try {
          const stats = statSync(fullPath);
          size = stats.size;

          // Get lines changed from git diff
          const gitDiff = execSync(
            `git diff ${commitHash}~1 ${commitHash} -- "${file}" 2>/dev/null || echo ""`,
            {
              encoding: "utf-8",
              cwd: projectRoot,
            }
          ).trim();

          if (gitDiff) {
            const addedLines = (gitDiff.match(/^\+(?!\+)/gm) || []).length;
            const removedLines = (gitDiff.match(/^-(?!-)/gm) || []).length;
            linesChanged = addedLines + removedLines;
          }
        } catch (error) {
          // Ignore errors
        }
      }

      const fileChange: FileChange = {
        filePath: file,
        changeType: existsSync(fullPath) ? "modified" : "deleted",
        linesChanged,
        size,
        module: categorized.module,
      };

      // Add to appropriate category
      result.codebaseChanges[categorized.category].push(fileChange);
    }

    // Detect database changes
    result.databaseChanges.migrations = detectMigrationChanges(
      commitHash,
      projectRoot
    );
    result.databaseChanges.schemaChanges = detectSchemaChanges(
      commitHash,
      projectRoot
    );

    // Detect environment changes
    result.environmentChanges.envFiles = detectEnvChanges(
      commitHash,
      projectRoot
    );

    // Detect significant changes
    result.significantChanges = detectSignificantChanges(
      commitHash,
      projectRoot
    );

    // Generate Memory MCP observations
    const observations: Array<{ entityName: string; contents: string[] }> = [];

    // Codebase changes observation
    const totalFilesChanged =
      result.codebaseChanges.backend.length +
      result.codebaseChanges.frontend.length +
      result.codebaseChanges.asanmod.length +
      result.codebaseChanges.docs.length +
      result.codebaseChanges.other.length;

    if (totalFilesChanged > 0) {
      observations.push({
        entityName: "ASANMOD_PROJECT",
        contents: [
          `[COMMIT ${commitHash}] Codebase changes detected - ${totalFilesChanged} file(s) changed`,
          `Backend: ${result.codebaseChanges.backend.length} file(s)`,
          `Frontend: ${result.codebaseChanges.frontend.length} file(s)`,
          `ASANMOD: ${result.codebaseChanges.asanmod.length} file(s)`,
          `Docs: ${result.codebaseChanges.docs.length} file(s)`,
        ],
      });
    }

    // Database changes observation
    if (
      result.databaseChanges.migrations.length > 0 ||
      result.databaseChanges.schemaChanges.length > 0
    ) {
      observations.push({
        entityName: "ASANMOD_DATABASE",
        contents: [
          `[COMMIT ${commitHash}] Database changes detected`,
          `Migrations: ${result.databaseChanges.migrations.length}`,
          `Schema changes: ${result.databaseChanges.schemaChanges.length}`,
          ...result.databaseChanges.migrations.map(
            (m) => `  - ${m.migrationFile}: ${m.description || "Unknown"}`
          ),
          ...result.databaseChanges.schemaChanges.map(
            (s) => `  - ${s.changeDescription}`
          ),
        ],
      });
    }

    // Environment changes observation
    if (result.environmentChanges.envFiles.length > 0) {
      observations.push({
        entityName: "ASANMOD_ENVIRONMENT",
        contents: [
          `[COMMIT ${commitHash}] Environment changes detected`,
          ...result.environmentChanges.envFiles.map((env) => {
            const changes: string[] = [];
            if (env.variablesAdded.length > 0) {
              changes.push(`Added: ${env.variablesAdded.join(", ")}`);
            }
            if (env.variablesModified.length > 0) {
              changes.push(`Modified: ${env.variablesModified.join(", ")}`);
            }
            if (env.variablesDeleted.length > 0) {
              changes.push(`Deleted: ${env.variablesDeleted.join(", ")}`);
            }
            return `${env.filePath}: ${changes.join("; ")}`;
          }),
        ],
      });
    }

    // Significant changes observation
    if (
      result.significantChanges.newFiles.length > 0 ||
      result.significantChanges.largeRefactorings.length > 0 ||
      result.significantChanges.architectureChanges.length > 0
    ) {
      observations.push({
        entityName: "ASANMOD_PROJECT",
        contents: [
          `[COMMIT ${commitHash}] Significant changes detected`,
          `New files: ${result.significantChanges.newFiles.length}`,
          `Large refactorings: ${result.significantChanges.largeRefactorings.length}`,
          `Architecture changes: ${result.significantChanges.architectureChanges.length}`,
          ...result.significantChanges.largeRefactorings.map((r) => `  - ${r}`),
        ],
      });
    }

    result.memoryObservationsFormat = observations;

    return result;
  } catch (error: any) {
    result.success = false;
    result.errors.push(
      `Comprehensive change detection error: ${error.message}`
    );
    return result;
  }
}
