/**
 * Tool: asanmod_verify_console_errors
 * Frontend console errors kontrolü (git diff ile değişen frontend dosyalarını kontrol eder)
 */

import { execSync } from "child_process";
import { getWorkspaceRoot } from "../utils/paths.js";

export interface ConsoleErrorsResult {
  success: boolean;
  errorCount: number;
  errors: Array<{
    url: string;
    count: number;
    messages?: string[];
  }>;
  note?: string;
  error?: string;
}

function hasFrontendChanges(projectRoot: string): boolean {
  try {
    const staged = execSync("git diff --staged --name-only", {
      encoding: "utf-8",
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024,
      stdio: "pipe",
    });
    if (staged.includes("frontend/")) return true;

    // In worktrees it is common to run checks before staging.
    const unstaged = execSync("git diff --name-only", {
      encoding: "utf-8",
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024,
      stdio: "pipe",
    });
    return unstaged.includes("frontend/");
  } catch {
    return false;
  }
}

export async function verifyConsoleErrors(): Promise<ConsoleErrorsResult> {
  try {
    const projectRoot = getWorkspaceRoot(import.meta.url);

    if (!hasFrontendChanges(projectRoot)) {
      return {
        success: true,
        errorCount: 0,
        errors: [],
        note: "No frontend changes detected, skipping console errors check",
      };
    }

    const baseUrl = process.env.ASANMOD_FRONTEND_URL || "http://localhost:8203";
    const urlsEnv = process.env.ASANMOD_CONSOLE_URLS;
    const urls = urlsEnv
      ? urlsEnv
          .split(",")
          .map((u) => u.trim())
          .filter(Boolean)
      : [baseUrl + "/"];

    const settleMs = Number(process.env.ASANMOD_CONSOLE_SETTLE_MS || 2000);

    let playwright: any;
    try {
      // Prefer full Playwright (bundles browsers via separate install step)
      playwright = await import("playwright");
    } catch {
      return {
        success: false,
        errorCount: 0,
        errors: [],
        error: "Playwright is not available for console verification",
      };
    }

    const chromium = playwright?.chromium;
    if (!chromium) {
      return {
        success: false,
        errorCount: 0,
        errors: [],
        error: "Playwright Chromium is not available",
      };
    }

    const errors: ConsoleErrorsResult["errors"] = [];

    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const context = await browser.newContext({
        ignoreHTTPSErrors: true,
      });

      try {
        for (const url of urls) {
          const page = await context.newPage();
          const messages: string[] = [];
          let count = 0;

          page.on("console", (msg: any) => {
            const type = typeof msg?.type === "function" ? msg.type() : "";
            if (type === "error") {
              count++;
              const text = typeof msg?.text === "function" ? msg.text() : "";
              if (messages.length < 20 && text)
                messages.push(text.slice(0, 300));
            }
          });

          page.on("pageerror", (err: any) => {
            count++;
            if (messages.length < 20) {
              messages.push(String(err?.message || err).slice(0, 300));
            }
          });

          try {
            await page.goto(url, {
              waitUntil: "domcontentloaded",
              timeout: 60_000,
            });

            // Stable wait: best-effort "network idle" + small settle time.
            await page
              .waitForLoadState("networkidle", { timeout: 15_000 })
              .catch(() => undefined);

            if (settleMs > 0) {
              await page.waitForTimeout(settleMs);
            }
          } catch (navErr: any) {
            count++;
            if (messages.length < 20) {
              messages.push(String(navErr?.message || navErr).slice(0, 300));
            }
          } finally {
            await page.close();
          }

          if (count > 0) {
            errors.push({ url, count, messages });
          }
        }
      } finally {
        await context.close();
      }
    } finally {
      await browser.close();
    }

    const errorCount = errors.reduce((sum, e) => sum + e.count, 0);

    return {
      success: errorCount === 0,
      errorCount,
      errors,
      note: errorCount === 0 ? "No console errors detected" : undefined,
    };
  } catch (err: any) {
    return {
      success: false,
      errorCount: 0,
      errors: [],
      error: err?.message || "Console errors check failed",
    };
  }
}
