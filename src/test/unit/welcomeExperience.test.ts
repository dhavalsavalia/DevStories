import { describe, it, expect, vi } from 'vitest';
vi.mock('vscode', () => ({
  workspace: {
    workspaceFolders: [],
  },
}));
import { WelcomeExperience } from '../../core/welcomeExperience';
import type * as vscode from 'vscode';

class InMemoryMemento implements vscode.Memento {
  private store = new Map<string, unknown>();

  get<T>(key: string, defaultValue?: T): T | undefined {
    return (this.store.has(key) ? (this.store.get(key) as T) : defaultValue) as T | undefined;
  }

  async update(key: string, value: unknown): Promise<void> {
    if (value === undefined) {
      this.store.delete(key);
    } else {
      this.store.set(key, value);
    }
  }

  keys(): readonly string[] {
    return Array.from(this.store.keys());
  }
}

describe('WelcomeExperience', () => {
  it('should auto open before dismissal and not after', async () => {
    const memento = new InMemoryMemento();
    const experience = new WelcomeExperience(memento);

    expect(experience.shouldAutoOpen()).toBe(true);

    await experience.markDismissed();

    expect(experience.shouldAutoOpen()).toBe(false);
  });
});
