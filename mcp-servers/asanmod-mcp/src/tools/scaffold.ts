import { execSync } from "child_process";
import path from "path";

interface ScaffoldArgs {
  type: "page" | "component" | "service";
  name: string;
  module?: string;
  outputDir?: string;
}

export const scaffold = async (args: ScaffoldArgs): Promise<string> => {
  const { type, name, module: moduleName = "common", outputDir = "." } = args;

  if (!type || !name) {
    throw new Error("Missing type or name arguments");
  }

  // Create absolute path to script
  const rootDir = process.cwd();
  const scriptPath = path.resolve(rootDir, "scripts/mod-tools/scaffold.js");

  try {
    // Execute scaffold.js
    // node scaffold.js <type> <name> <module> [output_dir]
    const cmd = `node "${scriptPath}" "${type}" "${name}" "${moduleName}" "${outputDir}"`;

    const result = execSync(cmd, {
      stdio: "pipe",
      encoding: "utf-8",
    });

    return `Successfully generated ${type} '${name}':\n${result.trim()}`;
  } catch (error: any) {
    const output = error.stdout ? error.stdout.toString() : "";
    const errOutput = error.stderr ? error.stderr.toString() : "";
    throw new Error(`Scaffold Failed:\n${output}\n${errOutput}`);
  }
};
