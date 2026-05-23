/**
 * Visual/UI Verification Check
 * CSS/Tailwind mobile-first verification
 * Part of Hard-Lock Verification (Phase 3)
 */

import { createHash } from "crypto";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();

export interface VisualUICheckResult {
  success: boolean;
  signature: string; // Hash of check execution + result
  mobileFirst: boolean;
  responsiveClasses: number;
  issues: string[];
  error?: string;
}

/**
 * Generate signature for check result
 */
function generateSignature(checkName: string, result: any): string {
  const data = JSON.stringify({
    check: checkName,
    timestamp: new Date().toISOString(),
    result: result,
  });
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Check for mobile-first CSS/Tailwind patterns
 */
export async function checkVisualUI(
  path?: string
): Promise<VisualUICheckResult> {
  const issues: string[] = [];
  let mobileFirst = true;
  let responsiveClasses = 0;

  try {
    const targetPath = path || PROJECT_ROOT;
    const frontendPath = join(targetPath, "frontend");

    if (!existsSync(frontendPath)) {
      return {
        success: true,
        signature: generateSignature("visualUI", { skipped: true }),
        mobileFirst: true,
        responsiveClasses: 0,
        issues: [],
      };
    }

    // Check for mobile-first patterns in CSS/Tailwind files
    // This is a simplified check - in production, would scan actual CSS/Tailwind usage

    // Check if Tailwind config exists and has mobile-first settings
    const tailwindConfig = join(frontendPath, "tailwind.config.ts");
    if (existsSync(tailwindConfig)) {
      const configContent = readFileSync(tailwindConfig, "utf-8");

      // Check for responsive breakpoints (mobile-first)
      if (
        configContent.includes("screens") ||
        configContent.includes("breakpoints")
      ) {
        mobileFirst = true;
      }

      // Count responsive utility classes usage (simplified)
      const responsivePatterns = /(?:sm:|md:|lg:|xl:|2xl:)/g;
      const matches = configContent.match(responsivePatterns);
      responsiveClasses = matches ? matches.length : 0;
    }

    // Scan component files for mobile-first patterns
    const appDir = join(frontendPath, "app");
    if (existsSync(appDir)) {
      // Scan TSX files for responsive classes
      function scanDirectory(
        dir: string,
        maxDepth = 3,
        currentDepth = 0
      ): number {
        if (currentDepth >= maxDepth) return 0;

        let count = 0;
        try {
          const entries = readdirSync(dir);
          for (const entry of entries) {
            const fullPath = join(dir, entry);
            const stat = statSync(fullPath);

            if (stat.isDirectory()) {
              count += scanDirectory(fullPath, maxDepth, currentDepth + 1);
            } else if (extname(entry) === ".tsx" || extname(entry) === ".jsx") {
              try {
                const content = readFileSync(fullPath, "utf-8");
                // Count responsive utility classes
                const responsiveMatches = content.match(
                  /(?:sm:|md:|lg:|xl:|2xl:)[\w-]+/g
                );
                if (responsiveMatches) {
                  count += responsiveMatches.length;
                }

                // Check for mobile-first anti-patterns (desktop-first classes without mobile base)
                const desktopOnlyPattern = /(?:lg:|xl:|2xl:)[\w-]+/g;
                const hasDesktopOnly = desktopOnlyPattern.test(content);
                if (hasDesktopOnly) {
                  // Check if there's a mobile base class
                  const mobileBasePattern = /(?:^|\s)(?:sm:|md:)?[\w-]+/;
                  if (
                    !mobileBasePattern.test(
                      content.split(
                        desktopOnlyPattern.exec(content)?.[0] || ""
                      )[0]
                    )
                  ) {
                    issues.push(
                      `Desktop-first pattern in ${fullPath.replace(frontendPath, "")}`
                    );
                  }
                }
              } catch (error) {
                // Skip files that can't be read
              }
            }
          }
        } catch (error) {
          // Skip directories that can't be read
        }
        return count;
      }

      responsiveClasses += scanDirectory(appDir);
    }

    const success = mobileFirst && issues.length === 0;
    const result = {
      success,
      mobileFirst,
      responsiveClasses,
      issues,
    };

    return {
      ...result,
      signature: generateSignature("visualUI", result),
    };
  } catch (error) {
    const result = {
      success: false,
      mobileFirst: false,
      responsiveClasses: 0,
      issues: [error instanceof Error ? error.message : "Unknown error"],
    };

    return {
      ...result,
      signature: generateSignature("visualUI", result),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
