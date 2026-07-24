import * as fs from "fs";
import * as path from "path";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // in milliseconds
}

export class RegistryCache {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private cacheFilePath: string | null = null;

  constructor(workspaceRoot?: string) {
    if (workspaceRoot) {
      try {
        const cacheDir = path.join(workspaceRoot, ".gemini", "cache");
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }
        this.cacheFilePath = path.join(cacheDir, "registry-cache.json");
        this.loadFromFile();
      } catch (e) {
        console.error("Failed to initialize persistent file cache:", e);
      }
    }
  }

  private loadFromFile() {
    if (!this.cacheFilePath || !fs.existsSync(this.cacheFilePath)) return;
    try {
      const content = fs.readFileSync(this.cacheFilePath, "utf8");
      const parsed = JSON.parse(content);
      Object.keys(parsed).forEach((key) => {
        const entry = parsed[key];
        // Only load non-expired entries
        if (Date.now() - entry.timestamp < entry.ttl) {
          this.memoryCache.set(key, entry);
        }
      });
    } catch (e) {
      console.error("Failed to read cache from file:", e);
    }
  }

  private saveToFile() {
    if (!this.cacheFilePath) return;
    try {
      const obj: Record<string, any> = {};
      this.memoryCache.forEach((value, key) => {
        // Only save non-expired entries
        if (Date.now() - value.timestamp < value.ttl) {
          obj[key] = value;
        }
      });
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.error("Failed to save cache to file:", e);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.memoryCache.delete(key);
      this.saveToFile();
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    };
    this.memoryCache.set(key, entry);
    this.saveToFile();
  }

  clear(): void {
    this.memoryCache.clear();
    if (this.cacheFilePath && fs.existsSync(this.cacheFilePath)) {
      try {
        fs.unlinkSync(this.cacheFilePath);
      } catch (e) {
        console.error("Failed to delete cache file:", e);
      }
    }
  }
}
