import { describe, it, expect } from 'vitest';
import {
  extractTemplateContent,
  generateTemplateFileName,
} from '../../commands/saveAsTemplateUtils';

describe('saveAsTemplate Utils', () => {
  describe('extractTemplateContent', () => {
    it('should extract content after frontmatter', () => {
      const fileContent = `---
id: STORY-001
title: "Test Story"
type: feature
---

# Test Story

## Description
Some content here

## Checklist
- [ ] Item 1
`;
      const result = extractTemplateContent(fileContent);

      expect(result).toContain('## Description');
      expect(result).toContain('Some content here');
      expect(result).toContain('## Checklist');
      expect(result).not.toContain('# Test Story');
      expect(result).not.toContain('id: STORY-001');
    });

    it('should remove title header', () => {
      const fileContent = `---
id: STORY-001
---

# My Story Title

## Content
Here is the content
`;
      const result = extractTemplateContent(fileContent);

      expect(result).not.toContain('# My Story Title');
      expect(result).toContain('## Content');
      expect(result).toContain('Here is the content');
    });

    it('should handle content with no frontmatter', () => {
      const fileContent = `# Title

## Content
Body text
`;
      const result = extractTemplateContent(fileContent);

      // Should still work, just extracting body
      expect(result).toContain('## Content');
      expect(result).toContain('Body text');
    });

    it('should return empty string for empty content', () => {
      const fileContent = `---
id: STORY-001
---

# Empty Story
`;
      const result = extractTemplateContent(fileContent);

      expect(result).toBe('');
    });
  });

  describe('generateTemplateFileName', () => {
    it('should convert name to kebab-case filename', () => {
      expect(generateTemplateFileName('API Endpoint')).toBe('api-endpoint.md');
    });

    it('should handle already lowercase names', () => {
      expect(generateTemplateFileName('bug-triage')).toBe('bug-triage.md');
    });

    it('should remove special characters', () => {
      expect(generateTemplateFileName('React Component!')).toBe('react-component.md');
    });

    it('should handle multiple spaces', () => {
      expect(generateTemplateFileName('My   Template   Name')).toBe('my-template-name.md');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(generateTemplateFileName('  Test  ')).toBe('test.md');
    });

    it('should handle numbers', () => {
      expect(generateTemplateFileName('API V2 Endpoint')).toBe('api-v2-endpoint.md');
    });
  });
});
