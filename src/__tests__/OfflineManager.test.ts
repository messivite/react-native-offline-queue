import { OfflineManager } from '../core/OfflineManager';

// Reset the singleton before each test
beforeEach(async () => {
  await OfflineManager.clear();
  // Reset internal state
  (OfflineManager as any).isSyncing = false;
  (OfflineManager as any).isInitialized = false;
  (OfflineManager as any).onSyncAction = undefined;
  (OfflineManager as any).onOnlineRestore = undefined;
  (OfflineManager as any).actionHandlers = new Map();
  (OfflineManager as any)._isOnline = null;

  await OfflineManager.configure({
    storageType: 'memory',
    syncMode: 'auto',
  });
});

describe('OfflineManager', () => {
  // ─── Queue CRUD ───

  describe('push', () => {
    it('should add an action to the queue', async () => {
      const action = await OfflineManager.push('LIKE_POST', { postId: '123' });

      expect(action.actionName).toBe('LIKE_POST');
      expect(action.payload).toEqual({ postId: '123' });
      expect(action.id).toBeDefined();
      expect(action.createdAt).toBeGreaterThan(0);
      expect(action.retryCount).toBe(0);
    });

    it('should add multiple actions to the queue', async () => {
      await OfflineManager.push('ACTION_1', { a: 1 });
      await OfflineManager.push('ACTION_2', { b: 2 });
      await OfflineManager.push('ACTION_3', { c: 3 });

      expect(OfflineManager.getQueue()).toHaveLength(3);
    });

    it('should generate unique IDs', async () => {
      const a1 = await OfflineManager.push('A', {});
      const a2 = await OfflineManager.push('A', {});

      expect(a1.id).not.toBe(a2.id);
    });
  });

  describe('remove', () => {
    it('should remove an action by id', async () => {
      const action = await OfflineManager.push('TEST', { x: 1 });
      expect(OfflineManager.getQueue()).toHaveLength(1);

      await OfflineManager.remove(action.id);
      expect(OfflineManager.getQueue()).toHaveLength(0);
    });

    it('should not throw when removing non-existent id', async () => {
      await expect(OfflineManager.remove('non-existent')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all items from the queue', async () => {
      await OfflineManager.push('A', {});
      await OfflineManager.push('B', {});
      await OfflineManager.push('C', {});

      await OfflineManager.clear();
      expect(OfflineManager.getQueue()).toHaveLength(0);
    });
  });

  describe('getQueue', () => {
    it('should return empty array initially', () => {
      expect(OfflineManager.getQueue()).toEqual([]);
    });

    it('should return current queue contents', async () => {
      await OfflineManager.push('TEST', { data: 'hello' });
      const queue = OfflineManager.getQueue();

      expect(queue).toHaveLength(1);
      expect(queue[0].actionName).toBe('TEST');
      expect(queue[0].payload).toEqual({ data: 'hello' });
    });
  });

  // ─── Queue Subscriptions ───

  describe('subscribeQueue', () => {
    it('should notify listeners when queue changes', async () => {
      const listener = jest.fn();
      const unsubscribe = OfflineManager.subscribeQueue(listener);

      await OfflineManager.push('TEST', {});
      expect(listener).toHaveBeenCalled();

      unsubscribe();
    });

    it('should stop notifying after unsubscribe', async () => {
      const listener = jest.fn();
      const unsubscribe = OfflineManager.subscribeQueue(listener);

      unsubscribe();
      listener.mockClear();

      await OfflineManager.push('TEST', {});
      expect(listener).not.toHaveBeenCalled();
    });
  });

  // ─── Network Status ───

  describe('network status', () => {
    it('should start with null', () => {
      (OfflineManager as any)._isOnline = null;
      expect(OfflineManager.isOnline).toBeNull();
    });

    it('should update via setOnline', () => {
      OfflineManager.setOnline(true);
      expect(OfflineManager.isOnline).toBe(true);

      OfflineManager.setOnline(false);
      expect(OfflineManager.isOnline).toBe(false);
    });

    it('should not notify listeners if value unchanged', () => {
      const listener = jest.fn();
      OfflineManager.subscribeNetwork(listener);

      OfflineManager.setOnline(true);
      listener.mockClear();

      OfflineManager.setOnline(true); // same value
      expect(listener).not.toHaveBeenCalled();
    });

    it('should notify listeners on change', () => {
      const listener = jest.fn();
      const unsubscribe = OfflineManager.subscribeNetwork(listener);

      OfflineManager.setOnline(true);
      expect(listener).toHaveBeenCalledTimes(1);

      OfflineManager.setOnline(false);
      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();
    });

    it('getNetworkSnapshot should return current value', () => {
      OfflineManager.setOnline(true);
      expect(OfflineManager.getNetworkSnapshot()).toBe(true);

      OfflineManager.setOnline(false);
      expect(OfflineManager.getNetworkSnapshot()).toBe(false);
    });
  });

  // ─── Handler Registry ───

  describe('handler registry', () => {
    it('should register a handler', () => {
      const handler = jest.fn();
      OfflineManager.registerHandler('TEST', handler);

      expect(OfflineManager.getHandler('TEST')).toBe(handler);
    });

    it('should return undefined for unregistered handler', () => {
      expect(OfflineManager.getHandler('UNKNOWN')).toBeUndefined();
    });

    it('should unregister a handler', () => {
      const handler = jest.fn();
      OfflineManager.registerHandler('TEST', handler);
      OfflineManager.unregisterHandler('TEST');

      expect(OfflineManager.getHandler('TEST')).toBeUndefined();
    });

    it('should overwrite handler with same name', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      OfflineManager.registerHandler('TEST', handler1);
      OfflineManager.registerHandler('TEST', handler2);

      expect(OfflineManager.getHandler('TEST')).toBe(handler2);
    });
  });

  // ─── flushQueue ───

  describe('flushQueue', () => {
    it('should do nothing with empty queue', async () => {
      const handler = jest.fn();
      OfflineManager.onSyncAction = handler;

      await OfflineManager.flushQueue();
      expect(handler).not.toHaveBeenCalled();
    });

    it('should process all items with onSyncAction', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      OfflineManager.onSyncAction = handler;

      await OfflineManager.push('A', { x: 1 });
      await OfflineManager.push('B', { y: 2 });

      await OfflineManager.flushQueue();

      expect(handler).toHaveBeenCalledTimes(2);
      expect(OfflineManager.getQueue()).toHaveLength(0);
    });

    it('should use per-action handler over onSyncAction', async () => {
      const globalHandler = jest.fn().mockResolvedValue(undefined);
      const perActionHandler = jest.fn().mockResolvedValue(undefined);

      OfflineManager.onSyncAction = globalHandler;
      OfflineManager.registerHandler('SPECIAL', perActionHandler);

      await OfflineManager.push('SPECIAL', { data: 'test' });
      await OfflineManager.flushQueue();

      expect(perActionHandler).toHaveBeenCalledWith({ data: 'test' });
      expect(globalHandler).not.toHaveBeenCalled();
    });

    it('should fallback to onSyncAction when no per-action handler', async () => {
      const globalHandler = jest.fn().mockResolvedValue(undefined);
      OfflineManager.onSyncAction = globalHandler;

      await OfflineManager.push('NO_HANDLER', { data: 'test' });
      await OfflineManager.flushQueue();

      expect(globalHandler).toHaveBeenCalledTimes(1);
      expect(globalHandler.mock.calls[0][0].actionName).toBe('NO_HANDLER');
    });

    it('should increment retryCount on failure', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('API Error'));
      OfflineManager.onSyncAction = handler;

      await OfflineManager.push('FAIL', { x: 1 });
      await OfflineManager.flushQueue();

      const queue = OfflineManager.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].retryCount).toBe(1);
    });

    it('should keep failed items in queue', async () => {
      const handler = jest.fn()
        .mockResolvedValueOnce(undefined)         // first succeeds
        .mockRejectedValueOnce(new Error('Fail')) // second fails
        .mockResolvedValueOnce(undefined);        // third succeeds

      OfflineManager.onSyncAction = handler;

      await OfflineManager.push('A', {});
      await OfflineManager.push('B', {});
      await OfflineManager.push('C', {});

      await OfflineManager.flushQueue();

      const queue = OfflineManager.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].actionName).toBe('B');
    });

    it('should not run if already syncing', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      OfflineManager.onSyncAction = handler;

      await OfflineManager.push('A', {});

      // Simulate already syncing
      (OfflineManager as any).isSyncing = true;
      await OfflineManager.flushQueue();

      expect(handler).not.toHaveBeenCalled();
    });

    it('should warn when no handlers configured', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await OfflineManager.push('A', {});
      await OfflineManager.flushQueue();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No handlers registered')
      );
      consoleSpy.mockRestore();
    });

    it('should error when action has no handler and no onSyncAction', async () => {
      OfflineManager.registerHandler('OTHER', jest.fn().mockResolvedValue(undefined));

      await OfflineManager.push('UNHANDLED', { x: 1 });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      await OfflineManager.flushQueue();

      // Action should fail and stay in queue
      const queue = OfflineManager.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].actionName).toBe('UNHANDLED');

      consoleSpy.mockRestore();
    });
  });

  // ─── Sync Progress ───

  describe('syncProgress', () => {
    it('should start with inactive progress', () => {
      expect(OfflineManager.syncProgress.isActive).toBe(false);
      expect(OfflineManager.syncProgress.totalCount).toBe(0);
    });

    it('should track progress during sync', async () => {
      const progressStates: any[] = [];

      OfflineManager.subscribeProgress(() => {
        progressStates.push({ ...OfflineManager.syncProgress });
      });

      OfflineManager.onSyncAction = jest.fn().mockResolvedValue(undefined);
      await OfflineManager.push('A', {});
      await OfflineManager.push('B', {});

      await OfflineManager.flushQueue();

      // Should have active = true at some point
      expect(progressStates.some((p) => p.isActive)).toBe(true);
      // Should end with active = false
      expect(progressStates[progressStates.length - 1].isActive).toBe(false);
    });

    it('should track per-item status', async () => {
      const handler = jest.fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('fail'));

      OfflineManager.onSyncAction = handler;
      await OfflineManager.push('OK', {});
      await OfflineManager.push('FAIL', {});

      await OfflineManager.flushQueue();

      const items = OfflineManager.syncProgress.items;
      expect(items[0].status).toBe('success');
      expect(items[1].status).toBe('failed');
      expect(items[1].error).toBe('fail');
    });
  });

  // ─── handleOnlineRestore ───

  describe('handleOnlineRestore', () => {
    it('should auto flush in auto mode', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await OfflineManager.configure({
        storageType: 'memory',
        syncMode: 'auto',
        onSyncAction: handler,
      });

      await OfflineManager.push('A', {});
      OfflineManager.handleOnlineRestore();

      // Wait for async flush
      await new Promise((r) => setTimeout(r, 50));
      expect(handler).toHaveBeenCalled();
    });

    it('should call onOnlineRestore in manual mode', async () => {
      const restoreCallback = jest.fn();
      await OfflineManager.configure({
        storageType: 'memory',
        syncMode: 'manual',
        onOnlineRestore: restoreCallback,
      });

      await OfflineManager.push('A', {});
      OfflineManager.handleOnlineRestore();

      expect(restoreCallback).toHaveBeenCalledWith({
        pendingCount: 1,
        syncNow: expect.any(Function),
        discardQueue: expect.any(Function),
      });
    });

    it('should do nothing with empty queue', () => {
      const handler = jest.fn();
      OfflineManager.onSyncAction = handler;

      OfflineManager.handleOnlineRestore();
      expect(handler).not.toHaveBeenCalled();
    });

    it('discardQueue should clear the queue', async () => {
      const restoreCallback = jest.fn();
      await OfflineManager.configure({
        storageType: 'memory',
        syncMode: 'manual',
        onOnlineRestore: restoreCallback,
      });

      await OfflineManager.push('A', {});
      OfflineManager.handleOnlineRestore();

      // Call discardQueue from the callback
      const { discardQueue } = restoreCallback.mock.calls[0][0];
      await discardQueue();

      expect(OfflineManager.getQueue()).toHaveLength(0);
    });
  });

  // ─── Configuration ───

  describe('configure', () => {
    it('should set syncMode', async () => {
      await OfflineManager.configure({
        storageType: 'memory',
        syncMode: 'manual',
      });

      expect(OfflineManager.syncMode).toBe('manual');
    });

    it('should set onSyncAction', async () => {
      const handler = jest.fn();
      await OfflineManager.configure({
        storageType: 'memory',
        onSyncAction: handler,
      });

      expect(OfflineManager.onSyncAction).toBe(handler);
    });

    it('should mark as initialized', async () => {
      (OfflineManager as any).isInitialized = false;
      await OfflineManager.configure({ storageType: 'memory' });

      expect(OfflineManager.isInitialized).toBe(true);
    });
  });
});
