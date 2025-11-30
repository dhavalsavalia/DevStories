import { describe, it, expect, vi, beforeEach } from 'vitest';

// Shared mock state
const mockAppendLine = vi.fn();
const mockShow = vi.fn();
const mockDispose = vi.fn();
let mockDebugEnabled = false;

// Mock vscode module
vi.mock('vscode', () => ({
  window: {
    createOutputChannel: vi.fn(() => ({
      appendLine: mockAppendLine,
      show: mockShow,
      dispose: mockDispose,
      name: 'DevStories',
    })),
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string) => {
        if (key === 'debug') {
          return mockDebugEnabled;
        }
        return undefined;
      }),
    })),
  },
}));

describe('Logger Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDebugEnabled = false;
  });

  describe('createLogger', () => {
    it('should create logger with OutputChannel named DevStories', async () => {
      vi.resetModules();
      const { createLogger } = await import('../../core/logger');
      createLogger();

      const vscode = await import('vscode');
      expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('DevStories');
    });

    it('should return logger object with all methods', async () => {
      vi.resetModules();
      const { createLogger } = await import('../../core/logger');
      const logger = createLogger();

      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.show).toBeDefined();
      expect(logger.dispose).toBeDefined();
    });
  });

  describe('logger.info()', () => {
    it('should log info messages with [INFO] prefix', async () => {
      vi.resetModules();
      const { createLogger } = await import('../../core/logger');
      const logger = createLogger();

      logger.info('Test info message');

      expect(mockAppendLine).toHaveBeenCalledWith('[INFO] Test info message');
    });

    it('should handle multiple arguments', async () => {
      vi.resetModules();
      const { createLogger } = await import('../../core/logger');
      const logger = createLogger();

      logger.info('Message', 'arg1', 'arg2');

      expect(mockAppendLine).toHaveBeenCalledWith('[INFO] Message arg1 arg2');
    });
  });

  describe('logger.warn()', () => {
    it('should log warning messages with [WARN] prefix', async () => {
      vi.resetModules();
      const { createLogger } = await import('../../core/logger');
      const logger = createLogger();

      logger.warn('Test warning message');

      expect(mockAppendLine).toHaveBeenCalledWith('[WARN] Test warning message');
    });
  });

  describe('logger.error()', () => {
    it('should log error messages with [ERROR] prefix', async () => {
      vi.resetModules();
      const { createLogger } = await import('../../core/logger');
      const logger = createLogger();

      logger.error('Test error message');

      expect(mockAppendLine).toHaveBeenCalledWith('[ERROR] Test error message');
    });

    it('should log error objects with message and stack', async () => {
      vi.resetModules();
      const { createLogger } = await import('../../core/logger');
      const logger = createLogger();
      const testError = new Error('Test error');

      logger.error('Error occurred:', testError);

      expect(mockAppendLine).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error occurred: Test error')
      );
    });
  });

  describe('logger.debug()', () => {
    it('should not log debug messages when devstories.debug is false', async () => {
      mockDebugEnabled = false;
      vi.resetModules();
      const { createLogger } = await import('../../core/logger');
      const logger = createLogger();

      logger.debug('Debug message');

      const debugCalls = mockAppendLine.mock.calls.filter(
        (call: string[]) => call[0]?.includes('[DEBUG]')
      );
      expect(debugCalls.length).toBe(0);
    });

    it('should log debug messages when devstories.debug is true', async () => {
      mockDebugEnabled = true;
      vi.resetModules();
      const { createLogger } = await import('../../core/logger');
      const logger = createLogger();

      logger.debug('Debug message');

      expect(mockAppendLine).toHaveBeenCalledWith('[DEBUG] Debug message');
    });
  });

  describe('logger.show()', () => {
    it('should show the output channel', async () => {
      vi.resetModules();
      const { createLogger } = await import('../../core/logger');
      const logger = createLogger();

      logger.show();

      expect(mockShow).toHaveBeenCalled();
    });
  });

  describe('logger.dispose()', () => {
    it('should dispose the output channel', async () => {
      vi.resetModules();
      const { createLogger } = await import('../../core/logger');
      const logger = createLogger();

      logger.dispose();

      expect(mockDispose).toHaveBeenCalled();
    });
  });

  describe('singleton pattern', () => {
    it('initializeLogger should create singleton', async () => {
      vi.resetModules();
      const { initializeLogger, getLogger } = await import('../../core/logger');

      const logger1 = initializeLogger();
      const logger2 = getLogger();

      expect(logger1).toBe(logger2);
    });

    it('getLogger should throw if not initialized', async () => {
      vi.resetModules();
      const { getLogger, disposeLogger } = await import('../../core/logger');

      // Dispose any existing instance
      disposeLogger();

      expect(() => getLogger()).toThrow('Logger not initialized');
    });

    it('disposeLogger should clean up singleton', async () => {
      vi.resetModules();
      const { initializeLogger, disposeLogger, getLogger } = await import('../../core/logger');

      initializeLogger();
      disposeLogger();

      expect(() => getLogger()).toThrow('Logger not initialized');
    });
  });
});
