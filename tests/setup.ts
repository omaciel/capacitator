/**
 * Jest setup file for test environment configuration
 */

// Mock window.electronAPI for tests
const mockElectronAPI = {
  saveTemplate: jest.fn().mockResolvedValue({ success: true }),
  loadTemplate: jest.fn().mockResolvedValue({
    success: true,
    template: {
      teamVelocity: 88,
      sprintStarts: '2025-01-01',
      sprintEnds: '2025-01-15',
      reservedCapacity: 10,
      teamMembers: []
    }
  }),
  onMenuAction: jest.fn(),
  getAppInfo: jest.fn().mockResolvedValue({
    name: 'Test App',
    version: '1.0.0',
    platform: 'test'
  })
};

// Make electronAPI available globally in tests
(global as any).window = {
  ...global.window,
  electronAPI: mockElectronAPI
};

// Mock console methods to reduce test noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();

  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Helper function to suppress console output in tests
export const suppressConsole = () => {
  console.log = jest.fn();
  console.error = jest.fn();
};

// Helper function to restore console output
export const restoreConsole = () => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
};

// Mock DOM methods that might be used in tests
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock date for consistent testing
export const mockDate = (dateString: string) => {
  const mockDate = new Date(dateString);
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
};

export const restoreDate = () => {
  jest.restoreAllMocks();
};

// Export mock electronAPI for use in tests
export { mockElectronAPI };