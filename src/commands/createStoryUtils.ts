/**
 * Pure utility functions for createStory command - no VS Code dependencies
 * These can be unit tested with Vitest
 */

import { StoryType, StorySize } from '../types/story';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const matter = require('gray-matter');

export interface DevStoriesConfig {
  epicPrefix: string;
  storyPrefix: string;
  currentSprint?: string;
  statuses: string[];
  sizes: StorySize[];
  templates: Record<StoryType, string>;
}

export interface StoryData {
  id: string;
  title: string;
  type: StoryType;
  epic: string;
  sprint: string;
  size: StorySize;
  dependencies?: string[];
}

/**
 * Default templates for each story type
 */
export const DEFAULT_TEMPLATES: Record<StoryType, string> = {
  feature: `## User Story
As a [user], I need [feature] so that [benefit].

## Acceptance Criteria
- [ ]

## Technical Notes

## Files to Modify
`,
  bug: `## Bug Description

## Steps to Reproduce
1.

## Expected vs Actual

## Root Cause
`,
  task: `## Task Description

## Checklist
- [ ]
`,
  chore: `## Description

## Checklist
- [ ]
`,
};

/**
 * Parse config.yaml content and extract relevant fields for story creation
 */
export function parseConfigYaml(content: string): DevStoriesConfig {
  const parsed = matter.engines.yaml.parse(content);

  return {
    epicPrefix: parsed?.id_prefix?.epic ?? 'EPIC',
    storyPrefix: parsed?.id_prefix?.story ?? 'STORY',
    currentSprint: parsed?.sprints?.current,
    statuses: parsed?.statuses?.map((s: { id: string }) => s.id) ?? ['todo', 'in_progress', 'review', 'done'],
    sizes: parsed?.sizes ?? ['XS', 'S', 'M', 'L', 'XL'],
    templates: {
      feature: parsed?.templates?.feature ?? DEFAULT_TEMPLATES.feature,
      bug: parsed?.templates?.bug ?? DEFAULT_TEMPLATES.bug,
      task: parsed?.templates?.task ?? DEFAULT_TEMPLATES.task,
      chore: parsed?.templates?.chore ?? DEFAULT_TEMPLATES.chore,
    },
  };
}

/**
 * Find the next sequential story ID number
 * Returns the number only (e.g., 15), not the full ID
 */
export function findNextStoryId(existingIds: string[], prefix: string): number {
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
 * Get suggested size based on story type
 * Bugs tend to be smaller, features tend to be larger
 */
export function getSuggestedSize(type: StoryType): StorySize {
  switch (type) {
    case 'bug':
      return 'S';
    case 'feature':
      return 'M';
    case 'task':
      return 'M';
    case 'chore':
      return 'S';
    default:
      return 'M';
  }
}

/**
 * Simple word overlap for duplicate detection
 * Returns similarity score 0-1
 */
export function calculateTitleSimilarity(title1: string, title2: string): number {
  const words1 = new Set(title1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(title2.toLowerCase().split(/\s+/).filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const word of words1) {
    if (words2.has(word)) {
      overlap++;
    }
  }

  // Jaccard similarity
  const union = new Set([...words1, ...words2]);
  return overlap / union.size;
}

/**
 * Generate story markdown content from StoryData
 */
export function generateStoryMarkdown(data: StoryData, template: string): string {
  const today = new Date().toISOString().split('T')[0];
  const escapedTitle = data.title.replace(/"/g, '\\"');
  const deps = data.dependencies && data.dependencies.length > 0
    ? `\n  - ${data.dependencies.join('\n  - ')}`
    : '';

  return `---
id: ${data.id}
title: "${escapedTitle}"
type: ${data.type}
epic: ${data.epic}
status: todo
sprint: ${data.sprint}
size: ${data.size}
assignee: ""
dependencies:${deps}
created: ${today}
updated: ${today}
---

# ${data.title}

${template}`;
}

/**
 * Generate the story link line to append to epic's Stories section
 */
export function generateStoryLink(storyId: string, storyTitle: string): string {
  return `- [[${storyId}]] ${storyTitle}`;
}

/**
 * Append story link to epic markdown content
 * Finds the "## Stories" section and appends the link
 */
export function appendStoryToEpic(epicContent: string, storyLink: string): string {
  // Find ## Stories section
  const storiesRegex = /^## Stories\s*$/m;
  const match = epicContent.match(storiesRegex);

  if (!match || match.index === undefined) {
    // No Stories section found, append at end
    return epicContent.trimEnd() + '\n\n## Stories\n' + storyLink + '\n';
  }

  // Find where to insert (after ## Stories and any existing content before next ##)
  const afterStoriesIdx = match.index + match[0].length;
  const restContent = epicContent.slice(afterStoriesIdx);

  // Find the next ## section
  const nextSectionMatch = restContent.match(/^## /m);
  const insertPoint = nextSectionMatch?.index !== undefined
    ? afterStoriesIdx + nextSectionMatch.index
    : epicContent.length;

  // Get content between ## Stories and next section
  const storiesContent = epicContent.slice(afterStoriesIdx, insertPoint).trimEnd();

  // Build new content
  const before = epicContent.slice(0, afterStoriesIdx);
  const after = epicContent.slice(insertPoint);

  // Append link after existing stories content
  const newStoriesContent = storiesContent
    ? storiesContent + '\n' + storyLink
    : '\n' + storyLink;

  return before + newStoriesContent + '\n\n' + after.trimStart();
}
