/**
 * Auto-filter sprint utility (DS-153)
 *
 * Sets the sprint filter to currentSprint on extension load if:
 * 1. autoFilterCurrentSprint config is true (default: true)
 * 2. currentSprint is defined in config
 */

import { ConfigData } from './configServiceUtils';
import { SprintFilterService } from './sprintFilterService';

/**
 * Determine if auto-filter should be applied and return the sprint to filter to.
 * Returns null if no auto-filter should be applied.
 */
export function getAutoFilterSprint(config: ConfigData): string | null {
  // Check if auto-filter is enabled (defaults to true)
  if (!config.autoFilterCurrentSprint) {
    return null;
  }

  // Check if currentSprint is defined
  if (!config.currentSprint) {
    return null;
  }

  return config.currentSprint;
}

/**
 * Apply auto-filter on extension load
 * @param config - The loaded config
 * @param sprintFilterService - The sprint filter service to update
 */
export function applyAutoFilterSprint(
  config: ConfigData,
  sprintFilterService: SprintFilterService
): void {
  const sprintToFilter = getAutoFilterSprint(config);
  if (sprintToFilter) {
    sprintFilterService.setSprint(sprintToFilter);
  }
}
