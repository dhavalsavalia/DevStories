/**
 * Pure utility functions for saveAsTemplate command - no VS Code dependencies
 * These can be unit tested with Vitest
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const matter = require('gray-matter');

/**
 * Extract the markdown body (content after frontmatter) from a story file
 * Removes frontmatter and the title header
 */
export function extractTemplateContent(fileContent: string): string {
  const parsed = matter(fileContent);

  // Get the content after frontmatter
  let body = parsed.content.trim();

  // Remove the title header (first # line)
  const lines = body.split('\n');
  if (lines[0]?.match(/^#\s+.+/)) {
    lines.shift();
    body = lines.join('\n').trim();
  }

  return body;
}

/**
 * Generate a template file name from a user-provided name
 * Converts to kebab-case with .md extension
 */
export function generateTemplateFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '.md';
}
