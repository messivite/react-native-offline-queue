// Mock for @react-native-community/netinfo
const listeners: Set<(state: any) => void> = new Set();

export default {
  addEventListener: jest.fn((callback: (state: any) => void) => {
    listeners.add(callback);
    // Emit initial state
    callback({ isConnected: true, type: 'wifi' });
    return () => listeners.delete(callback);
  }),
  fetch: jest.fn(() =>
    Promise.resolve({ isConnected: true, type: 'wifi' })
  ),
  // Helper for tests to simulate connectivity changes
  __simulateChange: (isConnected: boolean) => {
    listeners.forEach((l) => l({ isConnected, type: isConnected ? 'wifi' : 'none' }));
  },
};
