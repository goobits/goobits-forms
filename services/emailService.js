/**
 * Generic email service interface for @goobits/forms
 * Provides a pluggable email service with adapters for different providers
 */

// Default email provider interface
export class EmailProvider {
	constructor(config = {}) {
		this.config = config
	}

	/**
	 * Send an email
	 * @param {string} to - Recipient email address
	 * @param {string} subject - Email subject
	 * @param {string} bodyHtml - HTML content
	 * @param {string} [bodyText] - Plain text content
	 * @returns {Promise<{success: boolean, message: string, details?: any}>}
	 */
	async sendEmail(_to, _subject, _bodyHtml, _bodyText) {
		throw new Error('EmailProvider.sendEmail() must be implemented')
	}
}

// AWS SES Provider - Similar to the original implementation
export class AwsSesProvider extends EmailProvider {
	constructor(config = {}) {
		super(config)
		this.initialized = false
		this.transporter = null
	}

	/**
	 * Initialize the AWS SES client and transporter
	 */
	async init() {
		if (this.initialized) return
		
		try {
			const { aws, nodemailer } = await import('./awsImports.js')
			
			const ses = new aws.SES({
				apiVersion: this.config.apiVersion || 'latest',
				region: this.config.region,
				...(this.config.accessKeyId && this.config.secretAccessKey
					? {
						credentials: {
							accessKeyId: this.config.accessKeyId,
							secretAccessKey: this.config.secretAccessKey
						}
					}
					: {})
			})
			
			// Create Nodemailer SES transporter
			this.transporter = nodemailer.createTransport({
				SES: { ses, aws }
			})
			
			this.initialized = true
		} catch (error) {
			console.error('Failed to initialize AWS SES provider:', error)
			throw error
		}
	}

	/**
	 * Send an email using AWS SES
	 * @param {string} to - Recipient email address
	 * @param {string} subject - Email subject
	 * @param {string} bodyHtml - HTML content
	 * @param {string} [bodyText] - Plain text content
	 * @returns {Promise<{success: boolean, message: string, details?: any}>}
	 */
	async sendEmail(to, subject, bodyHtml, bodyText) {
		try {
			await this.init()
			
			subject = subject.trim()
			bodyHtml = (bodyHtml || '').trim()
			bodyText = (bodyText || '').trim()
			
			const mailOptions = {
				from: this.config.fromEmail,
				to,
				subject
			}
			
			if (bodyHtml) mailOptions.html = bodyHtml
			if (bodyText) mailOptions.text = bodyText
			
			await this.transporter.sendMail(mailOptions)
			
			return {
				success: true,
				message: 'Email sent successfully'
			}
		} catch (error) {
			return {
				success: false,
				message: 'Failed to send email',
				details: error
			}
		}
	}
}

// Simple mock provider for testing/development
export class MockEmailProvider extends EmailProvider {
	constructor(config = {}) {
		super(config)
		this.sentEmails = []
	}

	async sendEmail(to, subject, bodyHtml, bodyText) {
		// Store the email in the sent emails array
		const email = {
			to,
			subject,
			bodyHtml,
			bodyText,
			timestamp: new Date()
		}
		
		this.sentEmails.push(email)
		
		console.log('Mock email sent:', {
			to,
			subject,
			timestamp: email.timestamp
		})
		
		return {
			success: true,
			message: 'Mock email sent successfully',
			details: email
		}
	}
	
	// Helper method to get sent emails (for testing)
	getSentEmails() {
		return this.sentEmails
	}
}

// Factory function to create an email provider
export function createEmailProvider(config = {}) {
	const { provider = 'mock' } = config
	
	switch (provider) {
	case 'aws-ses':
		return new AwsSesProvider(config)
	case 'mock':
		return new MockEmailProvider(config)
	default:
		throw new Error(`Unknown email provider: ${ provider }`)
	}
}

// Default export - simple function that uses the provider system internally
export default async function sendEmail(to, subject, bodyHtml, bodyText, config = {}) {
	const provider = createEmailProvider(config)
	return provider.sendEmail(to, subject, bodyHtml, bodyText)
}