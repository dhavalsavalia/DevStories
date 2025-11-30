import * as vscode from 'vscode';

export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
  show(): void;
  dispose(): void;
}

export function createLogger(): Logger {
  const channel = vscode.window.createOutputChannel('DevStories');

  const formatMessage = (level: string, message: string, args: unknown[]): string => {
    const parts = [message];
    for (const arg of args) {
      if (arg instanceof Error) {
        parts.push(arg.message);
        if (arg.stack) {
          parts.push(arg.stack);
        }
      } else if (typeof arg === 'object') {
        parts.push(JSON.stringify(arg));
      } else {
        parts.push(String(arg));
      }
    }
    return `[${level}] ${parts.join(' ')}`;
  };

  const isDebugEnabled = (): boolean => {
    const config = vscode.workspace.getConfiguration('devstories');
    return config.get<boolean>('debug', false);
  };

  return {
    info(message: string, ...args: unknown[]): void {
      channel.appendLine(formatMessage('INFO', message, args));
    },

    warn(message: string, ...args: unknown[]): void {
      channel.appendLine(formatMessage('WARN', message, args));
    },

    error(message: string, ...args: unknown[]): void {
      channel.appendLine(formatMessage('ERROR', message, args));
    },

    debug(message: string, ...args: unknown[]): void {
      if (isDebugEnabled()) {
        channel.appendLine(formatMessage('DEBUG', message, args));
      }
    },

    show(): void {
      channel.show();
    },

    dispose(): void {
      channel.dispose();
    },
  };
}

// Singleton instance - initialized by extension activation
let loggerInstance: Logger | null = null;

export function initializeLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = createLogger();
  }
  return loggerInstance;
}

export function getLogger(): Logger {
  if (!loggerInstance) {
    throw new Error('Logger not initialized. Call initializeLogger() first.');
  }
  return loggerInstance;
}

export function disposeLogger(): void {
  if (loggerInstance) {
    loggerInstance.dispose();
    loggerInstance = null;
  }
}
