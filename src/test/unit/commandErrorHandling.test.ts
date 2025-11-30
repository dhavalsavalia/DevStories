import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockLogger = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
};

// Mock vscode first (before imports)
vi.mock('vscode', () => ({
	window: {
		showErrorMessage: vi.fn(),
	},
}));

// Mock logger with shared mock object
vi.mock('../../core/logger', () => ({
	getLogger: () => mockLogger,
}));

import * as vscode from 'vscode';
import { wrapCommand, CommandError, isUserError } from '../../commands/errorHandler';

describe('wrapCommand', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('successful execution', () => {
		it('should execute async function successfully', async () => {
			const handler = vi.fn().mockResolvedValue('success');
			const wrapped = wrapCommand('testCommand', handler);

			const result = await wrapped();

			expect(result).toBe('success');
			expect(handler).toHaveBeenCalled();
			expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
			expect(mockLogger.error).not.toHaveBeenCalled();
		});

		it('should pass arguments to handler', async () => {
			const handler = vi.fn().mockResolvedValue(undefined);
			const wrapped = wrapCommand('testCommand', handler);

			await wrapped('arg1', 42, { key: 'value' });

			expect(handler).toHaveBeenCalledWith('arg1', 42, { key: 'value' });
		});

		it('should return undefined for void handlers', async () => {
			const handler = vi.fn().mockResolvedValue(undefined);
			const wrapped = wrapCommand('testCommand', handler);

			const result = await wrapped();

			expect(result).toBeUndefined();
		});
	});

	describe('error handling', () => {
		it('should catch and handle errors gracefully', async () => {
			const error = new Error('Something went wrong');
			const handler = vi.fn().mockRejectedValue(error);
			const wrapped = wrapCommand('testCommand', handler);

			const result = await wrapped();

			expect(result).toBeUndefined();
			expect(vscode.window.showErrorMessage).toHaveBeenCalled();
			expect(mockLogger.error).toHaveBeenCalled();
		});

		it('should show user-friendly error message', async () => {
			const error = new Error('Technical error details');
			const handler = vi.fn().mockRejectedValue(error);
			const wrapped = wrapCommand('testCommand', handler);

			await wrapped();

			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
				expect.stringContaining('DevStories')
			);
		});

		it('should log full error stack', async () => {
			const error = new Error('Detailed error');
			error.stack = 'Error: Detailed error\n    at testFunction';
			const handler = vi.fn().mockRejectedValue(error);
			const wrapped = wrapCommand('testCommand', handler);

			await wrapped();

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining('testCommand'),
				expect.objectContaining({ stack: expect.any(String) })
			);
		});

		it('should include command name in error log', async () => {
			const error = new Error('Error');
			const handler = vi.fn().mockRejectedValue(error);
			const wrapped = wrapCommand('mySpecificCommand', handler);

			await wrapped();

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining('mySpecificCommand'),
				expect.anything()
			);
		});

		it('should handle non-Error thrown values', async () => {
			const handler = vi.fn().mockRejectedValue('string error');
			const wrapped = wrapCommand('testCommand', handler);

			const result = await wrapped();

			expect(result).toBeUndefined();
			expect(vscode.window.showErrorMessage).toHaveBeenCalled();
		});
	});

	describe('CommandError', () => {
		it('should use custom message for user-friendly display', async () => {
			const error = new CommandError('User-friendly message', 'Technical details');
			const handler = vi.fn().mockRejectedValue(error);
			const wrapped = wrapCommand('testCommand', handler);

			await wrapped();

			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
				expect.stringContaining('User-friendly message')
			);
		});

		it('should preserve user-friendly flag', () => {
			const error = new CommandError('Message', 'Technical');
			expect(error.isUserFriendly).toBe(true);
		});
	});
});

describe('isUserError', () => {
	it('should return true for CommandError', () => {
		const error = new CommandError('message', 'technical');
		expect(isUserError(error)).toBe(true);
	});

	it('should return false for regular Error', () => {
		const error = new Error('regular error');
		expect(isUserError(error)).toBe(false);
	});
});
