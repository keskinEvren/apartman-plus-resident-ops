/**
 * Task Enforcement System
 * Görev tamamlama zorunluluğu kontrolü - Hiçbir görev atlanamaz
 * Git hata kontrolü - Git hatası varsa bir sonraki göreve geçilemez
 * Ara rapor kontrolü - Her 10 görevde bir veya tamamlandığında
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface TaskEnforcementResult {
  success: boolean;
  canProceed: boolean;
  reason: string;
  gitError?: boolean;
  gitErrorMessage?: string;
  skippedTasks?: string[];
  completedTasks?: string[];
  nextReportAt?: number; // Görev sayısı (10 görevde bir)
  error?: string;
}

const PROJECT_ROOT =
  process.env.PROJECT_ROOT || path.join(__dirname, "../../../..");
const STATE_FILE = path.join(PROJECT_ROOT, ".state", "current-status.json");
const TASK_LOCK_FILE = path.join(PROJECT_ROOT, ".state", "task-lock.json");

interface TaskLock {
  currentTask: string | null;
  completedTasks: string[];
  skippedTasks: string[];
  gitError: boolean;
  gitErrorMessage: string | null;
  reportCounter: number; // 10 görevde bir rapor için sayaç
  lastReportAt: number;
}

/**
 * Görev tamamlama kontrolü
 * Hiçbir görev atlanamaz, git hatası varsa bloklanır
 */
export async function enforceTaskCompletion(
  currentTaskId: string,
  taskStatus: "completed" | "in_progress" | "pending" | "skipped"
): Promise<TaskEnforcementResult> {
  try {
    // 1. Task lock dosyasını oku veya oluştur
    let taskLock: TaskLock = {
      currentTask: null,
      completedTasks: [],
      skippedTasks: [],
      gitError: false,
      gitErrorMessage: null,
      reportCounter: 0,
      lastReportAt: 0,
    };

    if (fs.existsSync(TASK_LOCK_FILE)) {
      try {
        taskLock = JSON.parse(fs.readFileSync(TASK_LOCK_FILE, "utf-8"));
      } catch (error) {
        // Lock dosyası bozuksa sıfırdan başla
      }
    }

    // 2. Git hata kontrolü (ÖNCELİK 1 - EN ÖNEMLİ!)
    const gitStatus = checkGitStatus();
    if (!gitStatus.success) {
      taskLock.gitError = true;
      taskLock.gitErrorMessage = gitStatus.error || "Git hatası tespit edildi";
      saveTaskLock(taskLock);

      return {
        success: false,
        canProceed: false,
        reason: "Git hatası var - Bir sonraki göreve geçilemez!",
        gitError: true,
        gitErrorMessage: gitStatus.error || "Git hatası tespit edildi",
        completedTasks: taskLock.completedTasks,
        skippedTasks: taskLock.skippedTasks,
      };
    }

    // Git hatası yoksa temizle
    if (taskLock.gitError) {
      taskLock.gitError = false;
      taskLock.gitErrorMessage = null;
    }

    // 3. Görev durumu kontrolü - ATLAMA YASAK!
    if (taskStatus === "skipped") {
      // Atlanan görevler kaydedilir ama BLOKE EDİLİR
      if (!taskLock.skippedTasks.includes(currentTaskId)) {
        taskLock.skippedTasks.push(currentTaskId);
      }
      saveTaskLock(taskLock);

      return {
        success: false,
        canProceed: false,
        reason:
          "GÖREV ATLANAMAZ! Çok ekstrem durumlarda kullanıcıya sorulmalı. Sistem görevi atlamaya izin vermiyor.",
        completedTasks: taskLock.completedTasks,
        skippedTasks: taskLock.skippedTasks,
      };
    }

    // 4. Görev sırası kontrolü - Önceki görevler tamamlanmış mı?
    // Bu kontrol, görev listesindeki sırayı takip etmek için kullanılabilir
    // Şimdilik basit bir kontrol yapıyoruz

    // 5. Görev tamamlandı mı kontrolü
    if (taskStatus === "completed") {
      if (!taskLock.completedTasks.includes(currentTaskId)) {
        taskLock.completedTasks.push(currentTaskId);
        taskLock.reportCounter++;
      }

      // Görev tamamlandı, lock'u güncelle
      taskLock.currentTask = null;
      saveTaskLock(taskLock);

      // Ara rapor kontrolü (her 10 görevde bir)
      const shouldReport =
        taskLock.reportCounter % 10 === 0 && taskLock.reportCounter > 0;
      const nextReportAt = shouldReport
        ? taskLock.reportCounter
        : (Math.floor(taskLock.reportCounter / 10) + 1) * 10;

      return {
        success: true,
        canProceed: true,
        reason: "Görev tamamlandı",
        completedTasks: taskLock.completedTasks,
        skippedTasks: taskLock.skippedTasks,
        nextReportAt,
      };
    }

    // 6. Görev devam ediyor
    if (taskStatus === "in_progress") {
      taskLock.currentTask = currentTaskId;
      saveTaskLock(taskLock);

      return {
        success: true,
        canProceed: true,
        reason: "Görev devam ediyor",
        completedTasks: taskLock.completedTasks,
        skippedTasks: taskLock.skippedTasks,
      };
    }

    return {
      success: true,
      canProceed: true,
      reason: "Görev bekliyor",
      completedTasks: taskLock.completedTasks,
      skippedTasks: taskLock.skippedTasks,
    };
  } catch (error: any) {
    return {
      success: false,
      canProceed: false,
      reason: `Hata: ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * Git durumu kontrolü
 * Git hatası varsa false döner
 */
function checkGitStatus(): { success: boolean; error?: string } {
  try {
    // Git status kontrolü
    const status = execSync("git status --porcelain", {
      encoding: "utf-8",
      cwd: PROJECT_ROOT,
    });

    // Git commit kontrolü (son commit başarılı mı?)
    try {
      execSync("git log -1 --oneline", {
        encoding: "utf-8",
        cwd: PROJECT_ROOT,
      });
    } catch (error) {
      return {
        success: false,
        error: "Git commit hatası - Son commit başarısız olabilir",
      };
    }

    // Pre-commit hook kontrolü (simüle et - gerçek hook çalışacak)
    // Burada sadece git durumunu kontrol ediyoruz, pre-commit hook commit sırasında çalışacak

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Git hatası tespit edildi",
    };
  }
}

/**
 * Task lock dosyasını kaydet
 */
function saveTaskLock(taskLock: TaskLock): void {
  fs.mkdirSync(path.dirname(TASK_LOCK_FILE), { recursive: true });
  fs.writeFileSync(TASK_LOCK_FILE, JSON.stringify(taskLock, null, 2), "utf-8");
}

/**
 * Ara rapor kontrolü
 * Her 10 görevde bir veya tamamlandığında true döner
 * ÖNEMLİ: Her görev bitince ara rapor VERİLMEZ!
 */
export function shouldReportProgress(
  completedTaskCount: number,
  totalTasks: number
): {
  shouldReport: boolean;
  reason: string;
  nextReportAt: number;
} {
  // Toplam görev 10'dan azsa, tamamlandığında rapor (ama her görev bitince DEĞİL!)
  if (totalTasks < 10) {
    if (completedTaskCount === totalTasks) {
      return {
        shouldReport: true,
        reason: `Tüm görevler tamamlandı (${completedTaskCount}/${totalTasks})`,
        nextReportAt: totalTasks,
      };
    }
    return {
      shouldReport: false,
      reason: `Görevler devam ediyor (${completedTaskCount}/${totalTasks}) - 10'dan az görev var, tamamlandığında rapor verilecek`,
      nextReportAt: totalTasks,
    };
  }

  // 10 görevde bir rapor
  if (completedTaskCount > 0 && completedTaskCount % 10 === 0) {
    return {
      shouldReport: true,
      reason: `${completedTaskCount} görev tamamlandı (10 görevde bir rapor)`,
      nextReportAt: completedTaskCount + 10,
    };
  }

  // Bir sonraki rapor noktasını hesapla
  const nextReportAt = Math.floor(completedTaskCount / 10) * 10 + 10;

  return {
    shouldReport: false,
    reason: `${completedTaskCount} görev tamamlandı - Bir sonraki rapor ${nextReportAt}. görevde`,
    nextReportAt,
  };
}

/**
 * Görev listesi kontrolü
 * Tüm görevler tamamlandı mı?
 */
export function checkAllTasksCompleted(
  completedTasks: string[],
  totalTasks: number
): boolean {
  return completedTasks.length === totalTasks;
}

/**
 * Atlanan görev kontrolü
 * Atlanan görev var mı?
 */
export function hasSkippedTasks(skippedTasks: string[]): boolean {
  return skippedTasks.length > 0;
}
