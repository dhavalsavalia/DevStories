/**
 * Create Story Menu Utilities
 * Pure functions and constants for the unified story creation entry point.
 */

export interface CreateStoryMenuOption {
	label: string;
	description: string;
	command: string;
}

export const QUICK_CAPTURE_OPTION: CreateStoryMenuOption = {
	label: '$(zap) Quick Capture',
	description: 'Fast story creation with minimal input',
	command: 'devstories.quickCapture'
};

export const FULL_STORY_OPTION: CreateStoryMenuOption = {
	label: '$(file-add) Full Story',
	description: 'Create story with template and all fields',
	command: 'devstories.createStory'
};

export const CREATE_STORY_MENU_OPTIONS: CreateStoryMenuOption[] = [
	QUICK_CAPTURE_OPTION,
	FULL_STORY_OPTION
];
