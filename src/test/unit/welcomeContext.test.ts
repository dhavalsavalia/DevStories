import { describe, it, expect } from 'vitest';
import {
  CONTEXT_KEY_HAS_DEVSTORIES_FOLDER,
  CONTEXT_KEY_HAS_EPICS,
  determineWelcomeState,
  WelcomeState
} from '../../core/welcomeContextUtils';

describe('welcomeContext', () => {
  describe('context key constants', () => {
    it('should have correct key for devstories folder', () => {
      expect(CONTEXT_KEY_HAS_DEVSTORIES_FOLDER).toBe('devstories:hasDevstoriesFolder');
    });

    it('should have correct key for epics', () => {
      expect(CONTEXT_KEY_HAS_EPICS).toBe('devstories:hasEpics');
    });
  });

  describe('determineWelcomeState', () => {
    it('should return noFolder when folder does not exist', () => {
      const state = determineWelcomeState(false, 0);
      expect(state).toBe(WelcomeState.NoFolder);
    });

    it('should return noEpics when folder exists but no epics', () => {
      const state = determineWelcomeState(true, 0);
      expect(state).toBe(WelcomeState.NoEpics);
    });

    it('should return hasContent when folder exists and has epics', () => {
      const state = determineWelcomeState(true, 1);
      expect(state).toBe(WelcomeState.HasContent);
    });

    it('should return hasContent with multiple epics', () => {
      const state = determineWelcomeState(true, 5);
      expect(state).toBe(WelcomeState.HasContent);
    });
  });
});
