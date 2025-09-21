/**
 * @fileoverview Generic email service interface for @goobits/forms
 * Provides a pluggable email service with adapters for different providers
 */
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
    /**
     * Creates a new email provider instance
     *
     * @param {EmailProviderConfig} config - Provider configuration
     */
    constructor(config = {}) {
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
    async sendEmail(_to, _subject, _bodyHtml, _bodyText) {
        throw new Error("EmailProvider.sendEmail() must be implemented");
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
    /**
     * Creates a new AWS SES provider instance
     *
     * @param {EmailProviderConfig} config - AWS SES configuration
     */
    constructor(config = {}) {
        super(config);
        /** Whether the provider has been initialized */
        this.initialized = false;
        /** Nodemailer transporter instance */
        this.transporter = null;
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
    async init() {
        if (this.initialized)
            return;
        try {
            const { aws, nodemailer } = await import("./awsImports.ts");
            const sesConfig = {
                apiVersion: this.config.apiVersion || "latest",
                region: this.config.region,
                ...(this.config.accessKeyId && this.config.secretAccessKey
                    ? {
                        credentials: {
                            accessKeyId: this.config.accessKeyId,
                            secretAccessKey: this.config.secretAccessKey,
                        },
                    }
                    : {}),
            };
            const ses = new aws.SES(sesConfig);
            // Create Nodemailer SES transporter
            this.transporter = nodemailer.createTransport({
                SES: { ses, aws },
            });
            this.initialized = true;
        }
        catch (error) {
            console.error("Failed to initialize AWS SES provider:", error);
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
    async sendEmail(to, subject, bodyHtml, bodyText) {
        try {
            await this.init();
            const trimmedSubject = subject.trim();
            const trimmedBodyHtml = (bodyHtml || "").trim();
            const trimmedBodyText = (bodyText || "").trim();
            const mailOptions = {
                from: this.config.fromEmail,
                to,
                subject: trimmedSubject,
            };
            if (trimmedBodyHtml)
                mailOptions.html = trimmedBodyHtml;
            if (trimmedBodyText)
                mailOptions.text = trimmedBodyText;
            await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                message: "Email sent successfully",
            };
        }
        catch (error) {
            return {
                success: false,
                message: "Failed to send email",
                details: error,
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
    /**
     * Creates a new mock email provider instance
     *
     * @param {EmailProviderConfig} config - Provider configuration
     */
    constructor(config = {}) {
        super(config);
        /** Array of sent emails for testing verification */
        this.sentEmails = [];
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
    async sendEmail(to, subject, bodyHtml, bodyText) {
        // Store the email in the sent emails array
        const email = {
            to,
            subject,
            bodyHtml,
            bodyText,
            timestamp: new Date(),
        };
        this.sentEmails.push(email);
        console.log("Mock email sent:", {
            to,
            subject,
            timestamp: email.timestamp,
        });
        return {
            success: true,
            message: "Mock email sent successfully",
            details: email,
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
    getSentEmails() {
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
    clearSentEmails() {
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
export function createEmailProvider(config = {}) {
    const { provider = "mock" } = config;
    switch (provider) {
        case "aws-ses":
            return new AwsSesProvider(config);
        case "mock":
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
export default async function sendEmail(to, subject, bodyHtml, bodyText, config = {}) {
    const provider = createEmailProvider(config);
    return provider.sendEmail(to, subject, bodyHtml, bodyText);
}
