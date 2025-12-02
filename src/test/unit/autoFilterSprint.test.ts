/**
 * Unit tests for auto-filter sprint functionality (DS-153)
 */

import { describe, it, expect } from 'vitest';
import { getAutoFilterSprint } from '../../core/autoFilterSprint';
import { ConfigData, DEFAULT_CONFIG } from '../../core/configServiceUtils';

describe('autoFilterSprint', () => {
  describe('getAutoFilterSprint', () => {
    it('should return currentSprint when autoFilterCurrentSprint is true', () => {
      const config: ConfigData = {
        ...DEFAULT_CONFIG,
        autoFilterCurrentSprint: true,
        currentSprint: 'sprint-1',
      };
      expect(getAutoFilterSprint(config)).toBe('sprint-1');
    });

    it('should return null when autoFilterCurrentSprint is false', () => {
      const config: ConfigData = {
        ...DEFAULT_CONFIG,
        autoFilterCurrentSprint: false,
        currentSprint: 'sprint-1',
      };
      expect(getAutoFilterSprint(config)).toBe(null);
    });

    it('should return null when currentSprint is undefined', () => {
      const config: ConfigData = {
        ...DEFAULT_CONFIG,
        autoFilterCurrentSprint: true,
        currentSprint: undefined,
      };
      expect(getAutoFilterSprint(config)).toBe(null);
    });

    it('should return null when both conditions are false', () => {
      const config: ConfigData = {
        ...DEFAULT_CONFIG,
        autoFilterCurrentSprint: false,
        currentSprint: undefined,
      };
      expect(getAutoFilterSprint(config)).toBe(null);
    });

    it('should use default (true) from DEFAULT_CONFIG', () => {
      // DEFAULT_CONFIG has autoFilterCurrentSprint: true
      const config: ConfigData = {
        ...DEFAULT_CONFIG,
        currentSprint: 'sprint-2',
      };
      expect(getAutoFilterSprint(config)).toBe('sprint-2');
    });
  });
});
