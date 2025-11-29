import { beforeEach, describe, expect, it } from 'vitest';
import { TutorialService } from '../../core/tutorialService';

interface MementoLike {
  get<T>(key: string, defaultValue?: T): T | undefined;
  update(key: string, value: any): Thenable<void>;
  keys(): readonly string[];
}

class MockMemento implements MementoLike {
  private store = new Map<string, unknown>();

  keys(): readonly string[] {
    return Array.from(this.store.keys());
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    if (this.store.has(key)) {
      return this.store.get(key) as T;
    }
    return defaultValue;
  }

  update(key: string, value: any): Promise<void> {
    if (value === undefined) {
      this.store.delete(key);
    } else {
      this.store.set(key, value);
    }
    return Promise.resolve();
  }
}

describe('TutorialService', () => {
  let service: TutorialService;
  let memento: MockMemento;

  beforeEach(() => {
    memento = new MockMemento();
    service = new TutorialService(memento);
  });

  it('includes required scenario coverage', () => {
    const stepIds = new Set(service.getSteps().map((step) => step.id));

    const requiredSteps = [
      'init',
      'create-epic',
      'create-story',
      'quick-capture',
      'board-drag-drop',
      'agile-solo-starter',
      'cadence-reminders',
    ];

    for (const id of requiredSteps) {
      expect(stepIds.has(id)).toBe(true);
    }
  });
  
  it('tracks completion progress and reset', async () => {
    await service.setStepCompletion('init', true);
    await service.setStepCompletion('create-epic', true);

    const progress = service.getProgress();
    expect(progress.completedCount).toBe(2);
    expect(progress.percentage).toBeGreaterThan(0);
    expect(progress.completedStepIds).toContain('init');

    await service.resetProgress();
    const afterReset = service.getProgress();
    expect(afterReset.completedCount).toBe(0);
    expect(afterReset.completedStepIds).toEqual([]);
  });
});
