/**
 * Pure utility functions for StoriesProvider - no VS Code dependencies
 * These can be unit tested with Vitest
 */

import { Epic } from '../types/epic';
import { Story } from '../types/story';
import { getSprintIndex } from '../core/configServiceUtils';

/**
 * Sort stories for tree view display.
 * Order: sprint sequence → priority (lower first) → created date (earlier first)
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

    // 3. Sort by created date (earlier first)
    return a.created.getTime() - b.created.getTime();
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
