import { z } from "zod";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// ESM Shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../");

export const analyzeImpactTool = {
  name: "asanmod_analyze_impact",
  description:
    'ASANMOD v7.0: Calculates the "Blast Radius" of a file. Returns a list of files that depend on the target file. Use this before editing a shared component or utility to understand what might break.',
  parameters: z.object({
    targetFile: z.string().describe("Absolute path of the file to analyze."),
  }),
  handler: async ({ targetFile }: { targetFile: string }) => {
    try {
      // Run the dependency-graph script
      const scriptPath = path.join(
        projectRoot,
        "scripts/mod-tools/dependency-graph.js"
      );

      // Ensure target file exists within project
      if (!targetFile.startsWith(projectRoot)) {
        return {
          content: [
            {
              type: "text",
              text: `[ERROR] Target file must be inside project root: ${projectRoot}`,
            },
          ],
          isError: true,
        };
      }

      // Execute script
      // Standard output will contain the JSON result
      const output = execSync(`node "${scriptPath}" "${targetFile}"`, {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"], // Capture stdout, ignore stderr logs
      });

      const result = JSON.parse(output);

      let textReport = `🛡️ **ASANMOD v7.0 NEURO-MAP IMPACT ANALYSIS**\n`;
      textReport += `Target: \`${path.basename(targetFile)}\`\n`;
      textReport += `Direct Dependents: **${result.count}** files\n\n`;

      if (result.count > 0) {
        textReport += `**Blast Radius (Files that might break):**\n`;
        result.dependents.forEach((dep: string) => {
          const relPath = path.relative(projectRoot, dep);
          textReport += `- \`${relPath}\`\n`;
        });
      } else {
        textReport += `✅ **Safe to Edit:** No direct dependents found in scanned scope.`;
      }

      return {
        content: [{ type: "text", text: textReport }],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `[ASANMOD_ERROR] Impact Analysis Failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
};
