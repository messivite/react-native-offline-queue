import type { OfflineAction } from './types';

// Key-Value adapter (MMKV, AsyncStorage, Memory)
// Stores entire queue as a single JSON string
export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
}

// Record-based adapter (Realm, SQLite, WatermelonDB)
// Each queue item is a separate database record — much faster for large queues
export interface RecordStorageAdapter {
  insert: (action: OfflineAction) => Promise<void> | void;
  remove: (id: string) => Promise<void> | void;
  getAll: () => Promise<OfflineAction[]> | OfflineAction[];
  clear: () => Promise<void> | void;
  update: (id: string, partial: Partial<OfflineAction>) => Promise<void> | void;
}

// Type guard to check which adapter type is being used
export function isRecordAdapter(
  adapter: StorageAdapter | RecordStorageAdapter
): adapter is RecordStorageAdapter {
  return 'insert' in adapter && 'getAll' in adapter;
}

export class MemoryStorageAdapter implements StorageAdapter {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }
}
