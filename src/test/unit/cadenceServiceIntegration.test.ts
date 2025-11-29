/**
 * Unit tests for CadenceService integration with status bar
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CadenceConfig,
  getNextRitual,
  formatRitualText,
  shouldShowReminder,
} from '../../core/cadenceServiceUtils';

describe('CadenceService Status Bar Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 10, 29, 10, 0, 0)); // Saturday 10 AM
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getNextRitual + formatRitualText', () => {
    it('should format next ritual for status bar display', () => {
      const config: CadenceConfig = {
        enabled: true,
        reminders: {
          planning: { day: 'monday', time: '09:00' },
        },
        activeHours: { start: 9, end: 18 },
      };

      const nextRitual = getNextRitual(config);
      expect(nextRitual).not.toBeNull();

      const text = formatRitualText(nextRitual!.type, nextRitual!.nextDate);
      expect(text).toContain('Planning');
      expect(text).toContain('Mon');
    });

    it('should show "Tomorrow" for rituals on the next day', () => {
      // Saturday 10 AM, ritual on Sunday
      const config: CadenceConfig = {
        enabled: true,
        reminders: {
          retro: { day: 'sunday', time: '14:00' },
        },
        activeHours: { start: 9, end: 18 },
      };

      const nextRitual = getNextRitual(config);
      const text = formatRitualText(nextRitual!.type, nextRitual!.nextDate);
      expect(text).toContain('Tomorrow');
    });
  });

  describe('shouldShowReminder with active hours', () => {
    it('should respect active hours for showing reminders', () => {
      const config: CadenceConfig = {
        enabled: true,
        reminders: {
          planning: { day: 'monday', time: '09:00' },
        },
        activeHours: { start: 9, end: 18 },
      };

      // 10 AM - within active hours
      expect(shouldShowReminder(config)).toBe(true);

      // 7 AM - before active hours
      vi.setSystemTime(new Date(2025, 10, 29, 7, 0, 0));
      expect(shouldShowReminder(config)).toBe(false);

      // 6 PM - at end of active hours (exclusive)
      vi.setSystemTime(new Date(2025, 10, 29, 18, 0, 0));
      expect(shouldShowReminder(config)).toBe(false);
    });
  });
});
