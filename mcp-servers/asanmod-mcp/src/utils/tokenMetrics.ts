/**
 * Token Metrics Tracking
 * Tracks token usage, cache hit rates, and performance metrics
 */

export interface TokenMetrics {
  timestamp: number;
  operation: string;
  tokensUsed: number;
  cacheHit: boolean;
  method: string;
  filePath?: string;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  totalOperations: number;
  totalTokens: number;
}

class MetricsCollector {
  private metrics: TokenMetrics[] = [];
  private cacheStats = { hits: 0, misses: 0 };
  private performanceStats: { totalTime: number; count: number } = {
    totalTime: 0,
    count: 0,
  };

  /**
   * Record token usage
   */
  recordTokenUsage(metric: TokenMetrics): void {
    this.metrics.push(metric);

    // Update cache stats
    if (metric.cacheHit) {
      this.cacheStats.hits++;
    } else {
      this.cacheStats.misses++;
    }
  }

  /**
   * Record performance metric
   */
  recordPerformance(duration: number): void {
    this.performanceStats.totalTime += duration;
    this.performanceStats.count++;
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): CacheMetrics {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      hitRate: total > 0 ? (this.cacheStats.hits / total) * 100 : 0,
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      averageResponseTime:
        this.performanceStats.count > 0
          ? this.performanceStats.totalTime / this.performanceStats.count
          : 0,
      totalOperations: this.performanceStats.count,
      totalTokens: this.metrics.reduce((sum, m) => sum + m.tokensUsed, 0),
    };
  }

  /**
   * Get token usage by operation
   */
  getTokenUsageByOperation(): Record<string, number> {
    const usage: Record<string, number> = {};
    for (const metric of this.metrics) {
      usage[metric.operation] =
        (usage[metric.operation] || 0) + metric.tokensUsed;
    }
    return usage;
  }

  /**
   * Get token usage by method
   */
  getTokenUsageByMethod(): Record<string, number> {
    const usage: Record<string, number> = {};
    for (const metric of this.metrics) {
      usage[metric.method] = (usage[metric.method] || 0) + metric.tokensUsed;
    }
    return usage;
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    cache: CacheMetrics;
    performance: PerformanceMetrics;
    tokenUsage: {
      total: number;
      byOperation: Record<string, number>;
      byMethod: Record<string, number>;
    };
  } {
    return {
      cache: this.getCacheHitRate(),
      performance: this.getPerformanceMetrics(),
      tokenUsage: {
        total: this.metrics.reduce((sum, m) => sum + m.tokensUsed, 0),
        byOperation: this.getTokenUsageByOperation(),
        byMethod: this.getTokenUsageByMethod(),
      },
    };
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
    this.cacheStats = { hits: 0, misses: 0 };
    this.performanceStats = { totalTime: 0, count: 0 };
  }

  /**
   * Export metrics to JSON
   */
  export(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        summary: this.getSummary(),
      },
      null,
      2
    );
  }
}

export const tokenMetrics = new MetricsCollector();

/**
 * Estimate tokens from content length
 * Rough estimation: 1 token ≈ 4 characters
 */
export function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

/**
 * Record file read operation
 */
export function recordFileRead(
  filePath: string,
  content: string,
  fromCache: boolean,
  method: string
): void {
  const tokensUsed = estimateTokens(content);

  tokenMetrics.recordTokenUsage({
    timestamp: Date.now(),
    operation: "file_read",
    tokensUsed: fromCache ? 0 : tokensUsed, // Cache hit = 0 tokens
    cacheHit: fromCache,
    method,
    filePath,
  });
}

/**
 * Record compact output usage
 */
export function recordCompactOutput(
  originalSize: number,
  compactSize: number
): void {
  const tokensSaved = originalSize - compactSize;

  tokenMetrics.recordTokenUsage({
    timestamp: Date.now(),
    operation: "compact_output",
    tokensUsed: compactSize,
    cacheHit: false,
    method: "compact",
  });
}
