/**
 * Pure utility functions for StoriesProvider - no VS Code dependencies
 * These can be unit tested with Vitest
 */

import { Epic } from '../types/epic';
import { Story } from '../types/story';
import { getSprintIndex, StatusDef } from '../core/configServiceUtils';

/**
 * Get the tree view title based on sprint filter.
 * @param sprintFilter - Sprint name, 'backlog', or null for all sprints
 * @returns Title string like "Stories" or "Stories (sprint-name)"
 */
export function getTreeViewTitle(sprintFilter: string | null): string {
  if (sprintFilter === null) {
    return 'Stories';
  }
  if (sprintFilter === 'backlog') {
    return 'Stories (Backlog)';
  }
  return `Stories (${sprintFilter})`;
}

/**
 * Sort stories for tree view display.
 * Order: sprint sequence → priority (lower first) → title (alphabetical, case-insensitive)
 */
export function sortStoriesForTreeView(stories: Story[], sprintSequence: string[]): Story[] {
  return [...stories].sort((a, b) => {
    // 1. Sort by sprint sequence
    const sprintA = getSprintIndex(a.sprint, sprintSequence);
    const sprintB = getSprintIndex(b.sprint, sprintSequence);
    if (sprintA !== sprintB) {
      return sprintA - sprintB;
    }

    // 2. Sort by priority (lower = higher priority)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    // 3. Sort alphabetically by title (case-insensitive)
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  });
}

/**
 * Get the earliest sprint index from a list of stories.
 * Returns Infinity if no stories or all sprints are unknown.
 */
export function getEarliestStorySprintIndex(stories: Story[], sprintSequence: string[]): number {
  if (stories.length === 0) {
    return Infinity;
  }

  let earliest = Infinity;
  for (const story of stories) {
    const index = getSprintIndex(story.sprint, sprintSequence);
    if (index < earliest) {
      earliest = index;
    }
  }
  return earliest;
}

/**
 * Sort epics by the sprint of their earliest story (derived ordering).
 * Epics without stories or with unknown sprints sort to the end.
 * Falls back to epic created date for equal sprint indices.
 */
export function sortEpicsBySprintOrder(
  epics: Epic[],
  sprintSequence: string[],
  getStoriesByEpic: (epicId: string) => Story[]
): Epic[] {
  return [...epics].sort((a, b) => {
    // Get earliest sprint index for each epic
    const storiesA = getStoriesByEpic(a.id);
    const storiesB = getStoriesByEpic(b.id);

    const indexA = getEarliestStorySprintIndex(storiesA, sprintSequence);
    const indexB = getEarliestStorySprintIndex(storiesB, sprintSequence);

    if (indexA !== indexB) {
      return indexA - indexB;
    }

    // Fall back to epic created date
    return a.created.getTime() - b.created.getTime();
  });
}

/**
 * Progress indicator circles from empty to full.
 * Used to visually represent workflow progress based on status position.
 */
const PROGRESS_CIRCLES = ['○', '◔', '◐', '◕', '●'];

/**
 * Get a visual indicator for a status based on its position in the workflow.
 * Position 0 (first) = empty circle, position N-1 (last) = filled circle.
 * Middle positions show gradual fill based on progress.
 *
 * @param status - The status ID to get indicator for
 * @param statuses - The ordered array of configured statuses
 * @returns Unicode circle character representing progress
 */
export function getStatusIndicator(status: string, statuses: StatusDef[]): string {
  if (statuses.length === 0) {
    return '○';
  }

  const index = statuses.findIndex(s => s.id === status);
  if (index === -1) {
    return '○'; // Unknown status defaults to not started
  }

  if (statuses.length === 1) {
    return '●'; // Single status = complete
  }

  // Map position to 0-4 range for PROGRESS_CIRCLES
  const progressIndex = Math.round((index / (statuses.length - 1)) * 4);
  return PROGRESS_CIRCLES[progressIndex];
}
