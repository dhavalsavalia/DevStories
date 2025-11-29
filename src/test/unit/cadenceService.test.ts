/**
 * Unit tests for CadenceService - cadence reminders and ritual scheduling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CadenceConfig,
  RitualType,
  RitualReminder,
  DEFAULT_CADENCE_CONFIG,
  parseCadenceConfig,
  getNextRitual,
  shouldShowReminder,
  formatRitualText,
  calculateNextOccurrence,
  isWithinActiveHours,
  getRitualStatusBarText,
} from '../../core/cadenceServiceUtils';

describe('CadenceService Utils', () => {
  describe('parseCadenceConfig', () => {
    it('should return disabled config for empty input', () => {
      const result = parseCadenceConfig({});
      expect(result.enabled).toBe(false);
    });

    it('should parse enabled cadence config', () => {
      const input = {
        cadence: {
          enabled: true,
          reminders: {
            planning: { day: 'monday', time: '09:00' },
            retro: { day: 'friday', time: '16:00' },
            grooming: { day: 'wednesday', time: '14:00' },
          },
          activeHours: { start: 9, end: 18 },
        },
      };
      const result = parseCadenceConfig(input);
      expect(result.enabled).toBe(true);
      expect(result.reminders.planning?.day).toBe('monday');
      expect(result.reminders.planning?.time).toBe('09:00');
      expect(result.reminders.retro?.day).toBe('friday');
      expect(result.activeHours.start).toBe(9);
      expect(result.activeHours.end).toBe(18);
    });

    it('should use defaults for missing values', () => {
      const input = {
        cadence: {
          enabled: true,
        },
      };
      const result = parseCadenceConfig(input);
      expect(result.enabled).toBe(true);
      expect(result.activeHours).toEqual(DEFAULT_CADENCE_CONFIG.activeHours);
    });

    it('should handle partial reminder config', () => {
      const input = {
        cadence: {
          enabled: true,
          reminders: {
            planning: { day: 'tuesday', time: '10:00' },
          },
        },
      };
      const result = parseCadenceConfig(input);
      expect(result.reminders.planning?.day).toBe('tuesday');
      expect(result.reminders.retro).toBeUndefined();
      expect(result.reminders.grooming).toBeUndefined();
    });
  });

  describe('calculateNextOccurrence', () => {
    beforeEach(() => {
      // Mock Date to 2025-11-29 10:00 (Saturday)
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 10, 29, 10, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should calculate next monday from saturday', () => {
      const reminder: RitualReminder = { day: 'monday', time: '09:00' };
      const next = calculateNextOccurrence(reminder);
      expect(next.getDay()).toBe(1); // Monday
      expect(next.getHours()).toBe(9);
      expect(next.getMinutes()).toBe(0);
    });

    it('should calculate next friday from saturday', () => {
      const reminder: RitualReminder = { day: 'friday', time: '16:00' };
      const next = calculateNextOccurrence(reminder);
      expect(next.getDay()).toBe(5); // Friday
      expect(next.getHours()).toBe(16);
    });

    it('should handle same day if time has not passed', () => {
      // Current: Saturday 10:00, checking for Saturday 14:00
      vi.setSystemTime(new Date(2025, 10, 29, 10, 0, 0));
      const reminder: RitualReminder = { day: 'saturday', time: '14:00' };
      const next = calculateNextOccurrence(reminder);
      expect(next.getDate()).toBe(29); // Same day
      expect(next.getHours()).toBe(14);
    });

    it('should skip to next week if time has passed', () => {
      // Current: Saturday 10:00, checking for Saturday 08:00
      vi.setSystemTime(new Date(2025, 10, 29, 10, 0, 0));
      const reminder: RitualReminder = { day: 'saturday', time: '08:00' };
      const next = calculateNextOccurrence(reminder);
      expect(next.getDay()).toBe(6); // Saturday
      expect(next.getDate()).toBe(6); // Dec 6 (Nov 29 + 7)
      expect(next.getMonth()).toBe(11); // December
    });
  });

  describe('getNextRitual', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 10, 29, 10, 0, 0)); // Saturday
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return null for disabled config', () => {
      const config: CadenceConfig = { ...DEFAULT_CADENCE_CONFIG, enabled: false };
      expect(getNextRitual(config)).toBeNull();
    });

    it('should return null for config with no reminders', () => {
      const config: CadenceConfig = {
        enabled: true,
        reminders: {},
        activeHours: { start: 9, end: 18 },
      };
      expect(getNextRitual(config)).toBeNull();
    });

    it('should return the nearest upcoming ritual', () => {
      const config: CadenceConfig = {
        enabled: true,
        reminders: {
          planning: { day: 'monday', time: '09:00' },   // Nov 1
          retro: { day: 'friday', time: '16:00' },      // Dec 5
          grooming: { day: 'wednesday', time: '14:00' },// Dec 3
        },
        activeHours: { start: 9, end: 18 },
      };
      const next = getNextRitual(config);
      expect(next).not.toBeNull();
      expect(next!.type).toBe('planning'); // Monday is closest
    });
  });

  describe('shouldShowReminder', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return false outside active hours', () => {
      vi.setSystemTime(new Date(2025, 10, 29, 7, 0, 0)); // 7 AM
      const config: CadenceConfig = {
        enabled: true,
        reminders: { planning: { day: 'saturday', time: '09:00' } },
        activeHours: { start: 9, end: 18 },
      };
      expect(shouldShowReminder(config)).toBe(false);
    });

    it('should return true within active hours', () => {
      vi.setSystemTime(new Date(2025, 10, 29, 10, 0, 0)); // 10 AM
      const config: CadenceConfig = {
        enabled: true,
        reminders: { planning: { day: 'saturday', time: '09:00' } },
        activeHours: { start: 9, end: 18 },
      };
      expect(shouldShowReminder(config)).toBe(true);
    });

    it('should return false for disabled config', () => {
      vi.setSystemTime(new Date(2025, 10, 29, 10, 0, 0));
      const config: CadenceConfig = {
        enabled: false,
        reminders: { planning: { day: 'saturday', time: '09:00' } },
        activeHours: { start: 9, end: 18 },
      };
      expect(shouldShowReminder(config)).toBe(false);
    });
  });

  describe('isWithinActiveHours', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true at start of active hours', () => {
      vi.setSystemTime(new Date(2025, 10, 29, 9, 0, 0));
      expect(isWithinActiveHours({ start: 9, end: 18 })).toBe(true);
    });

    it('should return false at end of active hours', () => {
      vi.setSystemTime(new Date(2025, 10, 29, 18, 0, 0));
      expect(isWithinActiveHours({ start: 9, end: 18 })).toBe(false);
    });

    it('should return false before active hours', () => {
      vi.setSystemTime(new Date(2025, 10, 29, 8, 59, 0));
      expect(isWithinActiveHours({ start: 9, end: 18 })).toBe(false);
    });

    it('should return true within active hours', () => {
      vi.setSystemTime(new Date(2025, 10, 29, 12, 0, 0));
      expect(isWithinActiveHours({ start: 9, end: 18 })).toBe(true);
    });
  });

  describe('formatRitualText', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 10, 29, 10, 0, 0)); // Saturday
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format planning ritual', () => {
      const text = formatRitualText('planning', new Date(2025, 10, 30, 9, 0, 0));
      expect(text).toContain('Planning');
    });

    it('should format retro ritual', () => {
      const text = formatRitualText('retro', new Date(2025, 11, 5, 16, 0, 0));
      expect(text).toContain('Retro');
    });

    it('should format grooming ritual', () => {
      const text = formatRitualText('grooming', new Date(2025, 11, 3, 14, 0, 0));
      expect(text).toContain('Grooming');
    });

    it('should show "Tomorrow" for next day rituals', () => {
      // Saturday 10:00, ritual is Sunday 09:00
      const text = formatRitualText('planning', new Date(2025, 10, 30, 9, 0, 0));
      expect(text).toContain('Tomorrow');
    });

    it('should show day name for later rituals', () => {
      // Saturday 10:00, ritual is Monday 09:00
      const text = formatRitualText('planning', new Date(2025, 11, 1, 9, 0, 0));
      expect(text).toContain('Mon');
    });
  });

  describe('getRitualStatusBarText', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 10, 29, 10, 0, 0)); // Saturday
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return empty string for disabled config', () => {
      const config: CadenceConfig = { ...DEFAULT_CADENCE_CONFIG, enabled: false };
      expect(getRitualStatusBarText(config)).toBe('');
    });

    it('should return empty string for no reminders', () => {
      const config: CadenceConfig = {
        enabled: true,
        reminders: {},
        activeHours: { start: 9, end: 18 },
      };
      expect(getRitualStatusBarText(config)).toBe('');
    });

    it('should return formatted text for next ritual', () => {
      const config: CadenceConfig = {
        enabled: true,
        reminders: {
          planning: { day: 'monday', time: '09:00' },
        },
        activeHours: { start: 9, end: 18 },
      };
      const text = getRitualStatusBarText(config);
      expect(text).toContain('Planning');
      expect(text).toContain('Mon');
    });
  });

  describe('Reminder throttling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 10, 29, 10, 0, 0)); // Saturday
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shouldShowReminder returns true within active hours', () => {
      const config: CadenceConfig = {
        enabled: true,
        reminders: { planning: { day: 'monday', time: '09:00' } },
        activeHours: { start: 9, end: 18 },
      };
      expect(shouldShowReminder(config)).toBe(true);
    });

    it('shouldShowReminder returns false outside active hours', () => {
      vi.setSystemTime(new Date(2025, 10, 29, 20, 0, 0)); // 8 PM
      const config: CadenceConfig = {
        enabled: true,
        reminders: { planning: { day: 'monday', time: '09:00' } },
        activeHours: { start: 9, end: 18 },
      };
      expect(shouldShowReminder(config)).toBe(false);
    });

    it('shouldShowReminder returns false when disabled', () => {
      const config: CadenceConfig = {
        enabled: false,
        reminders: { planning: { day: 'monday', time: '09:00' } },
        activeHours: { start: 9, end: 18 },
      };
      expect(shouldShowReminder(config)).toBe(false);
    });
  });
});
