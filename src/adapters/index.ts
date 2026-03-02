import type { StorageAdapter } from '../core/StorageAdapter';
import type { RecordStorageAdapter } from '../core/StorageAdapter';
import type { OfflineAction } from '../core/types';

// Dynamic require approach so Metro doesn't crash if the user hasn't installed the optional library

export const getMMKVAdapter = (): StorageAdapter => {
  try {
    const { MMKV } = require('react-native-mmkv');
    const storage = new MMKV();
    return {
      getItem: (key) => storage.getString(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    };
  } catch (error) {
    throw new Error(
      "[OfflineQueue] You selected 'mmkv' storage but react-native-mmkv is not installed. Run 'npm install react-native-mmkv' and 'pod install'."
    );
  }
};

export const getAsyncStorageAdapter = (): StorageAdapter => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return {
      getItem: async (key) => await AsyncStorage.getItem(key),
      setItem: async (key, value) => await AsyncStorage.setItem(key, value),
      removeItem: async (key) => await AsyncStorage.removeItem(key),
    };
  } catch (error) {
    throw new Error(
      "[OfflineQueue] You selected 'async-storage' but @react-native-async-storage/async-storage is not installed. Run 'npm install @react-native-async-storage/async-storage' and 'pod install'."
    );
  }
};

// Default Realm schema for the offline queue
const OFFLINE_QUEUE_SCHEMA_NAME = 'OfflineQueueItem';

const OfflineQueueItemSchema = {
  name: OFFLINE_QUEUE_SCHEMA_NAME,
  primaryKey: 'id',
  properties: {
    id: 'string',
    actionName: 'string',
    payload: 'string',     // JSON-stringified payload
    createdAt: 'int',
    retryCount: { type: 'int', default: 0 },
  },
};

export interface RealmAdapterOptions {
  /** Pass your existing Realm instance to share it with your app */
  realmInstance?: any;
  /** Custom schema name (default: 'OfflineQueueItem') */
  schemaName?: string;
}

export const getRealmAdapter = (options?: RealmAdapterOptions): RecordStorageAdapter => {
  try {
    const Realm = require('realm');
    const schemaName = options?.schemaName || OFFLINE_QUEUE_SCHEMA_NAME;

    let realm: any;

    if (options?.realmInstance) {
      realm = options.realmInstance;
    } else {
      // Open a dedicated Realm with our default schema
      realm = new Realm({
        schema: [
          schemaName === OFFLINE_QUEUE_SCHEMA_NAME
            ? OfflineQueueItemSchema
            : { ...OfflineQueueItemSchema, name: schemaName },
        ],
        path: 'offline-queue.realm',
        schemaVersion: 1,
      });
    }

    return {
      insert: (action: OfflineAction) => {
        realm.write(() => {
          realm.create(schemaName, {
            id: action.id,
            actionName: action.actionName,
            payload: JSON.stringify(action.payload),
            createdAt: action.createdAt,
            retryCount: action.retryCount,
          });
        });
        return Promise.resolve();
      },

      remove: (id: string) => {
        realm.write(() => {
          const record = realm.objectForPrimaryKey(schemaName, id);
          if (record) realm.delete(record);
        });
        return Promise.resolve();
      },

      getAll: (): OfflineAction[] => {
        const records = realm.objects(schemaName).sorted('createdAt');
        return Array.from(records).map((r: any) => ({
          id: r.id,
          actionName: r.actionName,
          payload: JSON.parse(r.payload),
          createdAt: r.createdAt,
          retryCount: r.retryCount,
        }));
      },

      clear: () => {
        realm.write(() => {
          const all = realm.objects(schemaName);
          realm.delete(all);
        });
        return Promise.resolve();
      },

      update: (id: string, partial: Partial<OfflineAction>) => {
        realm.write(() => {
          const record = realm.objectForPrimaryKey(schemaName, id);
          if (record) {
            if (partial.retryCount !== undefined) record.retryCount = partial.retryCount;
            if (partial.payload !== undefined) record.payload = JSON.stringify(partial.payload);
            if (partial.actionName !== undefined) record.actionName = partial.actionName;
          }
        });
        return Promise.resolve();
      },
    };
  } catch (error) {
    throw new Error(
      "[OfflineQueue] You selected 'realm' storage but realm is not installed. Run 'npm install realm' and 'pod install'."
    );
  }
};

