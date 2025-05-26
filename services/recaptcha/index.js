/**
 * Pluggable reCAPTCHA service
 * Allows for custom implementations or disabling reCAPTCHA entirely
 */

// Default reCAPTCHA provider interface
export class RecaptchaProvider {
	constructor(config = {}) {
		this.config = config
		this.tokenCache = new Map()
		this.cacheTimeout = config.cacheTimeout || 110000 // 110 seconds (tokens valid for 120)
	}

	/**
	 * Initialize the provider
	 * @returns {Promise<boolean>} Success status
	 */
	async init() {
		throw new Error('RecaptchaProvider.init() must be implemented')
	}

	/**
	 * Get a reCAPTCHA token
	 * @param {string} action - The action name
	 * @returns {Promise<string>} The token
	 */
	async getToken(_action = 'submit') {
		throw new Error('RecaptchaProvider.getToken() must be implemented')
	}

	/**
	 * Verify a token server-side
	 * @param {string} token - The token to verify
	 * @returns {Promise<boolean>} Verification status
	 */
	async verify(_token) {
		throw new Error('RecaptchaProvider.verify() must be implemented')
	}

	/**
	 * Get cached token if available
	 * @param {string} action - The action name
	 * @returns {string|null} Cached token or null
	 */
	getCachedToken(action) {
		const cacheKey = `token_${ action }`
		const cached = this.tokenCache.get(cacheKey)

		if (!cached) return null

		// Check if expired
		if (Date.now() - cached.timestamp > this.cacheTimeout) {
			this.tokenCache.delete(cacheKey)
			return null
		}

		return cached.token
	}

	/**
	 * Cache a token
	 * @param {string} action - The action name
	 * @param {string} token - The token to cache
	 */
	cacheToken(action, token) {
		const cacheKey = `token_${ action }`
		this.tokenCache.set(cacheKey, {
			token,
			timestamp: Date.now()
		})

		// Auto-cleanup after timeout
		setTimeout(() => {
			this.tokenCache.delete(cacheKey)
		}, this.cacheTimeout)
	}
}

// Google reCAPTCHA v3 implementation
export class GoogleRecaptchaV3Provider extends RecaptchaProvider {
	constructor(config = {}) {
		super(config)
		this.siteKey = config.siteKey
		this.scriptId = 'recaptcha-v3'
		this.loaded = false
		this.loading = null
	}

	async init() {
		if (this.loaded) return true
		if (this.loading) return this.loading

		this.loading = new Promise((resolve, reject) => {
			// Check if already loaded
			if (typeof window !== 'undefined' && window.grecaptcha) {
				this.loaded = true
				resolve(true)
				return
			}

			// Load script
			const script = document.createElement('script')
			script.id = this.scriptId
			script.src = `https://www.google.com/recaptcha/api.js?render=${ this.siteKey }`
			script.async = true
			script.onload = () => {
				this.loaded = true
				resolve(true)
			}
			script.onerror = () => {
				reject(new Error('Failed to load reCAPTCHA'))
			}

			document.head.appendChild(script)
		})

		return this.loading
	}

	async getToken(action = 'submit') {
		// Check cache first
		const cached = this.getCachedToken(action)
		if (cached) return cached

		// Ensure loaded
		await this.init()

		// Get new token
		const token = await new Promise((resolve, reject) => {
			window.grecaptcha.ready(() => {
				window.grecaptcha.execute(this.siteKey, { action })
					.then(resolve)
					.catch(reject)
			})
		})

		// Cache it
		this.cacheToken(action, token)

		return token
	}

	async verify(token) {
		// Server-side verification - implement based on your backend
		// This is just a placeholder
		const response = await fetch('/api/recaptcha/verify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token })
		})

		const result = await response.json()
		return result.success && result.score >= (this.config.minScore || 0.5)
	}
}

// No-op provider for when reCAPTCHA is disabled
export class NoopRecaptchaProvider extends RecaptchaProvider {
	async init() {
		return true
	}

	async getToken() {
		return 'noop-token'
	}

	async verify() {
		return true
	}
}

// Default export - factory function
export function createRecaptchaProvider(config = {}) {
	if (!config.enabled) {
		return new NoopRecaptchaProvider(config)
	}

	switch (config.provider) {
	case 'google-v3':
		return new GoogleRecaptchaV3Provider(config)
	default:
		throw new Error(`Unknown reCAPTCHA provider: ${ config.provider }`)
	}
}