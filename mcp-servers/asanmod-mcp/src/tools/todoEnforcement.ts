/**
 * TODO Enforcement System
 * todo_write tool kullanımını kontrol eder - Hiçbir görev atlanamaz
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

export interface TodoEnforcementResult {
  success: boolean;
  canProceed: boolean;
  reason: string;
  gitError?: boolean;
  gitErrorMessage?: string;
  completedTodos?: string[];
  skippedTodos?: string[];
  nextReportAt?: number;
  error?: string;
}

const PROJECT_ROOT =
  process.env.PROJECT_ROOT || path.join(__dirname, "../../../..");
const TODO_LOCK_FILE = path.join(PROJECT_ROOT, ".state", "todo-lock.json");

interface TodoLock {
  currentTodo: string | null;
  completedTodos: string[];
  skippedTodos: string[];
  gitError: boolean;
  gitErrorMessage: string | null;
  reportCounter: number; // 10 görevde bir rapor için sayaç
  lastReportAt: number;
  totalTodos: number; // Toplam todo sayısı
}

/**
 * TODO oluşturma kontrolü
 * MOD modunda işlem gerektiren mesajlarda todo_write zorunlu
 */
export function shouldCreateTodos(requiresAction: boolean): boolean {
  return requiresAction; // İşlem gerektiren mesajlarda todo_write zorunlu
}

/**
 * TODO tamamlama kontrolü
 * Hiçbir todo atlanamaz, git hatası varsa bloklanır
 */
export async function enforceTodoCompletion(
  todoId: string,
  todoStatus: "completed" | "in_progress" | "pending" | "cancelled"
): Promise<TodoEnforcementResult> {
  try {
    // 1. Todo lock dosyasını oku veya oluştur
    let todoLock: TodoLock = {
      currentTodo: null,
      completedTodos: [],
      skippedTodos: [],
      gitError: false,
      gitErrorMessage: null,
      reportCounter: 0,
      lastReportAt: 0,
      totalTodos: 0,
    };

    if (fs.existsSync(TODO_LOCK_FILE)) {
      try {
        todoLock = JSON.parse(fs.readFileSync(TODO_LOCK_FILE, "utf-8"));
      } catch (error) {
        // Lock dosyası bozuksa sıfırdan başla
      }
    }

    // 2. Git hata kontrolü (ÖNCELİK 1 - EN ÖNEMLİ!)
    const gitStatus = checkGitStatus();
    if (!gitStatus.success) {
      todoLock.gitError = true;
      todoLock.gitErrorMessage = gitStatus.error || "Git hatası tespit edildi";
      saveTodoLock(todoLock);

      return {
        success: false,
        canProceed: false,
        reason: "Git hatası var - Bir sonraki göreve geçilemez!",
        gitError: true,
        gitErrorMessage: gitStatus.error || "Git hatası tespit edildi",
        completedTodos: todoLock.completedTodos,
        skippedTodos: todoLock.skippedTodos,
      };
    }

    // Git hatası yoksa temizle
    if (todoLock.gitError) {
      todoLock.gitError = false;
      todoLock.gitErrorMessage = null;
    }

    // 3. Todo durumu kontrolü
    if (todoStatus === "cancelled") {
      // İptal edilen todo'lar kaydedilir ama uyarı verilir
      if (!todoLock.skippedTodos.includes(todoId)) {
        todoLock.skippedTodos.push(todoId);
      }
      saveTodoLock(todoLock);

      return {
        success: false,
        canProceed: false,
        reason:
          "TODO iptal edilemez! Çok ekstrem durumlarda kullanıcıya sorulmalı. Sistem todo'yu iptal etmeye izin vermiyor.",
        completedTodos: todoLock.completedTodos,
        skippedTodos: todoLock.skippedTodos,
      };
    }

    // 4. Todo tamamlandı mı kontrolü
    if (todoStatus === "completed") {
      if (!todoLock.completedTodos.includes(todoId)) {
        todoLock.completedTodos.push(todoId);
        todoLock.reportCounter++;
      }

      // Todo tamamlandı, lock'u güncelle
      todoLock.currentTodo = null;
      saveTodoLock(todoLock);

      // Ara rapor kontrolü (her 10 todo'da bir)
      const reportCheck = shouldReportProgress(
        todoLock.reportCounter,
        todoLock.totalTodos
      );
      const nextReportAt = reportCheck.shouldReport
        ? todoLock.reportCounter
        : reportCheck.nextReportAt;

      return {
        success: true,
        canProceed: true,
        reason: "TODO tamamlandı",
        completedTodos: todoLock.completedTodos,
        skippedTodos: todoLock.skippedTodos,
        nextReportAt,
      };
    }

    // 5. Todo devam ediyor
    if (todoStatus === "in_progress") {
      todoLock.currentTodo = todoId;
      saveTodoLock(todoLock);

      return {
        success: true,
        canProceed: true,
        reason: "TODO devam ediyor",
        completedTodos: todoLock.completedTodos,
        skippedTodos: todoLock.skippedTodos,
      };
    }

    return {
      success: true,
      canProceed: true,
      reason: "TODO bekliyor",
      completedTodos: todoLock.completedTodos,
      skippedTodos: todoLock.skippedTodos,
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
 * TODO listesi oluşturulduğunda çağrılır
 * Toplam todo sayısını kaydeder
 */
export function registerTodoList(totalTodos: number): void {
  let todoLock: TodoLock = {
    currentTodo: null,
    completedTodos: [],
    skippedTodos: [],
    gitError: false,
    gitErrorMessage: null,
    reportCounter: 0,
    lastReportAt: 0,
    totalTodos: 0,
  };

  if (fs.existsSync(TODO_LOCK_FILE)) {
    try {
      todoLock = JSON.parse(fs.readFileSync(TODO_LOCK_FILE, "utf-8"));
    } catch (error) {
      // Lock dosyası bozuksa sıfırdan başla
    }
  }

  todoLock.totalTodos = totalTodos;
  saveTodoLock(todoLock);
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

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Git hatası tespit edildi",
    };
  }
}

/**
 * Todo lock dosyasını kaydet
 */
function saveTodoLock(todoLock: TodoLock): void {
  fs.mkdirSync(path.dirname(TODO_LOCK_FILE), { recursive: true });
  fs.writeFileSync(TODO_LOCK_FILE, JSON.stringify(todoLock, null, 2), "utf-8");
}

/**
 * Ara rapor kontrolü
 * Her 10 todo'da bir veya tamamlandığında true döner
 * ÖNEMLİ: Her todo bitince ara rapor VERİLMEZ!
 */
export function shouldReportProgress(
  completedTodoCount: number,
  totalTodos: number
): {
  shouldReport: boolean;
  reason: string;
  nextReportAt: number;
} {
  // Toplam todo 10'dan azsa, tamamlandığında rapor (ama her todo bitince DEĞİL!)
  if (totalTodos < 10) {
    if (completedTodoCount === totalTodos) {
      return {
        shouldReport: true,
        reason: `Tüm todo'lar tamamlandı (${completedTodoCount}/${totalTodos})`,
        nextReportAt: totalTodos,
      };
    }
    return {
      shouldReport: false,
      reason: `Todo'lar devam ediyor (${completedTodoCount}/${totalTodos}) - 10'dan az todo var, tamamlandığında rapor verilecek`,
      nextReportAt: totalTodos,
    };
  }

  // 10 todo'da bir rapor
  if (completedTodoCount > 0 && completedTodoCount % 10 === 0) {
    return {
      shouldReport: true,
      reason: `${completedTodoCount} todo tamamlandı (10 todo'da bir rapor)`,
      nextReportAt: completedTodoCount + 10,
    };
  }

  // Bir sonraki rapor noktasını hesapla
  const nextReportAt = Math.floor(completedTodoCount / 10) * 10 + 10;

  return {
    shouldReport: false,
    reason: `${completedTodoCount} todo tamamlandı - Bir sonraki rapor ${nextReportAt}. todo'da`,
    nextReportAt,
  };
}

/**
 * Tüm todo'lar tamamlandı mı?
 */
export function checkAllTodosCompleted(
  completedTodos: string[],
  totalTodos: number
): boolean {
  return completedTodos.length === totalTodos;
}

/**
 * Atlanan todo kontrolü
 * Atlanan todo var mı?
 */
export function hasSkippedTodos(skippedTodos: string[]): boolean {
  return skippedTodos.length > 0;
}
