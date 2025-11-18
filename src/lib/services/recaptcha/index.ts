/**
 * @fileoverview Pluggable reCAPTCHA service
 * Allows for custom implementations or disabling reCAPTCHA entirely
 * Supports Google reCAPTCHA v3 and no-op providers
 */

import { createLogger } from '../../utils/logger.ts';

const logger = createLogger('RecaptchaService');

/**
 * reCAPTCHA provider configuration interface
 */
export interface RecaptchaConfig {
	/** Whether reCAPTCHA is enabled */
	enabled?: boolean;
	/** Provider type */
	provider?: string;
	/** Site key for Google reCAPTCHA */
	siteKey?: string;
	/** Minimum score for v3 validation (0.0 to 1.0) */
	minScore?: number;
	/** Token cache timeout in milliseconds */
	cacheTimeout?: number;
}

/**
 * Cached token information interface
 */
export interface CachedToken {
	/** The reCAPTCHA token */
	token: string;
	/** Timestamp when the token was cached */
	timestamp: number;
}

/**
 * reCAPTCHA verification result interface
 */
export interface RecaptchaVerificationResult {
	/** Whether verification was successful */
	success: boolean;
	/** Confidence score (0.0 to 1.0) for v3 */
	score?: number;
	/** Action that was verified */
	action?: string;
	/** Error message if verification failed */
	error?: string;
}

/**
 * Base reCAPTCHA provider class that defines the interface for all providers
 * All reCAPTCHA implementations must extend this class
 *
 * @example
 * ```typescript
 * class CustomRecaptchaProvider extends RecaptchaProvider {
 *   async init(): Promise<boolean> {
 *     // Custom initialization logic
 *     return true;
 *   }
 *
 *   async getToken(action = 'submit'): Promise<string> {
 *     // Custom token generation
 *     return 'custom-token';
 *   }
 *
 *   async verify(token: string): Promise<boolean> {
 *     // Custom verification logic
 *     return true;
 *   }
 * }
 * ```
 */
export class RecaptchaProvider {
	/** Provider configuration */
	protected config: RecaptchaConfig;
	/** Token cache for performance optimization */
	protected tokenCache: Map<string, CachedToken>;
	/** Cache timeout in milliseconds */
	protected cacheTimeout: number;

	/**
	 * Creates a new reCAPTCHA provider instance
	 *
	 * @param {RecaptchaConfig} [config] - Provider configuration
	 */
	constructor(config: RecaptchaConfig = {}) {
		this.config = config;
		this.tokenCache = new Map();
		this.cacheTimeout = config.cacheTimeout || 110000; // 110 seconds (tokens valid for 120)
	}

	/**
	 * Initialize the provider - must be implemented by subclasses
	 *
	 * @returns {Promise<boolean>} Success status
	 * @throws {Error} When not implemented by subclass
	 *
	 * @example
	 * ```typescript
	 * const provider = new GoogleRecaptchaV3Provider(config);
	 * const initialized = await provider.init();
	 * if (initialized) {
	 *   console.log('reCAPTCHA provider ready');
	 * }
	 * ```
	 */
	async init(): Promise<boolean> {
		throw new Error('RecaptchaProvider.init() must be implemented');
	}

	/**
	 * Get a reCAPTCHA token - must be implemented by subclasses
	 *
	 * @param {string} [action='submit'] - The action name for v3
	 * @returns {Promise<string>} The reCAPTCHA token
	 * @throws {Error} When not implemented by subclass
	 *
	 * @example
	 * ```typescript
	 * const token = await provider.getToken('form_submit');
	 * console.log('Got token:', token.substring(0, 10) + '...');
	 * ```
	 */
	async getToken(_action: string = 'submit'): Promise<string> {
		throw new Error('RecaptchaProvider.getToken() must be implemented');
	}

	/**
	 * Verify a token server-side - must be implemented by subclasses
	 *
	 * @param {string} token - The token to verify
	 * @returns {Promise<boolean>} Verification status
	 * @throws {Error} When not implemented by subclass
	 *
	 * @example
	 * ```typescript
	 * const isValid = await provider.verify(token);
	 * if (isValid) {
	 *   console.log('Token verification passed');
	 * }
	 * ```
	 */
	async verify(_token: string): Promise<boolean> {
		throw new Error('RecaptchaProvider.verify() must be implemented');
	}

	/**
	 * Get cached token if available and not expired
	 *
	 * @param {string} action - The action name
	 * @returns {string | null} Cached token or null if not available/expired
	 *
	 * @example
	 * ```typescript
	 * const cachedToken = provider.getCachedToken('submit');
	 * if (cachedToken) {
	 *   console.log('Using cached token');
	 * } else {
	 *   console.log('Need to generate new token');
	 * }
	 * ```
	 */
	getCachedToken(action: string): string | null {
		const cacheKey = `token_${action}`;
		const cached = this.tokenCache.get(cacheKey);

		if (!cached) return null;

		// Check if expired
		if (Date.now() - cached.timestamp > this.cacheTimeout) {
			this.tokenCache.delete(cacheKey);
			return null;
		}

		return cached.token;
	}

	/**
	 * Cache a token with timestamp for expiry tracking
	 *
	 * @param {string} action - The action name
	 * @param {string} token - The token to cache
	 *
	 * @example
	 * ```typescript
	 * provider.cacheToken('submit', 'new-token-here');
	 * console.log('Token cached for future use');
	 * ```
	 */
	cacheToken(action: string, token: string): void {
		const cacheKey = `token_${action}`;
		this.tokenCache.set(cacheKey, {
			token,
			timestamp: Date.now()
		});

		// Auto-cleanup after timeout
		setTimeout(() => {
			this.tokenCache.delete(cacheKey);
		}, this.cacheTimeout);
	}

	/**
	 * Clear all cached tokens
	 *
	 * @example
	 * ```typescript
	 * provider.clearCache();
	 * console.log('All cached tokens cleared');
	 * ```
	 */
	clearCache(): void {
		this.tokenCache.clear();
	}
}

/**
 * Google reCAPTCHA v3 implementation with script loading and token management
 *
 * @example
 * ```typescript
 * const provider = new GoogleRecaptchaV3Provider({
 *   siteKey: 'your-site-key',
 *   minScore: 0.7
 * });
 *
 * await provider.init();
 * const token = await provider.getToken('form_submit');
 * const isValid = await provider.verify(token);
 * ```
 */
export class GoogleRecaptchaV3Provider extends RecaptchaProvider {
	/** Google reCAPTCHA site key */
	private siteKey: string;
	/** Script element ID for cleanup */
	private scriptId: string;
	/** Whether the provider is loaded and ready */
	private loaded: boolean;
	/** Loading promise to prevent multiple script loads */
	private loading: Promise<boolean> | null;

	/**
	 * Creates a new Google reCAPTCHA v3 provider
	 *
	 * @param {RecaptchaConfig} [config] - Provider configuration including siteKey
	 */
	constructor(config: RecaptchaConfig = {}) {
		super(config);
		this.siteKey = config.siteKey || '';
		this.scriptId = 'recaptcha-v3';
		this.loaded = false;
		this.loading = null;
	}

	/**
	 * Initialize the Google reCAPTCHA v3 provider by loading the script
	 *
	 * @returns {Promise<boolean>} True when successfully initialized
	 * @throws {Error} When script fails to load or siteKey is missing
	 *
	 * @example
	 * ```typescript
	 * try {
	 *   await provider.init();
	 *   console.log('Google reCAPTCHA v3 ready');
	 * } catch (error) {
	 *   console.error('Failed to initialize reCAPTCHA:', error);
	 * }
	 * ```
	 */
	async init(): Promise<boolean> {
		if (this.loaded) return true;
		if (this.loading) return this.loading;

		if (!this.siteKey) {
			throw new Error('Google reCAPTCHA site key is required');
		}

		this.loading = new Promise((resolve, reject) => {
			// Check if already loaded globally
			if (typeof window !== 'undefined' && (window as any).grecaptcha) {
				this.loaded = true;
				resolve(true);
				return;
			}

			// Load script
			const script = document.createElement('script');
			script.id = this.scriptId;
			script.src = `https://www.google.com/recaptcha/api.js?render=${this.siteKey}`;
			script.async = true;
			script.onload = () => {
				this.loaded = true;
				resolve(true);
			};
			script.onerror = () => {
				reject(new Error('Failed to load reCAPTCHA'));
			};

			document.head.appendChild(script);
		});

		return this.loading;
	}

	/**
	 * Get a reCAPTCHA token for the specified action
	 *
	 * @param {string} [action='submit'] - The action name for this token
	 * @returns {Promise<string>} The reCAPTCHA token
	 * @throws {Error} When token generation fails
	 *
	 * @example
	 * ```typescript
	 * const token = await provider.getToken('contact_form');
	 * console.log('Token generated for contact form');
	 * ```
	 */
	async getToken(action: string = 'submit'): Promise<string> {
		// Check cache first
		const cached = this.getCachedToken(action);
		if (cached) return cached;

		// Ensure loaded
		await this.init();

		// Get new token
		const token = await new Promise<string>((resolve, reject) => {
			(window as any).grecaptcha.ready(() => {
				(window as any).grecaptcha.execute(this.siteKey, { action }).then(resolve).catch(reject);
			});
		});

		// Cache it
		this.cacheToken(action, token);

		return token;
	}

	/**
	 * Verify a reCAPTCHA token (placeholder implementation)
	 * In practice, this should call your backend verification endpoint
	 *
	 * @param {string} token - The token to verify
	 * @returns {Promise<boolean>} Verification result
	 *
	 * @example
	 * ```typescript
	 * const isValid = await provider.verify(token);
	 * if (isValid) {
	 *   console.log('Token is valid');
	 * }
	 * ```
	 */
	async verify(token: string): Promise<boolean> {
		// Server-side verification - implement based on your backend
		// This is just a placeholder
		try {
			const response = await fetch('/api/recaptcha/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});

			const result: RecaptchaVerificationResult = await response.json();
			return result.success && (result.score || 0) >= (this.config.minScore || 0.5);
		} catch (error) {
			logger.error('reCAPTCHA verification failed:', error);
			return false;
		}
	}

	/**
	 * Clean up the provider by removing the script
	 *
	 * @example
	 * ```typescript
	 * provider.cleanup();
	 * console.log('reCAPTCHA script removed');
	 * ```
	 */
	cleanup(): void {
		const script = document.getElementById(this.scriptId);
		if (script) {
			script.remove();
		}
		this.loaded = false;
		this.loading = null;
		this.clearCache();
	}
}

/**
 * No-op reCAPTCHA provider for when reCAPTCHA is disabled
 * Useful for development, testing, or when reCAPTCHA is not required
 *
 * @example
 * ```typescript
 * const provider = new NoopRecaptchaProvider();
 * await provider.init(); // Always succeeds
 * const token = await provider.getToken(); // Returns 'noop-token'
 * const isValid = await provider.verify(token); // Always returns true
 * ```
 */
export class NoopRecaptchaProvider extends RecaptchaProvider {
	/**
	 * Initialize the no-op provider (always succeeds immediately)
	 *
	 * @returns {Promise<boolean>} Always resolves to true
	 */
	async init(): Promise<boolean> {
		return true;
	}

	/**
	 * Get a no-op token (always returns the same placeholder)
	 *
	 * @param {string} [_action] - Action name (ignored)
	 * @returns {Promise<string>} Always returns 'noop-token'
	 */
	async getToken(_action?: string): Promise<string> {
		return 'noop-token';
	}

	/**
	 * Verify a no-op token (always succeeds)
	 *
	 * @param {string} _token - Token to verify (ignored)
	 * @returns {Promise<boolean>} Always returns true
	 */
	async verify(_token: string): Promise<boolean> {
		return true;
	}
}

/**
 * Factory function to create a reCAPTCHA provider based on configuration
 *
 * @param {RecaptchaConfig} [config] - Provider configuration
 * @returns {RecaptchaProvider} Configured reCAPTCHA provider instance
 * @throws {Error} When an unknown provider type is specified
 *
 * @example
 * ```typescript
 * // Create Google reCAPTCHA v3 provider
 * const provider = createRecaptchaProvider({
 *   enabled: true,
 *   provider: 'google-v3',
 *   siteKey: 'your-site-key',
 *   minScore: 0.7
 * });
 *
 * // Create no-op provider (for testing)
 * const testProvider = createRecaptchaProvider({
 *   enabled: false
 * });
 * ```
 */
export function createRecaptchaProvider(config: RecaptchaConfig = {}): RecaptchaProvider {
	if (!config.enabled) {
		return new NoopRecaptchaProvider(config);
	}

	switch (config.provider) {
		case 'google-v3':
			return new GoogleRecaptchaV3Provider(config);
		default:
			throw new Error(`Unknown reCAPTCHA provider: ${config.provider}`);
	}
}

/**
 * Type guard to check if an object is a valid RecaptchaProvider
 *
 * @param {any} obj - Object to check
 * @returns {obj is RecaptchaProvider} True if object is a valid provider
 *
 * @example
 * ```typescript
 * if (isRecaptchaProvider(provider)) {
 *   const token = await provider.getToken('submit');
 * }
 * ```
 */
export function isRecaptchaProvider(obj: any): obj is RecaptchaProvider {
	return (
		obj &&
		typeof obj.init === 'function' &&
		typeof obj.getToken === 'function' &&
		typeof obj.verify === 'function'
	);
}

/**
 * Validate reCAPTCHA configuration
 *
 * @param {RecaptchaConfig} config - Configuration to validate
 * @throws {Error} When configuration is invalid
 *
 * @example
 * ```typescript
 * try {
 *   validateRecaptchaConfig({
 *     enabled: true,
 *     provider: 'google-v3',
 *     siteKey: 'your-site-key'
 *   });
 *   console.log('Configuration is valid');
 * } catch (error) {
 *   console.error('Invalid configuration:', error.message);
 * }
 * ```
 */
export function validateRecaptchaConfig(config: RecaptchaConfig): void {
	if (config.enabled && config.provider === 'google-v3' && !config.siteKey) {
		throw new Error('siteKey is required for Google reCAPTCHA v3');
	}

	if (config.minScore !== undefined) {
		if (typeof config.minScore !== 'number' || config.minScore < 0 || config.minScore > 1) {
			throw new Error('minScore must be a number between 0 and 1');
		}
	}

	if (config.cacheTimeout !== undefined) {
		if (typeof config.cacheTimeout !== 'number' || config.cacheTimeout < 0) {
			throw new Error('cacheTimeout must be a positive number');
		}
	}
}

// Default export - factory function for convenience
export { createRecaptchaProvider as default };
