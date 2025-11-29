/**
 * Pure utility functions for CadenceService - cadence reminders and ritual scheduling
 * No VS Code dependencies - can be unit tested with Vitest
 */

export type RitualType = 'planning' | 'retro' | 'grooming';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const DAY_MAP: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RITUAL_LABELS: Record<RitualType, string> = {
  planning: 'Planning',
  retro: 'Retro',
  grooming: 'Grooming',
};

export interface RitualReminder {
  day: DayOfWeek;
  time: string; // HH:mm format
}

export interface ActiveHours {
  start: number; // 0-23
  end: number;   // 0-23
}

export interface CadenceConfig {
  enabled: boolean;
  reminders: Partial<Record<RitualType, RitualReminder>>;
  activeHours: ActiveHours;
}

export interface NextRitual {
  type: RitualType;
  nextDate: Date;
}

export const DEFAULT_CADENCE_CONFIG: CadenceConfig = {
  enabled: false,
  reminders: {},
  activeHours: { start: 9, end: 18 },
};

/**
 * Parse cadence config from raw YAML-parsed object
 */
export function parseCadenceConfig(raw: Record<string, unknown>): CadenceConfig {
  const cadence = raw.cadence as Record<string, unknown> | undefined;

  if (!cadence || !cadence.enabled) {
    return { ...DEFAULT_CADENCE_CONFIG, enabled: false };
  }

  const reminders: Partial<Record<RitualType, RitualReminder>> = {};
  const rawReminders = cadence.reminders as Record<string, { day?: string; time?: string }> | undefined;

  if (rawReminders) {
    for (const type of ['planning', 'retro', 'grooming'] as RitualType[]) {
      const r = rawReminders[type];
      if (r && r.day && r.time) {
        reminders[type] = {
          day: r.day.toLowerCase() as DayOfWeek,
          time: r.time,
        };
      }
    }
  }

  const rawActiveHours = cadence.activeHours as { start?: number; end?: number } | undefined;
  const activeHours: ActiveHours = {
    start: rawActiveHours?.start ?? DEFAULT_CADENCE_CONFIG.activeHours.start,
    end: rawActiveHours?.end ?? DEFAULT_CADENCE_CONFIG.activeHours.end,
  };

  return {
    enabled: true,
    reminders,
    activeHours,
  };
}

/**
 * Calculate the next occurrence of a ritual reminder from now
 */
export function calculateNextOccurrence(reminder: RitualReminder, now: Date = new Date()): Date {
  const targetDay = DAY_MAP[reminder.day];
  const [hours, minutes] = reminder.time.split(':').map(Number);

  const currentDay = now.getDay();
  let daysUntil = targetDay - currentDay;

  if (daysUntil < 0) {
    daysUntil += 7;
  }

  const next = new Date(now);
  next.setDate(now.getDate() + daysUntil);
  next.setHours(hours, minutes, 0, 0);

  // If it's the same day but time has passed, add a week
  if (daysUntil === 0 && next <= now) {
    next.setDate(next.getDate() + 7);
  }

  return next;
}

/**
 * Get the next upcoming ritual based on config
 */
export function getNextRitual(config: CadenceConfig): NextRitual | null {
  if (!config.enabled) {
    return null;
  }

  const types = Object.keys(config.reminders) as RitualType[];
  if (types.length === 0) {
    return null;
  }

  const now = new Date();
  let nearest: NextRitual | null = null;

  for (const type of types) {
    const reminder = config.reminders[type];
    if (!reminder) continue;

    const nextDate = calculateNextOccurrence(reminder, now);

    if (!nearest || nextDate < nearest.nextDate) {
      nearest = { type, nextDate };
    }
  }

  return nearest;
}

/**
 * Check if current time is within active hours
 */
export function isWithinActiveHours(activeHours: ActiveHours, now: Date = new Date()): boolean {
  const hour = now.getHours();
  return hour >= activeHours.start && hour < activeHours.end;
}

/**
 * Check if we should show a reminder right now
 */
export function shouldShowReminder(config: CadenceConfig): boolean {
  if (!config.enabled) {
    return false;
  }
  return isWithinActiveHours(config.activeHours);
}

/**
 * Format ritual text for status bar display
 */
export function formatRitualText(type: RitualType, nextDate: Date, now: Date = new Date()): string {
  const label = RITUAL_LABELS[type];

  // Check if it's tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const targetDay = new Date(nextDate);
  targetDay.setHours(0, 0, 0, 0);

  if (targetDay >= tomorrow && targetDay < dayAfterTomorrow) {
    return `${label}: Tomorrow`;
  }

  const dayName = DAY_NAMES[nextDate.getDay()];
  return `${label}: ${dayName}`;
}

/**
 * Get status bar text for the ritual display
 * Returns empty string if cadence is disabled or no rituals scheduled
 */
export function getRitualStatusBarText(config: CadenceConfig): string {
  if (!config.enabled) {
    return '';
  }

  const nextRitual = getNextRitual(config);
  if (!nextRitual) {
    return '';
  }

  return formatRitualText(nextRitual.type, nextRitual.nextDate);
}
