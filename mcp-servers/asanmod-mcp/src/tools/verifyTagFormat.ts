/**
 * Tool: asanmod_verify_tag_format
 * Tag format kontrolü yapar. X.X.Y formatı, sadece patch (son rakam) artırılabilir.
 */

import { execSync } from "child_process";
import { cache } from "../cache.js";

export interface TagFormatResult {
  success: boolean;
  valid: boolean;
  lastTag?: string;
  newTag?: string;
  error?: string;
  message?: string;
}

export async function verifyTagFormat(tag: string): Promise<TagFormatResult> {
  const cacheKey = `tag_format_${tag}`;
  const cached = cache.get<TagFormatResult>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Tag formatını kontrol et (v ile başlamalı, X.X.Y formatı)
    const tagFormatRegex = /^v[0-9]+\.[0-9]+\.[0-9]+$/;
    if (!tagFormatRegex.test(tag)) {
      const result: TagFormatResult = {
        success: true,
        valid: false,
        newTag: tag,
        error: "TAG_FORMAT_ERROR",
        message: `Tag formatı geçersiz: ${tag}. Format: vX.X.Y (format: v1.2.3)`,
      };
      cache.set(cacheKey, result, 60); // 1 dakika cache
      return result;
    }

    // Son tag'i bul
    let lastTag: string | undefined;
    try {
      const lastTagOutput = execSync(
        `git describe --tags --abbrev=0 --match "v*" 2>/dev/null || echo ""`,
        { encoding: "utf-8", cwd: process.cwd() }
      ).trim();
      lastTag = lastTagOutput || undefined;
    } catch (error) {
      // İlk tag olabilir, devam et
    }

    if (!lastTag) {
      // İlk tag, format kontrolü yeterli
      const result: TagFormatResult = {
        success: true,
        valid: true,
        newTag: tag,
        message: `İlk tag: ${tag} (format kontrolü başarılı)`,
      };
      cache.set(cacheKey, result, 60);
      return result;
    }

    // Son tag formatını kontrol et
    if (!tagFormatRegex.test(lastTag)) {
      const result: TagFormatResult = {
        success: true,
        valid: false,
        lastTag,
        newTag: tag,
        error: "LAST_TAG_FORMAT_ERROR",
        message: `Son tag formatı geçersiz: ${lastTag}. Yeni tag formatı doğru, ancak son tag formatı hatalı.`,
      };
      cache.set(cacheKey, result, 60);
      return result;
    }

    // Tag'leri parse et
    const lastVersion = lastTag.replace(/^v/, "");
    const newVersion = tag.replace(/^v/, "");

    const lastParts = lastVersion.split(".").map(Number);
    const newParts = newVersion.split(".").map(Number);

    if (lastParts.length !== 3 || newParts.length !== 3) {
      const result: TagFormatResult = {
        success: true,
        valid: false,
        lastTag,
        newTag: tag,
        error: "VERSION_PARSE_ERROR",
        message: `Version parse hatası: ${lastTag} veya ${tag}`,
      };
      cache.set(cacheKey, result, 60);
      return result;
    }

    const [lastMajor, lastMinor, lastPatch] = lastParts;
    const [newMajor, newMinor, newPatch] = newParts;

    // Kural kontrolü: Sadece son rakam (patch) değişebilir
    if (newMajor !== lastMajor || newMinor !== lastMinor) {
      const result: TagFormatResult = {
        success: true,
        valid: false,
        lastTag,
        newTag: tag,
        error: "RULE_VIOLATION",
        message: `Tag format kuralı ihlali: Sadece patch (son rakam) artırılabilir! Son tag: ${lastTag}, Yeni tag: ${tag}. Major veya minor değişti.`,
      };
      cache.set(cacheKey, result, 60);
      return result;
    }

    // Patch version kontrolü (artmalı)
    if (newPatch <= lastPatch) {
      const result: TagFormatResult = {
        success: true,
        valid: false,
        lastTag,
        newTag: tag,
        error: "PATCH_VERSION_ERROR",
        message: `Patch version artırılmalı! Son tag: ${lastTag} (patch: ${lastPatch}), Yeni tag: ${tag} (patch: ${newPatch}). Yeni patch version, son patch version'dan büyük olmalı.`,
      };
      cache.set(cacheKey, result, 60);
      return result;
    }

    // Patch version limit kontrolü (0-999)
    if (newPatch > 999) {
      const result: TagFormatResult = {
        success: true,
        valid: false,
        lastTag,
        newTag: tag,
        error: "PATCH_VERSION_LIMIT_ERROR",
        message: `Patch version çok büyük: ${newPatch}. Patch version 0-999 arasında olmalı!`,
      };
      cache.set(cacheKey, result, 60);
      return result;
    }

    // Başarılı
    const result: TagFormatResult = {
      success: true,
      valid: true,
      lastTag,
      newTag: tag,
      message: `Tag format kontrolü başarılı: ${lastTag} → ${tag} (patch: ${lastPatch} → ${newPatch})`,
    };
    cache.set(cacheKey, result, 60);
    return result;
  } catch (error: any) {
    const result: TagFormatResult = {
      success: false,
      valid: false,
      newTag: tag,
      error: "EXECUTION_ERROR",
      message: `Tag format kontrolü sırasında hata: ${error.message}`,
    };
    return result;
  }
}
