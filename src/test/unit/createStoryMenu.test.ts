import { describe, it, expect } from 'vitest';
import {
	CREATE_STORY_MENU_OPTIONS,
	QUICK_CAPTURE_OPTION,
	FULL_STORY_OPTION
} from '../../commands/createStoryMenuUtils';

describe('createStoryMenu', () => {
	describe('CREATE_STORY_MENU_OPTIONS', () => {
		it('should have exactly two options', () => {
			expect(CREATE_STORY_MENU_OPTIONS).toHaveLength(2);
		});

		it('should have Quick Capture as first option', () => {
			expect(CREATE_STORY_MENU_OPTIONS[0]).toBe(QUICK_CAPTURE_OPTION);
		});

		it('should have Full Story as second option', () => {
			expect(CREATE_STORY_MENU_OPTIONS[1]).toBe(FULL_STORY_OPTION);
		});
	});

	describe('QUICK_CAPTURE_OPTION', () => {
		it('should have correct label', () => {
			expect(QUICK_CAPTURE_OPTION.label).toBe('$(zap) Quick Capture');
		});

		it('should have correct description', () => {
			expect(QUICK_CAPTURE_OPTION.description).toBe('Fast story creation with minimal input');
		});

		it('should have correct command', () => {
			expect(QUICK_CAPTURE_OPTION.command).toBe('devstories.quickCapture');
		});
	});

	describe('FULL_STORY_OPTION', () => {
		it('should have correct label', () => {
			expect(FULL_STORY_OPTION.label).toBe('$(file-add) Full Story');
		});

		it('should have correct description', () => {
			expect(FULL_STORY_OPTION.description).toBe('Create story with template and all fields');
		});

		it('should have correct command', () => {
			expect(FULL_STORY_OPTION.command).toBe('devstories.createStory');
		});
	});
});
