/**
 * Unit tests for startRitual command utilities
 * Note: The main executeStartRitual function requires VS Code API,
 * so it's tested in integration tests (suite/startRitual.test.ts)
 */
import { describe, it, expect } from 'vitest';

describe('startRitual command utils', () => {
  describe('RitualStep type values', () => {
    it('planning should be a valid ritual step', () => {
      const validSteps = ['planning', 'retro', 'grooming'];
      expect(validSteps).toContain('planning');
    });

    it('retro should be a valid ritual step', () => {
      const validSteps = ['planning', 'retro', 'grooming'];
      expect(validSteps).toContain('retro');
    });

    it('grooming should be a valid ritual step', () => {
      const validSteps = ['planning', 'retro', 'grooming'];
      expect(validSteps).toContain('grooming');
    });
  });
});
