import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);

export const runQualityScan = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // dist/tools -> dist -> asanmod-mcp -> mcp-servers -> root
  const projectRoot = path.resolve(__dirname, "../../../../");
  const scriptPath = path.join(
    projectRoot,
    "scripts/mod-tools/scan-quality.cjs"
  );

  if (!fs.existsSync(scriptPath)) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: "scan-quality.cjs script not found",
              path: scriptPath,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  try {
    // Execute npm run scan (which runs node scan-quality.cjs)
    // We run the script directly to avoid npm noise if possible, or use npm run scan
    const cmd = `node "${scriptPath}"`;

    const { stdout, stderr } = await execAsync(cmd, {
      cwd: projectRoot,
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    // Default scan prints human readable text.
    // Ideally we'd parse this into JSON or modify scan-quality to support --json
    // For now, we wrap the text output in a success JSON

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              rawOutput: stdout,
              // Simple heuristic to detect if there were issues even with exit code 0 (if scripts handles it gracefully)
              // But scan-quality usually exits 1 on failure.
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: "Quality Scan Failed",
              output: error.stdout,
              errorOutput: error.stderr || error.message,
              exitCode: error.code,
            },
            null,
            2
          ),
        },
      ],
    };
  }
};
