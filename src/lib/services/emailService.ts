/**
 * @fileoverview Generic email service interface for @goobits/ui
 * Provides a pluggable email service with adapters for different providers
 */

import type { SESClientConfig } from '@aws-sdk/client-ses';
import { createLogger } from '../utils/logger.ts';

const logger = createLogger('EmailService');

/**
 * Email provider configuration interface
 */
export interface EmailProviderConfig {
	/** The email provider type */
	provider?: string;
	/** Sender email address */
	fromEmail?: string;
	/** AWS API version */
	apiVersion?: string;
	/** AWS region */
	region?: string;
	/** AWS access key ID */
	accessKeyId?: string;
	/** AWS secret access key */
	secretAccessKey?: string;
	/** Additional configuration options */
	[key: string]: any;
}

/**
 * Email sending result interface
 */
export interface EmailResult {
	/** Whether the email was sent successfully */
	success: boolean;
	/** Human-readable message describing the result */
	message: string;
	/** Additional details about the result (error object, email data, etc.) */
	details?: any;
}

/**
 * Email data interface for mock provider
 */
export interface MockEmailData {
	/** Recipient email address */
	to: string;
	/** Email subject */
	subject: string;
	/** HTML content */
	bodyHtml?: string;
	/** Plain text content */
	bodyText?: string;
	/** Timestamp when email was sent */
	timestamp: Date;
}

/**
 * Base email provider class that defines the interface for all email providers
 *
 * @example
 * ```typescript
 * class CustomEmailProvider extends EmailProvider {
 *   async sendEmail(to: string, subject: string, bodyHtml: string, bodyText?: string): Promise<EmailResult> {
 *     // Custom implementation
 *     return { success: true, message: 'Email sent successfully' };
 *   }
 * }
 * ```
 */
export class EmailProvider {
	/** Provider configuration */
	protected config: EmailProviderConfig;

	/**
	 * Creates a new email provider instance
	 *
	 * @param {EmailProviderConfig} config - Provider configuration
	 */
	constructor(config: EmailProviderConfig = {}) {
		this.config = config;
	}

	/**
	 * Send an email - must be implemented by subclasses
	 *
	 * @param {string} to - Recipient email address
	 * @param {string} subject - Email subject
	 * @param {string} bodyHtml - HTML content
	 * @param {string} [bodyText] - Plain text content (optional)
	 * @returns {Promise<EmailResult>} Result of the email sending operation
	 * @throws {Error} When not implemented by subclass
	 *
	 * @example
	 * ```typescript
	 * const result = await provider.sendEmail(
	 *   'user@example.com',
	 *   'Welcome!',
	 *   '<h1>Welcome to our service</h1>',
	 *   'Welcome to our service'
	 * );
	 *
	 * if (result.success) {
	 *   console.log('Email sent successfully');
	 * } else {
	 *   console.error('Failed to send email:', result.message);
	 * }
	 * ```
	 */
	async sendEmail(
		_to: string,
		_subject: string,
		_bodyHtml: string,
		_bodyText?: string
	): Promise<EmailResult> {
		throw new Error('EmailProvider.sendEmail() must be implemented');
	}
}

/**
 * AWS SES email provider implementation
 *
 * @example
 * ```typescript
 * const sesProvider = new AwsSesProvider({
 *   region: 'us-east-1',
 *   fromEmail: 'noreply@example.com',
 *   accessKeyId: 'YOUR_ACCESS_KEY',
 *   secretAccessKey: 'YOUR_SECRET_KEY'
 * });
 *
 * const result = await sesProvider.sendEmail(
 *   'user@example.com',
 *   'Test Email',
 *   '<p>This is a test email</p>'
 * );
 * ```
 */
export class AwsSesProvider extends EmailProvider {
	/** Whether the provider has been initialized */
	private initialized: boolean = false;
	/** Nodemailer transporter instance */
	private transporter: any = null;

	/**
	 * Creates a new AWS SES provider instance
	 *
	 * @param {EmailProviderConfig} config - AWS SES configuration
	 */
	constructor(config: EmailProviderConfig = {}) {
		super(config);
	}

	/**
	 * Initialize the AWS SES client and transporter
	 * This method is called automatically when sending an email
	 *
	 * @returns {Promise<void>}
	 * @throws {Error} When AWS dependencies cannot be loaded or SES initialization fails
	 *
	 * @example
	 * ```typescript
	 * const provider = new AwsSesProvider(config);
	 * await provider.init(); // Optional - called automatically when sending
	 * ```
	 */
	async init(): Promise<void> {
		if (this.initialized) return;

		try {
			const { getAwsDependencies } = await import('./awsImports.ts');
			const { aws, nodemailer } = await getAwsDependencies();

			const sesConfig: SESClientConfig = {
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
			};

			const ses = new aws.SES(sesConfig);

			// Create Nodemailer SES transporter
			this.transporter = nodemailer.createTransport({
				SES: { ses, aws }
			});

			this.initialized = true;
		} catch (error) {
			logger.error('Failed to initialize AWS SES provider:', error);
			throw error;
		}
	}

	/**
	 * Send an email using AWS SES
	 *
	 * @param {string} to - Recipient email address
	 * @param {string} subject - Email subject
	 * @param {string} bodyHtml - HTML content
	 * @param {string} [bodyText] - Plain text content (optional)
	 * @returns {Promise<EmailResult>} Result of the email sending operation
	 *
	 * @example
	 * ```typescript
	 * const result = await awsSesProvider.sendEmail(
	 *   'user@example.com',
	 *   'Welcome!',
	 *   '<h1>Welcome to our service</h1>',
	 *   'Welcome to our service'
	 * );
	 *
	 * if (result.success) {
	 *   console.log('Email sent via AWS SES');
	 * }
	 * ```
	 */
	async sendEmail(
		to: string,
		subject: string,
		bodyHtml: string,
		bodyText?: string
	): Promise<EmailResult> {
		try {
			await this.init();

			const trimmedSubject = subject.trim();
			const trimmedBodyHtml = (bodyHtml || '').trim();
			const trimmedBodyText = (bodyText || '').trim();

			const mailOptions: any = {
				from: this.config.fromEmail,
				to,
				subject: trimmedSubject
			};

			if (trimmedBodyHtml) mailOptions.html = trimmedBodyHtml;
			if (trimmedBodyText) mailOptions.text = trimmedBodyText;

			await this.transporter.sendMail(mailOptions);

			return {
				success: true,
				message: 'Email sent successfully'
			};
		} catch (error) {
			return {
				success: false,
				message: 'Failed to send email',
				details: error
			};
		}
	}
}

/**
 * Mock email provider for testing and development
 * Stores sent emails in memory instead of actually sending them
 *
 * @example
 * ```typescript
 * const mockProvider = new MockEmailProvider();
 *
 * await mockProvider.sendEmail(
 *   'test@example.com',
 *   'Test Subject',
 *   '<p>Test content</p>'
 * );
 *
 * const sentEmails = mockProvider.getSentEmails();
 * console.log(`Sent ${sentEmails.length} emails`);
 * ```
 */
export class MockEmailProvider extends EmailProvider {
	/** Array of sent emails for testing verification */
	private sentEmails: MockEmailData[] = [];

	/**
	 * Creates a new mock email provider instance
	 *
	 * @param {EmailProviderConfig} config - Provider configuration
	 */
	constructor(config: EmailProviderConfig = {}) {
		super(config);
	}

	/**
	 * Mock email sending - stores email in memory instead of sending
	 *
	 * @param {string} to - Recipient email address
	 * @param {string} subject - Email subject
	 * @param {string} bodyHtml - HTML content
	 * @param {string} [bodyText] - Plain text content (optional)
	 * @returns {Promise<EmailResult>} Success result with email details
	 *
	 * @example
	 * ```typescript
	 * const result = await mockProvider.sendEmail(
	 *   'test@example.com',
	 *   'Test Subject',
	 *   '<p>Test HTML content</p>',
	 *   'Test plain text content'
	 * );
	 *
	 * console.log(result.details.timestamp); // When the mock email was "sent"
	 * ```
	 */
	async sendEmail(
		to: string,
		subject: string,
		bodyHtml: string,
		bodyText?: string
	): Promise<EmailResult> {
		// Store the email in the sent emails array
		const email: MockEmailData = {
			to,
			subject,
			bodyHtml,
			bodyText,
			timestamp: new Date()
		};

		this.sentEmails.push(email);

		logger.info('Mock email sent:', {
			to,
			subject,
			timestamp: email.timestamp
		});

		return {
			success: true,
			message: 'Mock email sent successfully',
			details: email
		};
	}

	/**
	 * Get all sent emails for testing verification
	 *
	 * @returns {MockEmailData[]} Array of all emails that were "sent"
	 *
	 * @example
	 * ```typescript
	 * const mockProvider = new MockEmailProvider();
	 * await mockProvider.sendEmail('test@example.com', 'Subject', '<p>Content</p>');
	 *
	 * const sentEmails = mockProvider.getSentEmails();
	 * expect(sentEmails).toHaveLength(1);
	 * expect(sentEmails[0].to).toBe('test@example.com');
	 * ```
	 */
	getSentEmails(): MockEmailData[] {
		return this.sentEmails;
	}

	/**
	 * Clear all sent emails (useful for test cleanup)
	 *
	 * @example
	 * ```typescript
	 * const mockProvider = new MockEmailProvider();
	 * // ... send some emails
	 * mockProvider.clearSentEmails(); // Reset for next test
	 * ```
	 */
	clearSentEmails(): void {
		this.sentEmails = [];
	}
}

/**
 * Factory function to create an email provider based on configuration
 *
 * @param {EmailProviderConfig} config - Provider configuration
 * @returns {EmailProvider} Configured email provider instance
 * @throws {Error} When an unknown provider type is specified
 *
 * @example
 * ```typescript
 * // Create AWS SES provider
 * const sesProvider = createEmailProvider({
 *   provider: 'aws-ses',
 *   region: 'us-east-1',
 *   fromEmail: 'noreply@example.com'
 * });
 *
 * // Create mock provider for testing
 * const mockProvider = createEmailProvider({
 *   provider: 'mock'
 * });
 * ```
 */
export function createEmailProvider(config: EmailProviderConfig = {}): EmailProvider {
	const { provider = 'mock' } = config;

	switch (provider) {
		case 'aws-ses':
			return new AwsSesProvider(config);
		case 'mock':
			return new MockEmailProvider(config);
		default:
			throw new Error(`Unknown email provider: ${provider}`);
	}
}

/**
 * Simple function that uses the provider system internally
 * Provides a convenient API for one-off email sending
 *
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} bodyHtml - HTML content
 * @param {string} [bodyText] - Plain text content (optional)
 * @param {EmailProviderConfig} [config] - Provider configuration
 * @returns {Promise<EmailResult>} Result of the email sending operation
 *
 * @example
 * ```typescript
 * // Quick email sending with default (mock) provider
 * const result = await sendEmail(
 *   'user@example.com',
 *   'Welcome!',
 *   '<h1>Welcome</h1>',
 *   'Welcome'
 * );
 *
 * // Email sending with AWS SES
 * const result = await sendEmail(
 *   'user@example.com',
 *   'Welcome!',
 *   '<h1>Welcome</h1>',
 *   'Welcome',
 *   {
 *     provider: 'aws-ses',
 *     region: 'us-east-1',
 *     fromEmail: 'noreply@example.com'
 *   }
 * );
 * ```
 */
export default async function sendEmail(
	to: string,
	subject: string,
	bodyHtml: string,
	bodyText?: string,
	config: EmailProviderConfig = {}
): Promise<EmailResult> {
	const provider = createEmailProvider(config);
	return provider.sendEmail(to, subject, bodyHtml, bodyText);
}
