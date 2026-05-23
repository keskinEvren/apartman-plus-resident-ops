import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { randomBytes } from "crypto";

interface SafeWriteArgs {
  targetFile: string;
  content: string;
}

export const safeWrite = async (args: SafeWriteArgs): Promise<string> => {
  const { targetFile, content } = args;

  if (!targetFile || content === undefined) {
    throw new Error("Missing targetFile or content arguments");
  }

  // Create absolute paths
  const rootDir = process.cwd(); // Assuming cwd is project root where scripts reside
  const scriptPath = path.resolve(rootDir, "scripts/mod-tools/safe-writer.js");

  // Create temp file for content
  const tempDir = os.tmpdir();
  const randomId = randomBytes(8).toString("hex");
  const tempFilePath = path.join(tempDir, `asanmod_safe_write_${randomId}.tmp`);

  try {
    // Write content to temp file
    fs.writeFileSync(tempFilePath, content, "utf-8");

    // Execute safe-writer.js
    // We strictly use the script to enforce the ritual
    execSync(`node "${scriptPath}" "${targetFile}" "${tempFilePath}"`, {
      stdio: "pipe", // Capture output
      encoding: "utf-8",
    });

    // If execSync didn't throw, it passed
    return `Successfully wrote to ${targetFile} with atomic verification.`;
  } catch (error: any) {
    // If safe-writer.js failed, it exits with 1 and execSync throws
    const output = error.stdout ? error.stdout.toString() : "";
    const errOutput = error.stderr ? error.stderr.toString() : "";

    // Cleanup temp file is handled by OS eventually, or we can explicit delete?
    // safe-writer doesn't consume the temp file (it copies it), so we should delete it.
    try {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    } catch (e) {}

    throw new Error(`Safe Write Failed:\n${output}\n${errOutput}`);
  } finally {
    // Always try to cleanup temp file
    try {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    } catch (e) {}
  }
};
