import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);

export const runUISmokeTest = async (args: { path?: string }) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // dist/tools -> dist -> asanmod-mcp -> mcp-servers -> root
  const projectRoot = path.resolve(__dirname, "../../../../");
  const scriptPath = path.join(projectRoot, "scripts/mod-tools/verify-ui.js");

  // Validate script existence
  if (!fs.existsSync(scriptPath)) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: "verify-ui.js script not found",
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
    // Construct command
    // If path is provided, append it to the command
    let cmd = `node "${scriptPath}"`;
    if (args.path) {
      cmd += ` -- "${args.path}"`;
    }

    // Execute
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: projectRoot,
      env: { ...process.env, FORCE_COLOR: "0" }, // Disable color for cleaner parsing if needed
    });

    // Parse output to determine success
    // The script exits with 1 on failure, which throws in execAsync
    // If we are here, it likely exited with 0

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              output: stdout,
              errorOutput: stderr,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    // Script failed (exit code non-zero)
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: "UI Smoke Test Failed",
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
