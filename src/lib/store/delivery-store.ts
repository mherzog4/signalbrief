import "server-only";

import { getConfig } from "@/lib/config";
import { fetchJson } from "@/lib/http";

export interface DeliveryStore {
  acquire(key: string): Promise<boolean>;
  complete(key: string): Promise<void>;
  release(key: string): Promise<void>;
}

declare global {
  var __signalbriefDeliveryKeys: Map<string, number> | undefined;
}

class MemoryDeliveryStore implements DeliveryStore {
  private readonly keys = globalThis.__signalbriefDeliveryKeys ??= new Map();

  async acquire(key: string) {
    const expires = this.keys.get(key);
    if (expires && expires > Date.now()) return false;
    this.keys.set(key, Date.now() + 5 * 60_000);
    return true;
  }

  async complete(key: string) {
    this.keys.set(key, Date.now() + 7 * 24 * 60 * 60_000);
  }

  async release(key: string) {
    this.keys.delete(key);
  }
}

class UpstashDeliveryStore implements DeliveryStore {
  private readonly url: string;
  private readonly token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, "");
    this.token = token;
  }

  private command<T>(command: Array<string | number>) {
    return fetchJson<{ result: T }>("upstash", this.url, {
      method: "POST",
      headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
      body: JSON.stringify(command),
    });
  }

  async acquire(key: string) {
    const response = await this.command<"OK" | null>(["SET", key, "processing", "NX", "EX", 300]);
    return response.result === "OK";
  }

  async complete(key: string) {
    await this.command(["SET", key, "delivered", "EX", 604800]);
  }

  async release(key: string) {
    await this.command(["DEL", key]);
  }
}

export function createDeliveryStore(): DeliveryStore {
  const config = getConfig();
  return config.UPSTASH_REDIS_REST_URL && config.UPSTASH_REDIS_REST_TOKEN
    ? new UpstashDeliveryStore(config.UPSTASH_REDIS_REST_URL, config.UPSTASH_REDIS_REST_TOKEN)
    : new MemoryDeliveryStore();
}
