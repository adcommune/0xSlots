class FetchCache {
  private cache = new Map<string, { data: unknown; ts: number }>();
  private activeFetches = new Map<string, Promise<unknown>>();

  get<T>(key: string, ttl?: number): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (ttl && Date.now() - cached.ts > ttl) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  has(key: string, ttl?: number): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    if (ttl && Date.now() - cached.ts > ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, ts: Date.now() });
  }

  getActiveFetch<T>(key: string): Promise<T> | undefined {
    return this.activeFetches.get(key) as Promise<T> | undefined;
  }

  setActiveFetch<T>(key: string, promise: Promise<T>): void {
    this.activeFetches.set(key, promise);
    promise.finally(() => {
      this.activeFetches.delete(key);
    });
  }

  clear(): void {
    this.cache.clear();
    this.activeFetches.clear();
  }
}

export default FetchCache;
