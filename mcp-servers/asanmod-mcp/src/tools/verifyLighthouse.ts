/**
 * Tool: asanmod_verify_lighthouse
 * Lighthouse score gate (Performance/SEO/Accessibility/Best Practices)
 */

import { promises as fs } from "fs";
import { join } from "path";
import { getWorkspaceRoot } from "../utils/paths.js";

export interface LighthouseUrlResult {
  url: string;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  reportPath?: string;
  error?: string;
}

export interface LighthouseResult {
  success: boolean;
  results: LighthouseUrlResult[];
  count: number;
  error?: string;
}

function parseUrls(baseUrl: string): string[] {
  const urlsEnv = process.env.ASANMOD_LIGHTHOUSE_URLS;
  if (urlsEnv) {
    return urlsEnv
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
  }
  return [baseUrl + "/"];
}

function sanitizeForFilename(value: string): string {
  return value
    .replace(/^https?:\/\//, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export async function verifyLighthouse(): Promise<LighthouseResult> {
  const projectRoot = getWorkspaceRoot(import.meta.url);
  const baseUrl = process.env.ASANMOD_FRONTEND_URL || "http://localhost:8203";
  const urls = parseUrls(baseUrl);

  let lighthouse: any;
  let chromeLauncher: any;
  let chromePath: string | undefined;

  try {
    const lhMod: any = await import("lighthouse");
    lighthouse = lhMod?.default ?? lhMod;

    const clMod: any = await import("chrome-launcher");
    chromeLauncher = clMod;

    // Prefer Playwright's Chromium for deterministic runs.
    try {
      const pwMod: any = await import("playwright");
      const chromium = pwMod?.chromium;
      chromePath =
        typeof chromium?.executablePath === "function"
          ? chromium.executablePath()
          : undefined;
    } catch {
      // optional
    }
  } catch {
    return {
      success: false,
      results: [],
      count: 0,
      error: "Lighthouse dependencies are not available",
    };
  }

  const outDir = join(projectRoot, ".state", "asanmod", "lighthouse");
  await fs.mkdir(outDir, { recursive: true });

  const results: LighthouseUrlResult[] = [];

  for (const url of urls) {
    let chrome: any;
    try {
      chrome = await chromeLauncher.launch({
        chromePath,
        chromeFlags: [
          "--headless=new",
          "--no-sandbox",
          "--disable-setuid-sandbox",
        ],
      });

      const runnerResult = await lighthouse(url, {
        port: chrome.port,
        output: "json",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
      });

      const lhr = runnerResult?.lhr;
      const categories = lhr?.categories;

      const perf = Math.round(
        ((categories?.performance?.score ?? 0) as number) * 100
      );
      const a11y = Math.round(
        ((categories?.accessibility?.score ?? 0) as number) * 100
      );
      const bp = Math.round(
        ((categories?.["best-practices"]?.score ?? 0) as number) * 100
      );
      const seo = Math.round(((categories?.seo?.score ?? 0) as number) * 100);

      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const reportName = `${ts}-${sanitizeForFilename(url)}.json`;
      const reportPath = join(outDir, reportName);

      const reportJson =
        typeof runnerResult?.report === "string"
          ? runnerResult.report
          : JSON.stringify(runnerResult?.report ?? {}, null, 2);
      await fs.writeFile(reportPath, reportJson, "utf-8");

      results.push({
        url,
        scores: {
          performance: perf,
          accessibility: a11y,
          bestPractices: bp,
          seo,
        },
        reportPath,
      });
    } catch (err: any) {
      results.push({
        url,
        scores: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 },
        error: err?.message || "Lighthouse run failed",
      });
    } finally {
      try {
        await chrome?.kill?.();
      } catch {
        // ignore
      }
    }
  }

  const allOk = results.every(
    (r) =>
      !r.error &&
      r.scores.performance === 100 &&
      r.scores.accessibility === 100 &&
      r.scores.bestPractices === 100 &&
      r.scores.seo === 100
  );

  return {
    success: allOk,
    results,
    count: results.length,
  };
}
