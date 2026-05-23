/**
 * ASANMOD MCP Cache Layer
 * Memory Map (LRU veya TTL=24h) ile kural ve lint sonuçlarını cache'ler
 * Token optimization: File content caching (TTL=1h)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
  hash?: string; // File hash for invalidation
}

export class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 24 * 60 * 60 * 1000; // 24 hours
  private fileCacheTTL = 60 * 60 * 1000; // 1 hour for file content

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl?: number, hash?: string): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hash,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Lint cache için hash-based key
  getLintKey(path: string, contentHash: string): string {
    return `lint:${path}:${contentHash}`;
  }

  // Rule cache için key
  getRuleKey(ruleId: string): string {
    return `rule:${ruleId}`;
  }

  // Pattern cache için key
  getPatternKey(patternType: string): string {
    return `pattern:${patternType}`;
  }

  // File cache için key (hash-based)
  getFileCacheKey(filePath: string, hash: string): string {
    return `file:${filePath}:${hash}`;
  }

  // File cache için key (hash olmadan)
  getFileCacheKeyWithoutHash(filePath: string): string {
    return `file:${filePath}`;
  }

  // File cache get (hash kontrolü ile)
  getFile<T>(filePath: string, currentHash: string): T | null {
    const key = this.getFileCacheKey(filePath, currentHash);
    const entry = this.cache.get(key);

    if (!entry) {
      // Try without hash (backward compatibility)
      const keyWithoutHash = this.getFileCacheKeyWithoutHash(filePath);
      const entryWithoutHash = this.cache.get(keyWithoutHash);
      if (entryWithoutHash) {
        // Check if hash matches
        if (entryWithoutHash.hash === currentHash) {
          return entryWithoutHash.data as T;
        }
        // Hash mismatch, remove old entry
        this.cache.delete(keyWithoutHash);
      }
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Verify hash matches
    if (entry.hash && entry.hash !== currentHash) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // File cache set (hash ile)
  setFile<T>(filePath: string, data: T, hash: string, ttl?: number): void {
    const key = this.getFileCacheKey(filePath, hash);
    this.set(key, data, ttl || this.fileCacheTTL, hash);

    // Also set without hash for backward compatibility (will be removed in future)
    const keyWithoutHash = this.getFileCacheKeyWithoutHash(filePath);
    this.set(keyWithoutHash, data, ttl || this.fileCacheTTL, hash);
  }
}

export const cache = new Cache();
