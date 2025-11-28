/**
 * Template utility functions for story creation
 * Handles variable substitution and bundled template library
 */

/**
 * Variables available for template substitution
 */
export interface TemplateVariables {
  date: string;       // {{DATE}} - Today's date (YYYY-MM-DD)
  title: string;      // {{TITLE}} - Story title
  id: string;         // {{ID}} - Story ID
  project?: string;   // {{PROJECT}} - Project name from config
  author?: string;    // {{AUTHOR}} - Author from git/settings
}

/**
 * Substitute template variables in template string
 * Variables are case-sensitive: {{DATE}} works, {{date}} does not
 */
export function substituteTemplateVariables(
  template: string,
  variables: TemplateVariables
): string {
  let result = template;

  // Required variables
  result = result.replace(/\{\{DATE\}\}/g, variables.date);
  result = result.replace(/\{\{TITLE\}\}/g, variables.title);
  result = result.replace(/\{\{ID\}\}/g, variables.id);

  // Optional variables - only replace if provided
  if (variables.project !== undefined) {
    result = result.replace(/\{\{PROJECT\}\}/g, variables.project);
  }
  if (variables.author !== undefined) {
    result = result.replace(/\{\{AUTHOR\}\}/g, variables.author);
  }

  return result;
}

/**
 * Bundled template library - pre-built templates for common patterns
 */
export const BUNDLED_TEMPLATES: Record<string, string> = {
  'api-endpoint': `## Endpoint
\`[METHOD] /api/v1/[resource]\`

## Request
- Headers:
- Body:

## Response
- Success (200):
- Error cases:

## Implementation Checklist
- [ ] Route definition
- [ ] Controller logic
- [ ] Input validation
- [ ] Error handling
- [ ] Unit tests
- [ ] Integration tests
- [ ] API documentation
`,

  'react-component': `## Component
\`<{{TITLE}} />\`

## Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| | | | |

## Behavior
- [ ]

## Implementation Checklist
- [ ] Component file
- [ ] TypeScript types
- [ ] Unit tests
- [ ] Storybook story
- [ ] Accessibility (a11y)
`,

  'db-migration': `## Migration
Migration for {{TITLE}}

## Changes
- [ ]

## Up Migration
\`\`\`sql
-- Add migration SQL here
\`\`\`

## Down Migration (Rollback)
\`\`\`sql
-- Add rollback SQL here
\`\`\`

## Verification Steps
- [ ] Run migration on dev
- [ ] Verify data integrity
- [ ] Test rollback
- [ ] Document any manual steps
`,

  'bug-investigation': `## Bug Report
{{TITLE}}

## Steps to Reproduce
1.
2.
3.

## Expected Behavior

## Actual Behavior

## Root Cause Analysis
- [ ] Identified root cause
- [ ] Impact assessment

## Fix Verification
- [ ] Bug no longer reproduces
- [ ] No regression in related functionality
- [ ] Added test to prevent recurrence
`,
};

/**
 * Resolve a template reference like "@library/api-endpoint" to actual content
 * Returns null if not a library reference or template not found
 */
export function resolveTemplateReference(reference: string): string | null {
  const libraryPrefix = '@library/';
  if (!reference.startsWith(libraryPrefix)) {
    return null;
  }

  const templateName = reference.slice(libraryPrefix.length);
  if (!templateName) {
    return null;
  }

  return BUNDLED_TEMPLATES[templateName] ?? null;
}
