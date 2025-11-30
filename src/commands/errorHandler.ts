import * as vscode from 'vscode';
import { getLogger } from '../core/logger';

/**
 * Custom error class for user-friendly error messages.
 * When thrown, the userMessage is shown to the user while technicalMessage is logged.
 */
export class CommandError extends Error {
	public readonly isUserFriendly = true;
	public readonly technicalMessage: string;

	constructor(userMessage: string, technicalMessage: string) {
		super(userMessage);
		this.technicalMessage = technicalMessage;
		this.name = 'CommandError';
	}
}

/**
 * Type guard to check if an error is a CommandError
 */
export function isUserError(error: unknown): error is CommandError {
	return error instanceof CommandError && error.isUserFriendly === true;
}

/**
 * Wraps a command handler with try-catch for graceful error handling.
 * Shows user-friendly messages and logs full error details.
 */
export function wrapCommand<T extends unknown[], R>(
	commandName: string,
	handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R | undefined> {
	return async (...args: T): Promise<R | undefined> => {
		try {
			return await handler(...args);
		} catch (error: unknown) {
			const logger = getLogger();

			// Extract error message
			let userMessage: string;
			let technicalDetails: string;

			if (isUserError(error)) {
				userMessage = error.message;
				technicalDetails = error.technicalMessage;
			} else if (error instanceof Error) {
				userMessage = error.message;
				technicalDetails = error.stack || error.message;
			} else {
				userMessage = String(error);
				technicalDetails = String(error);
			}

			// Log full error for debugging
			logger.error(`Command ${commandName} failed: ${userMessage}`, {
				stack: technicalDetails,
				command: commandName,
			});

			// Show user-friendly message
			void vscode.window.showErrorMessage(`DevStories: ${userMessage}`);

			return undefined;
		}
	};
}
