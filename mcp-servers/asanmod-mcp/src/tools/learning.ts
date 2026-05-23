/**
 * ASANMOD MCP Tool: ASANMOD Learning System
 * Task'tan öğrenilen pattern'leri Memory MCP'ye kaydeder
 *
 * Phase 5: ASANMOD-Specific Customization
 */

import { existsSync } from "fs";
import { join } from "path";

interface ASANMODLearningResult {
  success: boolean;
  learnedPatterns: number;
  learnedBestPractices: number;
  learnedErrors: number;
  observationsAdded: number;
  timestamp: string;
}

interface LearningData {
  taskId?: string;
  taskDescription?: string;
  patterns?: Array<{
    name: string;
    description: string;
    source: string;
    usage?: string;
  }>;
  bestPractices?: string[];
  errors?: Array<{
    description: string;
    solution: string;
  }>;
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
 * Learn from task completion
 */
export async function learnFromTask(
  learningData: LearningData,
  path?: string
): Promise<ASANMODLearningResult> {
  const projectRoot = path || getProjectRoot();

  if (!projectRoot) {
    throw new Error("Project root not found");
  }

  const result: ASANMODLearningResult = {
    success: true,
    learnedPatterns: 0,
    learnedBestPractices: 0,
    learnedErrors: 0,
    observationsAdded: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    const timestamp = new Date().toISOString();
    const observations: Array<{ entityName: string; contents: string[] }> = [];

    // Learn patterns
    if (learningData.patterns && learningData.patterns.length > 0) {
      for (const pattern of learningData.patterns) {
        observations.push({
          entityName: pattern.name.startsWith("PATTERN_")
            ? pattern.name
            : `PATTERN_ASANMOD_${pattern.name.toUpperCase().replace(/\s+/g, "_")}`,
          contents: [
            `Pattern description: ${pattern.description}`,
            `Pattern source: ${pattern.source}`,
            pattern.usage ? `Pattern usage: ${pattern.usage}` : "",
            learningData.taskId
              ? `Learned from task: ${learningData.taskId}`
              : "",
            `Learned: ${timestamp}`,
          ].filter((obs) => obs),
        });
        result.learnedPatterns++;
      }
    }

    // Learn best practices
    if (learningData.bestPractices && learningData.bestPractices.length > 0) {
      const bestPracticeObs: string[] = [];
      for (const practice of learningData.bestPractices) {
        bestPracticeObs.push(
          `[BEST PRACTICE] ${practice} - Learned: ${timestamp}`
        );
        result.learnedBestPractices++;
      }

      observations.push({
        entityName: "ASANMOD_PROJECT",
        contents: bestPracticeObs,
      });
    }

    // Learn from errors (negative patterns - don't repeat)
    if (learningData.errors && learningData.errors.length > 0) {
      const errorObs: string[] = [];
      for (const error of learningData.errors) {
        errorObs.push(
          `[ERROR PATTERN] ${error.description} - Solution: ${error.solution} - Learned: ${timestamp}`
        );
        result.learnedErrors++;
      }

      observations.push({
        entityName: "ASANMOD_PROJECT",
        contents: errorObs,
      });
    }

    // Task completion observation
    if (learningData.taskId || learningData.taskDescription) {
      observations.push({
        entityName: "ASANMOD_PROJECT",
        contents: [
          `Task completed: ${learningData.taskId || "Unknown"}`,
          learningData.taskDescription
            ? `Description: ${learningData.taskDescription}`
            : "",
          `Completed: ${timestamp}`,
        ].filter((obs) => obs),
      });
    }

    result.observationsAdded = observations.reduce(
      (sum, obs) => sum + obs.contents.length,
      0
    );

    // Return format for Memory MCP
    // Note: This function returns the format
    // The actual Memory MCP call should be made by the caller

    return result;
  } catch (error) {
    result.success = false;
    throw new Error(
      `ASANMOD learning failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate Memory MCP observation format from learning data
 */
export function generateLearningObservations(
  learningData: LearningData
): Array<{ entityName: string; contents: string[] }> {
  const timestamp = new Date().toISOString();
  const observations: Array<{ entityName: string; contents: string[] }> = [];

  // Patterns
  if (learningData.patterns && learningData.patterns.length > 0) {
    for (const pattern of learningData.patterns) {
      observations.push({
        entityName: pattern.name.startsWith("PATTERN_")
          ? pattern.name
          : `PATTERN_ASANMOD_${pattern.name.toUpperCase().replace(/\s+/g, "_")}`,
        contents: [
          `Pattern description: ${pattern.description}`,
          `Pattern source: ${pattern.source}`,
          pattern.usage ? `Pattern usage: ${pattern.usage}` : "",
          learningData.taskId
            ? `Learned from task: ${learningData.taskId}`
            : "",
          `Learned: ${timestamp}`,
        ].filter((obs) => obs),
      });
    }
  }

  // Best practices
  if (learningData.bestPractices && learningData.bestPractices.length > 0) {
    observations.push({
      entityName: "ASANMOD_PROJECT",
      contents: learningData.bestPractices.map(
        (practice) => `[BEST PRACTICE] ${practice} - Learned: ${timestamp}`
      ),
    });
  }

  // Errors
  if (learningData.errors && learningData.errors.length > 0) {
    observations.push({
      entityName: "ASANMOD_PROJECT",
      contents: learningData.errors.map(
        (error) =>
          `[ERROR PATTERN] ${error.description} - Solution: ${error.solution} - Learned: ${timestamp}`
      ),
    });
  }

  // Task completion
  if (learningData.taskId || learningData.taskDescription) {
    observations.push({
      entityName: "ASANMOD_PROJECT",
      contents: [
        `Task completed: ${learningData.taskId || "Unknown"}`,
        learningData.taskDescription
          ? `Description: ${learningData.taskDescription}`
          : "",
        `Completed: ${timestamp}`,
      ].filter((obs) => obs),
    });
  }

  return observations;
}

/**
 * MCP Tool Handler
 */
export async function handleLearning(args: {
  taskId?: string;
  taskDescription?: string;
  patterns?: Array<{
    name: string;
    description: string;
    source: string;
    usage?: string;
  }>;
  bestPractices?: string[];
  errors?: Array<{
    description: string;
    solution: string;
  }>;
  path?: string;
}): Promise<ASANMODLearningResult> {
  const learningData: LearningData = {
    taskId: args.taskId,
    taskDescription: args.taskDescription,
    patterns: args.patterns,
    bestPractices: args.bestPractices,
    errors: args.errors,
  };

  return learnFromTask(learningData, args.path);
}
