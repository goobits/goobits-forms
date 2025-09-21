/**
 * @fileoverview Generic email service interface for @goobits/forms
 * Provides a pluggable email service with adapters for different providers
 */
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
export declare class EmailProvider {
    /** Provider configuration */
    protected config: EmailProviderConfig;
    /**
     * Creates a new email provider instance
     *
     * @param {EmailProviderConfig} config - Provider configuration
     */
    constructor(config?: EmailProviderConfig);
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
    sendEmail(_to: string, _subject: string, _bodyHtml: string, _bodyText?: string): Promise<EmailResult>;
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
export declare class AwsSesProvider extends EmailProvider {
    /** Whether the provider has been initialized */
    private initialized;
    /** Nodemailer transporter instance */
    private transporter;
    /**
     * Creates a new AWS SES provider instance
     *
     * @param {EmailProviderConfig} config - AWS SES configuration
     */
    constructor(config?: EmailProviderConfig);
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
    init(): Promise<void>;
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
    sendEmail(to: string, subject: string, bodyHtml: string, bodyText?: string): Promise<EmailResult>;
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
export declare class MockEmailProvider extends EmailProvider {
    /** Array of sent emails for testing verification */
    private sentEmails;
    /**
     * Creates a new mock email provider instance
     *
     * @param {EmailProviderConfig} config - Provider configuration
     */
    constructor(config?: EmailProviderConfig);
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
    sendEmail(to: string, subject: string, bodyHtml: string, bodyText?: string): Promise<EmailResult>;
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
    getSentEmails(): MockEmailData[];
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
    clearSentEmails(): void;
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
export declare function createEmailProvider(config?: EmailProviderConfig): EmailProvider;
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
export default function sendEmail(to: string, subject: string, bodyHtml: string, bodyText?: string, config?: EmailProviderConfig): Promise<EmailResult>;
