/**
 * Message utility for i18n support in @goobits/contactform
 * Provides a flexible way to handle messages from any i18n library
 */

import { defaultMessages } from '../config/defaultMessages';

// Use console for logging within the package
const logger = console;

// Type definitions for message handling
export interface MessageFunction {
	(...args: any[]): string;
}

export interface MessageObject {
	[key: string]: string | MessageFunction | MessageObject;
}

export interface MessageGetter {
	(key: string, fallback?: string, ...args: any[]): string;
}

/**
 * Creates a message getter function that handles both string and function messages
 *
 * @param messages - Object containing message strings or functions
 * @returns A function that retrieves messages with fallback support
 * @throws TypeError If messages is not an object
 */
export function createMessageGetter(messages: MessageObject = {}): MessageGetter {
	if (messages !== null && typeof messages === 'object') {
		return (key: string, fallback?: string, ...args: any[]): string => {
			// Validate key to prevent prototype pollution
			if (typeof key !== 'string' || key === '__proto__' || key === 'constructor') {
				logger.warn('[ContactFormMessages] Invalid message key:', key);
				return fallback || 'INVALID_KEY';
			}

			// First check user messages
			if (messages[key]) {
				const msg = messages[key];
				if (typeof msg === 'function') {
					try {
						return msg(...args);
					} catch {
						// Log minimal error info to avoid leaking sensitive data
						logger.warn(`[ContactFormMessages] Error calling message function for key: ${key}`);
						return fallback || key;
					}
				}
				return msg as string;
			}

			// Then check default messages
			if (defaultMessages[key]) {
				const defaultMsg = defaultMessages[key];
				if (typeof defaultMsg === 'function') {
					try {
						return defaultMsg(...args);
					} catch {
						// Log minimal error info to avoid leaking sensitive data
						logger.warn(
							`[ContactFormMessages] Error calling default message function for key: ${key}`
						);
						return fallback || key;
					}
				}
				// For nested objects like validation messages
				if (typeof defaultMsg === 'object' && !Array.isArray(defaultMsg)) {
					const nestedKey = args[0];
					// Validate nested key to prevent prototype pollution
					if (
						typeof nestedKey === 'string' &&
						nestedKey !== '__proto__' &&
						nestedKey !== 'constructor' &&
						(defaultMsg as MessageObject)[nestedKey]
					) {
						return (defaultMsg as MessageObject)[nestedKey] as string;
					}
				}
				return defaultMsg as string;
			}

			// Finally use fallback or key
			return fallback || key;
		};
	}

	throw new TypeError('Messages must be an object');
}

/**
 * Merges user-provided messages with default messages
 *
 * @param userMessages - User-provided messages to override defaults
 * @returns Complete messages object with defaults and user overrides
 * @throws TypeError If userMessages is not an object
 */
export function getMergedMessages(userMessages: MessageObject = {}): MessageObject {
	if (userMessages !== null && typeof userMessages === 'object') {
		return {
			...defaultMessages,
			...userMessages
		};
	}

	throw new TypeError('User messages must be an object');
}
