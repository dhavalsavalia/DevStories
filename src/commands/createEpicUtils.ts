/**
 * Pure utility functions for createEpic command - no VS Code dependencies
 * These can be unit tested with Vitest
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const matter = require('gray-matter');

export interface DevStoriesConfig {
  epicPrefix: string;
  storyPrefix: string;
  currentSprint?: string;
  statuses: string[];
}

export interface EpicData {
  id: string;
  title: string;
  sprint: string;
  goal?: string;
}

/**
 * Parse config.yaml content and extract relevant fields
 */
export function parseConfigYaml(content: string): DevStoriesConfig {
  // gray-matter's engines.yaml can parse plain YAML
  const parsed = matter.engines.yaml.parse(content);

  return {
    epicPrefix: parsed?.id_prefix?.epic ?? 'EPIC',
    storyPrefix: parsed?.id_prefix?.story ?? 'STORY',
    currentSprint: parsed?.sprints?.current,
    statuses: parsed?.statuses?.map((s: { id: string }) => s.id) ?? ['todo', 'in_progress', 'review', 'done'],
  };
}

/**
 * Find the next sequential epic ID number
 * Returns the number only (e.g., 4), not the full ID
 */
export function findNextEpicId(existingIds: string[], prefix: string): number {
  const regex = new RegExp(`^${prefix}-(\\d+)$`);
  let maxNum = 0;

  for (const id of existingIds) {
    const match = id.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  return maxNum + 1;
}

/**
 * Generate epic markdown content from EpicData
 */
export function generateEpicMarkdown(data: EpicData): string {
  const today = new Date().toISOString().split('T')[0];
  const escapedTitle = data.title.replace(/"/g, '\\"');
  const description = data.goal ?? '[Add epic description here]';

  return `---
id: ${data.id}
title: "${escapedTitle}"
status: todo
sprint: ${data.sprint}
created: ${today}
---

# ${data.title}

## Description
${description}

## Acceptance Criteria
- [ ]

## Stories
<!-- Stories will be auto-linked here when created -->

## Notes

`;
}
