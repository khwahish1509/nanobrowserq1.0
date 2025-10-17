/**
 * Action Pattern Cache for Gemini Nano
 * Caches successful action patterns to avoid redundant LLM calls
 */

export interface CachedActionPattern {
  id: string;
  pattern: string; // e.g., "portfolio_github_link", "navigation_menu"
  urlPattern: RegExp;
  taskKeywords: string[];
  actions: Record<string, unknown>[];
  successCount: number;
  failureCount: number;
  lastUsed: Date;
  confidence: number;
}

export class ActionPatternCache {
  private cache: Map<string, CachedActionPattern[]> = new Map();
  private readonly maxCacheSize = 100;
  private readonly confidenceThreshold = 0.85;
  private readonly ttl = 5 * 60 * 1000; // 5 minutes

  /**
   * Try to find a cached action pattern for this task/URL combination
   */
  getCachedActions(url: string, taskDescription: string): Record<string, unknown>[] | null {
    const patterns = this.cache.get(this.getCacheKey(url));
    if (!patterns) return null;

    const keyword = taskDescription.toLowerCase();
    const match = patterns.find(
      p =>
        p.taskKeywords.some(k => keyword.includes(k)) &&
        p.confidence > this.confidenceThreshold &&
        Date.now() - p.lastUsed.getTime() < this.ttl,
    );

    if (match) {
      match.lastUsed = new Date();
      console.log(`[ActionCache] Cache hit for pattern: ${match.pattern}, confidence: ${match.confidence}`);
      return match.actions;
    }

    return null;
  }

  /**
   * Store a successful action pattern
   */
  cacheSuccessfulPattern(
    url: string,
    taskDescription: string,
    actions: Record<string, unknown>[],
    pattern?: string,
  ): void {
    const key = this.getCacheKey(url);
    const patterns = this.cache.get(key) || [];

    // Extract keywords from task
    const keywords = this.extractKeywords(taskDescription);

    const newPattern: CachedActionPattern = {
      id: `${key}_${Date.now()}`,
      pattern: pattern || `pattern_${keywords[0]}`,
      urlPattern: new RegExp(this.urlToPattern(url)),
      taskKeywords: keywords,
      actions: actions,
      successCount: 1,
      failureCount: 0,
      lastUsed: new Date(),
      confidence: 0.85, // Start with moderate confidence
    };

    patterns.push(newPattern);

    // Keep cache size manageable
    if (patterns.length > this.maxCacheSize) {
      patterns.sort((a, b) => b.confidence - a.confidence);
      patterns.pop();
    }

    this.cache.set(key, patterns);
    console.log(`[ActionCache] Cached pattern: ${newPattern.pattern} for ${url}`);
  }

  /**
   * Update confidence based on success/failure
   */
  updatePatternConfidence(url: string, pattern: string, success: boolean): void {
    const key = this.getCacheKey(url);
    const patterns = this.cache.get(key);
    if (!patterns) return;

    const p = patterns.find(x => x.pattern === pattern);
    if (!p) return;

    if (success) {
      p.successCount++;
    } else {
      p.failureCount++;
    }

    // Recalculate confidence: success rate with decay for old patterns
    const totalAttempts = p.successCount + p.failureCount;
    const successRate = p.successCount / totalAttempts;
    const timeSinceUsed = Date.now() - p.lastUsed.getTime();
    const decayFactor = Math.exp(-timeSinceUsed / (24 * 60 * 60 * 1000)); // Decay over 24h

    p.confidence = successRate * (0.5 + 0.5 * decayFactor);
    console.log(`[ActionCache] Updated confidence for ${pattern}: ${p.confidence.toFixed(2)}`);
  }

  /**
   * Clear cache (e.g., on page navigation)
   */
  clearUrlCache(url: string): void {
    this.cache.delete(this.getCacheKey(url));
  }

  /**
   * Clear entire cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats() {
    let totalPatterns = 0;
    let totalHits = 0;

    for (const patterns of this.cache.values()) {
      totalPatterns += patterns.length;
      totalHits += patterns.reduce((sum, p) => sum + p.successCount, 0);
    }

    return {
      totalPatterns,
      totalHits,
      cacheSize: this.cache.size,
      estimatedHitRate: totalPatterns > 0 ? totalHits / totalPatterns : 0,
    };
  }

  // Private helpers

  private getCacheKey(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.hostname}${urlObj.pathname}`.substring(0, 100);
    } catch {
      return url.substring(0, 100);
    }
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);
  }

  private urlToPattern(url: string): string {
    try {
      const urlObj = new URL(url);
      // Create a pattern that matches this domain and path prefix
      return `${urlObj.hostname}${urlObj.pathname.substring(0, 50)}`;
    } catch {
      return url.substring(0, 50);
    }
  }
}

/**
 * Global cache instance
 */
export const actionPatternCache = new ActionPatternCache();
