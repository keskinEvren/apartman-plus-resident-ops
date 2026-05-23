/**
 * Tool: asanmod_enforce_commit_after_edit
 * Edit/Write sonrası otomatik commit zorunluluğu kontrolü
 * ASANMOD Rule: 1 file = 1 commit (IMMEDIATE - NO DELAYS!)
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const UNCOMMITTED_FILES_TRACKER = join(
  process.cwd(),
  ".state",
  "uncommitted-files.json"
);

interface UncommittedFile {
  path: string;
  editedAt: string;
  editType: "edit" | "write" | "create" | "delete";
  commitRequired: boolean;
}

interface UncommittedFilesTracker {
  files: UncommittedFile[];
  lastCheck: string;
}

/**
 * Uncommitted files tracker'ı yükle
 */
function loadTracker(): UncommittedFilesTracker {
  if (existsSync(UNCOMMITTED_FILES_TRACKER)) {
    try {
      const content = readFileSync(UNCOMMITTED_FILES_TRACKER, "utf-8");
      return JSON.parse(content);
    } catch {
      // Invalid JSON, reset
    }
  }
  return { files: [], lastCheck: new Date().toISOString() };
}

/**
 * Uncommitted files tracker'ı kaydet
 */
function saveTracker(tracker: UncommittedFilesTracker): void {
  const dir = join(process.cwd(), ".state");
  if (!existsSync(dir)) {
    execSync(`mkdir -p "${dir}"`, { encoding: "utf-8" });
  }
  writeFileSync(UNCOMMITTED_FILES_TRACKER, JSON.stringify(tracker, null, 2));
}

/**
 * Dosya edit sonrası kaydet
 */
export function trackFileEdit(
  filePath: string,
  editType: "edit" | "write" | "create" | "delete" = "edit"
): void {
  const tracker = loadTracker();
  const existingIndex = tracker.files.findIndex((f) => f.path === filePath);

  const uncommittedFile: UncommittedFile = {
    path: filePath,
    editedAt: new Date().toISOString(),
    editType,
    commitRequired: true,
  };

  if (existingIndex >= 0) {
    tracker.files[existingIndex] = uncommittedFile;
  } else {
    tracker.files.push(uncommittedFile);
  }

  tracker.lastCheck = new Date().toISOString();
  saveTracker(tracker);
}

/**
 * Dosya commit edildiğinde tracker'dan kaldır
 */
export function markFileCommitted(filePath: string): void {
  const tracker = loadTracker();
  tracker.files = tracker.files.filter((f) => f.path !== filePath);
  tracker.lastCheck = new Date().toISOString();
  saveTracker(tracker);
}

/**
 * Uncommitted dosyaları kontrol et ve commit zorunluluğunu zorla
 */
export async function enforceCommitAfterEdit(): Promise<{
  success: boolean;
  uncommittedFiles: UncommittedFile[];
  errors: string[];
  warnings: string[];
  requiresCommit: boolean;
}> {
  const tracker = loadTracker();
  const errors: string[] = [];
  const warnings: string[] = [];
  const uncommittedFiles: UncommittedFile[] = [];

  // Git status kontrolü
  let gitStatusOutput = "";
  try {
    gitStatusOutput = execSync("git status --porcelain", {
      encoding: "utf-8",
      cwd: process.cwd(),
    });
  } catch (error) {
    errors.push("Git status kontrolü başarısız");
    return {
      success: false,
      uncommittedFiles: [],
      errors,
      warnings,
      requiresCommit: true,
    };
  }

  // Modified/untracked dosyaları bul
  const gitModifiedFiles = gitStatusOutput
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const status = line.substring(0, 2).trim();
      const path = line.substring(3).trim();
      return { status, path };
    })
    .filter((f) => f.status === "M" || f.status === "??" || f.status === "A");

  // Tracker'daki dosyaları kontrol et
  for (const trackedFile of tracker.files) {
    // Git'te hala uncommitted mı?
    const gitFile = gitModifiedFiles.find(
      (f) => f.path === trackedFile.path || f.path.endsWith(trackedFile.path)
    );

    if (gitFile) {
      uncommittedFiles.push(trackedFile);
      const ageMinutes =
        (Date.now() - new Date(trackedFile.editedAt).getTime()) / 1000 / 60;

      if (ageMinutes > 5) {
        // 5 dakikadan eski uncommitted dosya = CRITICAL ERROR
        errors.push(
          `🚨 CRITICAL: ${trackedFile.path} ${Math.round(
            ageMinutes
          )} dakikadır uncommitted! ASANMOD Rule: IMMEDIATE commit required!`
        );
      } else {
        warnings.push(
          `⚠️ ${trackedFile.path} uncommitted (${Math.round(
            ageMinutes
          )} dakika önce düzenlendi) - Commit yapılmalı!`
        );
      }
    } else {
      // Git'te committed görünüyor, tracker'dan kaldır
      markFileCommitted(trackedFile.path);
    }
  }

  // Yeni uncommitted dosyaları tracker'a ekle
  for (const gitFile of gitModifiedFiles) {
    const alreadyTracked = tracker.files.some(
      (f) => f.path === gitFile.path || gitFile.path.endsWith(f.path)
    );
    if (!alreadyTracked) {
      trackFileEdit(gitFile.path, gitFile.status === "??" ? "create" : "edit");
      uncommittedFiles.push({
        path: gitFile.path,
        editedAt: new Date().toISOString(),
        editType: gitFile.status === "??" ? "create" : "edit",
        commitRequired: true,
      });
      warnings.push(
        `⚠️ Yeni uncommitted dosya: ${gitFile.path} - Commit yapılmalı!`
      );
    }
  }

  const requiresCommit = uncommittedFiles.length > 0;
  const success = errors.length === 0;

  return {
    success,
    uncommittedFiles,
    errors,
    warnings,
    requiresCommit,
  };
}

/**
 * Tüm uncommitted dosyaları listele
 */
export function getUncommittedFiles(): UncommittedFile[] {
  const tracker = loadTracker();
  return tracker.files;
}

/**
 * Tracker'ı temizle (tüm dosyalar commit edildiğinde)
 */
export function clearTracker(): void {
  saveTracker({ files: [], lastCheck: new Date().toISOString() });
}
