/**
 * Tool: asanmod_verify_git_commit_message
 * Git commit message validation (identity tag, format)
 */

import { execSync } from "child_process";

export interface GitCommitMessageResult {
  success: boolean;
  violations: Array<{
    issue: string;
    suggestion?: string;
  }>;
  count: number;
  error?: string;
}

export async function verifyGitCommitMessage(): Promise<GitCommitMessageResult> {
  const violations: GitCommitMessageResult["violations"] = [];

  try {
    // Son commit message'ı al (eğer commit yapılıyorsa)
    // Pre-commit hook'ta commit message henüz yazılmamış olabilir
    // Bu durumda .git/COMMIT_EDITMSG dosyasını kontrol et

    let commitMessage = "";

    try {
      // .git/COMMIT_EDITMSG dosyasını oku (commit yapılırken)
      const commitMsgPath = ".git/COMMIT_EDITMSG";
      const { fileExistsMCP, readFileMCP } =
        await import("../utils/mcpClient.js");
      if (await fileExistsMCP(commitMsgPath)) {
        commitMessage = await readFileMCP(commitMsgPath);
      } else {
        // Son commit message'ı al (Git MCP will be used in Phase 3)
        commitMessage = execSync("git log -1 --pretty=%B", {
          encoding: "utf-8",
        });
      }
    } catch {
      // Commit message bulunamadı, skip
      return {
        success: true,
        violations: [],
        count: 0,
      };
    }

    if (!commitMessage || commitMessage.trim().length === 0) {
      violations.push({
        issue: "Commit message is empty",
        suggestion: "Add a descriptive commit message",
      });
    }

    // Identity tag kontrolü ([MOD] only - WORKER system removed 2026-12-17)
    const hasIdentityTag = /\[MOD\]/i.test(commitMessage);
    if (!hasIdentityTag) {
      violations.push({
        issue: "Missing identity tag [MOD]",
        suggestion: "Add [MOD] to commit message",
      });
    }

    // Format kontrolü (type(scope): description)
    const formatMatch =
      /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?:/.test(
        commitMessage.split("\n")[0]
      );
    if (!formatMatch) {
      violations.push({
        issue: "Commit message format incorrect",
        suggestion: "Use format: type(scope): description [MOD]",
      });
    }

    // Çok kısa commit message
    const firstLine = commitMessage.split("\n")[0];
    if (firstLine.length < 10) {
      violations.push({
        issue: "Commit message too short",
        suggestion: "Add more descriptive commit message",
      });
    }

    return {
      success: violations.length === 0,
      violations,
      count: violations.length,
    };
  } catch (err: any) {
    return {
      success: false,
      violations: [],
      count: 0,
      error: err.message || "Git commit message validation failed",
    };
  }
}
