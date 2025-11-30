/**
 * Unit tests for input validation utilities
 * DS-063: Validate user input in command handlers
 */

import { describe, it, expect } from 'vitest';
import {
  validateStoryTitle,
  validateEpicName,
  validateSprintName,
  ValidationResult,
} from '../../utils/inputValidation';

describe('validateStoryTitle', () => {
  describe('valid titles', () => {
    it('should accept a normal title', () => {
      const result = validateStoryTitle('Add dark mode toggle');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept titles with UTF-8 characters', () => {
      const result = validateStoryTitle('修复登录问题');
      expect(result.valid).toBe(true);
    });

    it('should accept titles with emojis', () => {
      const result = validateStoryTitle('Fix login bug 🐛');
      expect(result.valid).toBe(true);
    });

    it('should accept titles with accented characters', () => {
      const result = validateStoryTitle('Améliorer la performance');
      expect(result.valid).toBe(true);
    });

    it('should accept titles at max length (200 chars)', () => {
      const title = 'a'.repeat(200);
      const result = validateStoryTitle(title);
      expect(result.valid).toBe(true);
    });

    it('should accept titles with common punctuation', () => {
      const result = validateStoryTitle("Fix user's profile - can't save (urgent)");
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid titles', () => {
    it('should reject empty string', () => {
      const result = validateStoryTitle('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject whitespace-only string', () => {
      const result = validateStoryTitle('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject titles over 200 characters', () => {
      const title = 'a'.repeat(201);
      const result = validateStoryTitle(title);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('200');
    });

    it('should reject titles with null character', () => {
      const result = validateStoryTitle('Fix bug\x00 in login');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('control character');
    });

    it('should reject titles with tab character', () => {
      const result = validateStoryTitle('Fix bug\tin login');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('control character');
    });

    it('should reject titles with newline', () => {
      const result = validateStoryTitle('Fix bug\nin login');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('control character');
    });

    it('should reject titles with carriage return', () => {
      const result = validateStoryTitle('Fix bug\rin login');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('control character');
    });

    it('should reject titles with other control characters', () => {
      const result = validateStoryTitle('Fix bug\x1B in login'); // ESC
      expect(result.valid).toBe(false);
      expect(result.error).toContain('control character');
    });
  });
});

describe('validateEpicName', () => {
  describe('valid names', () => {
    it('should accept a normal name', () => {
      const result = validateEpicName('User Authentication');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept names with UTF-8 characters', () => {
      const result = validateEpicName('ユーザー認証');
      expect(result.valid).toBe(true);
    });

    it('should accept names at max length (100 chars)', () => {
      const name = 'a'.repeat(100);
      const result = validateEpicName(name);
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid names', () => {
    it('should reject empty string', () => {
      const result = validateEpicName('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject names over 100 characters', () => {
      const name = 'a'.repeat(101);
      const result = validateEpicName(name);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('100');
    });

    it('should reject names with control characters', () => {
      const result = validateEpicName('Epic\x00Name');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('control character');
    });
  });
});

describe('validateSprintName', () => {
  describe('valid sprint names', () => {
    it('should accept simple sprint names', () => {
      const result = validateSprintName('sprint-1');
      expect(result.valid).toBe(true);
    });

    it('should accept backlog', () => {
      const result = validateSprintName('backlog');
      expect(result.valid).toBe(true);
    });

    it('should accept alphanumeric names', () => {
      const result = validateSprintName('sprint2025');
      expect(result.valid).toBe(true);
    });

    it('should accept names with hyphens', () => {
      const result = validateSprintName('2025-Q1-sprint');
      expect(result.valid).toBe(true);
    });

    it('should accept uppercase letters', () => {
      const result = validateSprintName('SPRINT-A');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid sprint names', () => {
    it('should reject empty string', () => {
      const result = validateSprintName('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject names with spaces', () => {
      const result = validateSprintName('sprint 1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('alphanumeric');
    });

    it('should reject names with underscores', () => {
      const result = validateSprintName('sprint_1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('alphanumeric');
    });

    it('should reject names with special characters', () => {
      const result = validateSprintName('sprint@1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('alphanumeric');
    });

    it('should reject names with dots', () => {
      const result = validateSprintName('sprint.1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('alphanumeric');
    });
  });
});

describe('ValidationResult', () => {
  it('valid result should have valid=true and no error', () => {
    const result: ValidationResult = { valid: true };
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('invalid result should have valid=false and error message', () => {
    const result: ValidationResult = { valid: false, error: 'Some error' };
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Some error');
  });
});
