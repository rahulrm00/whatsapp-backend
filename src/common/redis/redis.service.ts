import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { RedisClientType, createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClientType;
  private readonly logger = new Logger(RedisService.name);

  // ---------------------------
  // Lifecycle Hooks
  // ---------------------------
  async onModuleInit() {
    this.client = createClient({
      url: process.env['REDIS_URL'] || 'redis://localhost:6380',
      socket: {
        reconnectStrategy: retries => {
          this.logger.warn(`Redis reconnect attempt #${retries}`);
          return Math.min(retries * 50, 2000); // exponential backoff
        },
      },
    });

    this.client.on('connect', () => this.logger.log('✅ Redis connected'));
    this.client.on('error', (err) => this.logger.error('❌ Redis error', err));

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis connection closed');
  }

  getClient(): RedisClientType {
    return this.client;
  }

  // ---------------------------
  // Basic Key-Value
  // ---------------------------
  async set(key: string, value: any, ttlSeconds?: number) {
    try {
      const val = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.set(key, val, { EX: ttlSeconds });
      } else {
        await this.client.set(key, val);
      }
    } catch (err : any) {
      this.logger.error(`Redis set failed for key "${key}": ${err.message}`);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (err : any) {
      this.logger.error(`Redis get failed for key "${key}": ${err.message}`);
      return null;
    }
  }

  async del(key: string) {
    try {
      await this.client.del(key);
    } catch (err : any) {
      this.logger.error(`Redis del failed for key "${key}": ${err.message}`);
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (err : any) {
      this.logger.error(`Redis incr failed for key "${key}": ${err.message}`);
      return 0;
    }
  }
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (err : any) {
      this.logger.error(`Redis ttl failed for key "${key}": ${err.message}`);
      return -2; 
    } 
  } 

  async expire(key: string, ttl: number) {
    try {
      await this.client.expire(key, ttl);
    } catch (err : any) {
      this.logger.error(`Redis expire failed for key "${key}": ${err.message}`);
    }
  }

  // ---------------------------
  // Set Operations
  // ---------------------------
  async sadd(key: string, value: string) {
    try {
      return await this.client.sAdd(key, value);
    } catch (err : any) {
      this.logger.error(`Redis sadd failed for key "${key}": ${err.message}`);
      return 0;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      const members = await this.client.sMembers(key);
      return members || [];
    } catch (err : any) {
      this.logger.error(`Redis smembers failed for key "${key}": ${err.message}`);
      return [];
    }
  }

  async srem(key: string, value: string): Promise<number> {
    try {
      return await this.client.sRem(key, value);
    } catch (err : any) {
      this.logger.error(`Redis srem failed for key "${key}": ${err.message}`);
      return 0;
    }
  }

  async scan(pattern: string): Promise<string[]> {
    try {
      const keys: string[] = [];
      for await (const key of this.client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keys.push(...key);
     }
     return keys;
    } catch (err : any) {
      this.logger.error(`Redis scan failed for pattern "${pattern}": ${err.message}`);
      return [];
    }
  }

  // ---------------------------
  // Socket Mapping Helpers
  // ---------------------------
  async addSocket(key: string, socketId: string) {
    return this.sadd(key, socketId);
  }

  async removeSocket(key: string, socketId: string) {
    return this.srem(key, socketId);
  }

  async getSockets(key: string): Promise<string[]> {
    return this.smembers(key);
  }

  async clearSockets(key: string) {
    return this.del(key);
  }
}
