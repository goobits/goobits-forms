/**
 * Comprehensive tests for emailService
 *
 * Tests cover all email provider implementations, factory functions,
 * and edge cases for email sending functionality.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	EmailProvider,
	AwsSesProvider,
	MockEmailProvider,
	createEmailProvider,
	type EmailProviderConfig,
	type EmailResult,
	type MockEmailData
} from './emailService';
import sendEmail from './emailService';

// Mock AWS imports to avoid requiring actual AWS SDK
vi.mock('./awsImports.ts', () => {
	// Create mock transporter
	const mockTransporter = {
		sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id-123' })
	};

	// Mock SES class constructor
	class MockSES {
		config: any;
		constructor(config: any) {
			this.config = config;
		}
	}

	return {
		aws: {
			SES: MockSES
		},
		nodemailer: {
			createTransport: vi.fn().mockReturnValue(mockTransporter)
		}
	};
});

describe('EmailProvider Base Class', () => {
	test('constructor accepts config and stores it', () => {
		const config: EmailProviderConfig = {
			provider: 'test',
			fromEmail: 'test@example.com',
			region: 'us-east-1'
		};
		const provider = new EmailProvider(config);
		expect(provider).toBeDefined();
		expect((provider as any).config).toEqual(config);
	});

	test('constructor accepts empty config', () => {
		const provider = new EmailProvider();
		expect(provider).toBeDefined();
		expect((provider as any).config).toEqual({});
	});

	test('sendEmail throws error when not implemented', async () => {
		const provider = new EmailProvider();
		await expect(
			provider.sendEmail('test@example.com', 'Test Subject', '<p>Test Body</p>')
		).rejects.toThrow('EmailProvider.sendEmail() must be implemented');
	});
});

describe('MockEmailProvider', () => {
	let mockProvider: MockEmailProvider;
	let consoleLogSpy: any;

	beforeEach(() => {
		mockProvider = new MockEmailProvider({ fromEmail: 'noreply@example.com' });
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
	});

	test('constructor creates instance with config', () => {
		const config: EmailProviderConfig = {
			provider: 'mock',
			fromEmail: 'test@example.com'
		};
		const provider = new MockEmailProvider(config);
		expect(provider).toBeDefined();
		expect((provider as any).config).toEqual(config);
	});

	test('sendEmail stores email in sentEmails array', async () => {
		await mockProvider.sendEmail(
			'recipient@example.com',
			'Test Subject',
			'<p>Test Body</p>'
		);

		const sentEmails = mockProvider.getSentEmails();
		expect(sentEmails).toHaveLength(1);
		expect(sentEmails[0].to).toBe('recipient@example.com');
		expect(sentEmails[0].subject).toBe('Test Subject');
		expect(sentEmails[0].bodyHtml).toBe('<p>Test Body</p>');
	});

	test('sendEmail returns success result', async () => {
		const result = await mockProvider.sendEmail(
			'recipient@example.com',
			'Test Subject',
			'<p>Test Body</p>'
		);

		expect(result.success).toBe(true);
		expect(result.message).toBe('Mock email sent successfully');
		expect(result.details).toBeDefined();
	});

	test('sendEmail includes timestamp', async () => {
		const beforeTime = new Date();
		const result = await mockProvider.sendEmail(
			'recipient@example.com',
			'Test Subject',
			'<p>Test Body</p>'
		);
		const afterTime = new Date();

		expect(result.details.timestamp).toBeDefined();
		expect(result.details.timestamp).toBeInstanceOf(Date);
		expect(result.details.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
		expect(result.details.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
	});

	test('getSentEmails returns all sent emails', async () => {
		await mockProvider.sendEmail('user1@example.com', 'Subject 1', '<p>Body 1</p>');
		await mockProvider.sendEmail('user2@example.com', 'Subject 2', '<p>Body 2</p>');
		await mockProvider.sendEmail('user3@example.com', 'Subject 3', '<p>Body 3</p>');

		const sentEmails = mockProvider.getSentEmails();
		expect(sentEmails).toHaveLength(3);
		expect(sentEmails[0].to).toBe('user1@example.com');
		expect(sentEmails[1].to).toBe('user2@example.com');
		expect(sentEmails[2].to).toBe('user3@example.com');
	});

	test('getSentEmails returns empty array initially', () => {
		const sentEmails = mockProvider.getSentEmails();
		expect(sentEmails).toEqual([]);
		expect(sentEmails).toHaveLength(0);
	});

	test('clearSentEmails removes all emails', async () => {
		await mockProvider.sendEmail('user1@example.com', 'Subject 1', '<p>Body 1</p>');
		await mockProvider.sendEmail('user2@example.com', 'Subject 2', '<p>Body 2</p>');

		expect(mockProvider.getSentEmails()).toHaveLength(2);

		mockProvider.clearSentEmails();

		expect(mockProvider.getSentEmails()).toHaveLength(0);
		expect(mockProvider.getSentEmails()).toEqual([]);
	});

	test('multiple emails are stored in order', async () => {
		const emails = [
			{ to: 'first@example.com', subject: 'First' },
			{ to: 'second@example.com', subject: 'Second' },
			{ to: 'third@example.com', subject: 'Third' }
		];

		for (const email of emails) {
			await mockProvider.sendEmail(email.to, email.subject, '<p>Body</p>');
		}

		const sentEmails = mockProvider.getSentEmails();
		expect(sentEmails).toHaveLength(3);
		expect(sentEmails[0].to).toBe('first@example.com');
		expect(sentEmails[1].to).toBe('second@example.com');
		expect(sentEmails[2].to).toBe('third@example.com');
	});

	test('handles optional bodyText parameter', async () => {
		const result = await mockProvider.sendEmail(
			'recipient@example.com',
			'Test Subject',
			'<p>HTML Body</p>',
			'Plain text body'
		);

		expect(result.success).toBe(true);
		const sentEmails = mockProvider.getSentEmails();
		expect(sentEmails[0].bodyText).toBe('Plain text body');
	});

	test('handles missing bodyText parameter', async () => {
		const result = await mockProvider.sendEmail(
			'recipient@example.com',
			'Test Subject',
			'<p>HTML Body</p>'
		);

		expect(result.success).toBe(true);
		const sentEmails = mockProvider.getSentEmails();
		expect(sentEmails[0].bodyText).toBeUndefined();
	});

	test('logs to console when sending email', async () => {
		await mockProvider.sendEmail(
			'recipient@example.com',
			'Test Subject',
			'<p>Test Body</p>'
		);

		expect(consoleLogSpy).toHaveBeenCalledWith(
			'Mock email sent:',
			expect.objectContaining({
				to: 'recipient@example.com',
				subject: 'Test Subject',
				timestamp: expect.any(Date)
			})
		);
	});
});

describe('AwsSesProvider', () => {
	let awsProvider: AwsSesProvider;

	beforeEach(() => {
		vi.clearAllMocks();

		awsProvider = new AwsSesProvider({
			region: 'us-east-1',
			fromEmail: 'noreply@example.com',
			accessKeyId: 'test-access-key',
			secretAccessKey: 'test-secret-key'
		});
	});

	test('constructor creates instance with config', () => {
		const config: EmailProviderConfig = {
			provider: 'aws-ses',
			region: 'us-west-2',
			fromEmail: 'test@example.com',
			accessKeyId: 'key',
			secretAccessKey: 'secret'
		};
		const provider = new AwsSesProvider(config);
		expect(provider).toBeDefined();
		expect((provider as any).config).toEqual(config);
	});

	test('init() initializes SES client and transporter, and is idempotent', async () => {
		const mockAwsImports = await import('./awsImports.ts');
		const createTransportSpy = vi.spyOn(mockAwsImports.nodemailer, 'createTransport');

		await awsProvider.init();

		// Verify transporter was created
		expect(createTransportSpy).toHaveBeenCalled();
		expect((awsProvider as any).transporter).toBeDefined();
		expect((awsProvider as any).initialized).toBe(true);

		// Test idempotency - multiple calls should only init once
		await awsProvider.init();
		await awsProvider.init();
		expect(createTransportSpy).toHaveBeenCalledTimes(1);
	});

	test('init() handles config variations (region, credentials, apiVersion)', async () => {
		// Test with credentials
		const providerWithCreds = new AwsSesProvider({
			region: 'eu-west-1',
			fromEmail: 'test@example.com',
			accessKeyId: 'my-key',
			secretAccessKey: 'my-secret',
			apiVersion: '2010-12-01'
		});
		await providerWithCreds.init();
		expect((providerWithCreds as any).initialized).toBe(true);
		expect((providerWithCreds as any).config.accessKeyId).toBe('my-key');
		expect((providerWithCreds as any).config.secretAccessKey).toBe('my-secret');
		expect((providerWithCreds as any).config.apiVersion).toBe('2010-12-01');

		// Test without credentials
		const providerWithoutCreds = new AwsSesProvider({
			region: 'us-east-1',
			fromEmail: 'test@example.com'
		});
		await providerWithoutCreds.init();
		expect((providerWithoutCreds as any).initialized).toBe(true);
		expect((providerWithoutCreds as any).config.accessKeyId).toBeUndefined();
		expect((providerWithoutCreds as any).config.secretAccessKey).toBeUndefined();
	});

	test('sendEmail calls init() before sending', async () => {
		const initSpy = vi.spyOn(awsProvider, 'init');

		await awsProvider.sendEmail(
			'recipient@example.com',
			'Test Subject',
			'<p>Test Body</p>'
		);

		expect(initSpy).toHaveBeenCalled();
	});

	test('sendEmail sends via transporter with correct params', async () => {
		await awsProvider.init();
		const transporter = (awsProvider as any).transporter;

		await awsProvider.sendEmail(
			'recipient@example.com',
			'Test Subject',
			'<p>Test HTML</p>',
			'Test plain text'
		);

		expect(transporter.sendMail).toHaveBeenCalledWith({
			from: 'noreply@example.com',
			to: 'recipient@example.com',
			subject: 'Test Subject',
			html: '<p>Test HTML</p>',
			text: 'Test plain text'
		});
	});

	test('sendEmail returns success on success', async () => {
		const result = await awsProvider.sendEmail(
			'recipient@example.com',
			'Test Subject',
			'<p>Test Body</p>'
		);

		expect(result.success).toBe(true);
		expect(result.message).toBe('Email sent successfully');
	});

	test('sendEmail returns error result on failure', async () => {
		const mockError = new Error('SES send failed');
		await awsProvider.init();
		const transporter = (awsProvider as any).transporter;
		transporter.sendMail.mockRejectedValueOnce(mockError);

		const result = await awsProvider.sendEmail(
			'recipient@example.com',
			'Test Subject',
			'<p>Test Body</p>'
		);

		expect(result.success).toBe(false);
		expect(result.message).toBe('Failed to send email');
		expect(result.details).toBe(mockError);
	});

	test('sendEmail trims whitespace from subject, bodyHtml, and bodyText', async () => {
		await awsProvider.init();
		const transporter = (awsProvider as any).transporter;

		await awsProvider.sendEmail(
			'recipient@example.com',
			'  Test Subject with whitespace  ',
			'  <p>Body with whitespace</p>  ',
			'  Plain text with whitespace  '
		);

		expect(transporter.sendMail).toHaveBeenCalledWith(
			expect.objectContaining({
				subject: 'Test Subject with whitespace',
				html: '<p>Body with whitespace</p>',
				text: 'Plain text with whitespace'
			})
		);
	});

	test('sendEmail handles empty bodyText gracefully', async () => {
		await awsProvider.init();
		const transporter = (awsProvider as any).transporter;

		await awsProvider.sendEmail(
			'recipient@example.com',
			'Subject',
			'<p>HTML Body</p>',
			''
		);

		const callArgs = transporter.sendMail.mock.calls[0][0];
		// Empty string trimmed should not add text field
		expect(callArgs.text).toBeUndefined();
	});
});

describe('createEmailProvider Factory', () => {
	test('creates MockEmailProvider when provider="mock" or by default', () => {
		const provider1 = createEmailProvider({ provider: 'mock' });
		expect(provider1).toBeInstanceOf(MockEmailProvider);
		expect(provider1).toBeInstanceOf(EmailProvider);

		const provider2 = createEmailProvider({});
		expect(provider2).toBeInstanceOf(MockEmailProvider);

		const provider3 = createEmailProvider();
		expect(provider3).toBeInstanceOf(MockEmailProvider);
	});

	test('creates AwsSesProvider when provider="aws-ses"', () => {
		const provider = createEmailProvider({ provider: 'aws-ses' });
		expect(provider).toBeInstanceOf(AwsSesProvider);
		expect(provider).toBeInstanceOf(EmailProvider);
	});

	test('throws error for unknown provider', () => {
		expect(() => {
			createEmailProvider({ provider: 'unknown-provider' });
		}).toThrow('Unknown email provider: unknown-provider');
	});

	test('passes config to created provider', () => {
		const config: EmailProviderConfig = {
			provider: 'mock',
			fromEmail: 'test@example.com',
			region: 'us-west-2'
		};
		const provider = createEmailProvider(config);
		expect((provider as any).config).toEqual(config);
	});
});

describe('sendEmail Convenience Function', () => {
	let consoleLogSpy: any;

	beforeEach(() => {
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
	});

	test('works with mock provider (default) and returns success result', async () => {
		const result = await sendEmail(
			'test@example.com',
			'Subject',
			'<p>Body</p>'
		);

		expect(result).toBeDefined();
		expect(result.success).toBe(true);
		expect(result.message).toBe('Mock email sent successfully');
	});

	test('works with aws-ses provider when specified in config', async () => {
		const result = await sendEmail(
			'test@example.com',
			'Subject',
			'<p>Body</p>',
			'Plain text',
			{
				provider: 'aws-ses',
				region: 'us-east-1',
				fromEmail: 'noreply@example.com'
			}
		);

		expect(result.success).toBe(true);
		expect(result.message).toBe('Email sent successfully');
	});

	test('handles all parameters including optional bodyText and config', async () => {
		const result1 = await sendEmail(
			'recipient@example.com',
			'Test Subject',
			'<p>HTML content</p>',
			'Plain text content',
			{
				provider: 'mock',
				fromEmail: 'sender@example.com'
			}
		);
		expect(result1.success).toBe(true);

		// Test without bodyText
		const result2 = await sendEmail(
			'test@example.com',
			'Subject',
			'<p>HTML only</p>'
		);
		expect(result2.success).toBe(true);
		expect(result2.details.bodyText).toBeUndefined();
	});
});

describe('Integration Tests', () => {
	let consoleLogSpy: any;

	beforeEach(() => {
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
	});

	test('full flow: sendEmail → createEmailProvider → MockEmailProvider → success', async () => {
		const result = await sendEmail(
			'integration@example.com',
			'Integration Test',
			'<h1>Integration Test</h1>',
			'Integration Test',
			{ provider: 'mock', fromEmail: 'test@example.com' }
		);

		expect(result.success).toBe(true);
		expect(result.message).toBe('Mock email sent successfully');
		expect(result.details).toBeDefined();
		expect(result.details.to).toBe('integration@example.com');
		expect(result.details.subject).toBe('Integration Test');
	});

	test('full flow: sendEmail → createEmailProvider → AwsSesProvider → success', async () => {
		const result = await sendEmail(
			'integration@example.com',
			'AWS Integration Test',
			'<h1>AWS Test</h1>',
			'AWS Test',
			{
				provider: 'aws-ses',
				region: 'us-east-1',
				fromEmail: 'noreply@example.com',
				accessKeyId: 'test-key',
				secretAccessKey: 'test-secret'
			}
		);

		expect(result.success).toBe(true);
		expect(result.message).toBe('Email sent successfully');
	});

	test('mock provider accumulates multiple emails', async () => {
		const mockProvider = new MockEmailProvider({ fromEmail: 'test@example.com' });

		await mockProvider.sendEmail('user1@example.com', 'Email 1', '<p>Body 1</p>');
		await mockProvider.sendEmail('user2@example.com', 'Email 2', '<p>Body 2</p>');
		await mockProvider.sendEmail('user3@example.com', 'Email 3', '<p>Body 3</p>');

		const sentEmails = mockProvider.getSentEmails();
		expect(sentEmails).toHaveLength(3);
		expect(sentEmails.map(e => e.to)).toEqual([
			'user1@example.com',
			'user2@example.com',
			'user3@example.com'
		]);
	});

	test('AWS SES provider handles transporter errors', async () => {
		const awsProvider = new AwsSesProvider({
			region: 'us-east-1',
			fromEmail: 'test@example.com'
		});

		await awsProvider.init();
		const transporter = (awsProvider as any).transporter;
		const mockError = new Error('Network error');
		transporter.sendMail.mockRejectedValueOnce(mockError);

		const result = await awsProvider.sendEmail(
			'test@example.com',
			'Subject',
			'<p>Body</p>'
		);

		expect(result.success).toBe(false);
		expect(result.message).toBe('Failed to send email');
		expect(result.details).toBe(mockError);
	});

	test('config passthrough from sendEmail to provider', async () => {
		const config: EmailProviderConfig = {
			provider: 'mock',
			fromEmail: 'configured@example.com',
			region: 'eu-west-1',
			customField: 'custom-value'
		};

		const result = await sendEmail(
			'test@example.com',
			'Config Test',
			'<p>Body</p>',
			undefined,
			config
		);

		expect(result.success).toBe(true);
	});

	test('email formatting with HTML and text', async () => {
		const mockProvider = new MockEmailProvider();

		await mockProvider.sendEmail(
			'test@example.com',
			'Formatted Email',
			'<html><body><h1>Hello</h1><p>This is HTML</p></body></html>',
			'Hello\nThis is plain text'
		);

		const sentEmails = mockProvider.getSentEmails();
		expect(sentEmails[0].bodyHtml).toContain('<h1>Hello</h1>');
		expect(sentEmails[0].bodyText).toContain('plain text');
	});

	test('error handling: unknown provider throws error', () => {
		expect(() => {
			createEmailProvider({ provider: 'nonexistent' });
		}).toThrow('Unknown email provider: nonexistent');
	});

	test('multiple sequential sends work correctly', async () => {
		const mockProvider = new MockEmailProvider();

		for (let i = 1; i <= 5; i++) {
			const result = await mockProvider.sendEmail(
				`user${i}@example.com`,
				`Subject ${i}`,
				`<p>Body ${i}</p>`
			);
			expect(result.success).toBe(true);
		}

		expect(mockProvider.getSentEmails()).toHaveLength(5);
	});
});

describe('Edge Cases & Error Handling', () => {
	let consoleLogSpy: any;

	beforeEach(() => {
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
	});

	test('handles empty subject and body correctly', async () => {
		const mockProvider = new MockEmailProvider();

		// Empty subject
		const result1 = await mockProvider.sendEmail('test@example.com', '', '<p>Body</p>');
		expect(result1.success).toBe(true);
		expect(mockProvider.getSentEmails()[0].subject).toBe('');

		// Empty body
		mockProvider.clearSentEmails();
		const result2 = await mockProvider.sendEmail('test@example.com', 'Subject', '');
		expect(result2.success).toBe(true);
		expect(mockProvider.getSentEmails()[0].bodyHtml).toBe('');

		// AWS SES trims empty bodyHtml/bodyText
		const awsProvider = new AwsSesProvider({
			region: 'us-east-1',
			fromEmail: 'test@example.com'
		});
		await awsProvider.init();
		const transporter = (awsProvider as any).transporter;
		await awsProvider.sendEmail('test@example.com', 'Subject', '   ', '');
		const callArgs = transporter.sendMail.mock.calls[0][0];
		expect(callArgs.html).toBeUndefined();
		expect(callArgs.text).toBeUndefined();
	});

	test('very long email content', async () => {
		const mockProvider = new MockEmailProvider();
		const longContent = '<p>' + 'a'.repeat(100000) + '</p>';
		const longText = 'b'.repeat(100000);

		const result = await mockProvider.sendEmail(
			'test@example.com',
			'Long Content Test',
			longContent,
			longText
		);

		expect(result.success).toBe(true);
		const sentEmails = mockProvider.getSentEmails();
		expect(sentEmails[0].bodyHtml).toHaveLength(longContent.length);
		expect(sentEmails[0].bodyText).toHaveLength(longText.length);
	});

	test('special characters in content', async () => {
		const mockProvider = new MockEmailProvider();
		const specialContent = '<p>Special: &lt;&gt;&amp; "quotes" \'apostrophes\' émojis 🎉</p>';
		const specialText = 'Special: <>&"\'émojis 🎉';

		const result = await mockProvider.sendEmail(
			'test@example.com',
			'Special Characters: <>&"\'🎉',
			specialContent,
			specialText
		);

		expect(result.success).toBe(true);
		const sentEmails = mockProvider.getSentEmails();
		expect(sentEmails[0].subject).toContain('🎉');
		expect(sentEmails[0].bodyHtml).toContain('&lt;&gt;&amp;');
	});

	test('multiple email addresses formats', async () => {
		const mockProvider = new MockEmailProvider();
		const emailFormats = [
			'simple@example.com',
			'user+tag@example.com',
			'user.name@example.co.uk',
			'user_name@sub.domain.example.com'
		];

		for (const email of emailFormats) {
			const result = await mockProvider.sendEmail(email, 'Subject', '<p>Body</p>');
			expect(result.success).toBe(true);
		}

		expect(mockProvider.getSentEmails()).toHaveLength(4);
	});

	test('unicode characters in subject and body', async () => {
		const mockProvider = new MockEmailProvider();
		const unicodeSubject = '测试主题 テスト Тест';
		const unicodeBody = '<p>测试内容 テスト本文 Тестовое содержание</p>';

		const result = await mockProvider.sendEmail(
			'test@example.com',
			unicodeSubject,
			unicodeBody
		);

		expect(result.success).toBe(true);
		const sentEmails = mockProvider.getSentEmails();
		expect(sentEmails[0].subject).toBe(unicodeSubject);
		expect(sentEmails[0].bodyHtml).toBe(unicodeBody);
	});

	test('newlines and whitespace preservation in text body', async () => {
		const mockProvider = new MockEmailProvider();
		const textWithNewlines = 'Line 1\n\nLine 2\n\tIndented\n\nLine 3';

		const result = await mockProvider.sendEmail(
			'test@example.com',
			'Subject',
			'<p>HTML</p>',
			textWithNewlines
		);

		expect(result.success).toBe(true);
		const sentEmails = mockProvider.getSentEmails();
		expect(sentEmails[0].bodyText).toBe(textWithNewlines);
	});

	test('AWS provider handles errors gracefully', async () => {
		const awsProvider = new AwsSesProvider({
			region: 'us-east-1',
			fromEmail: 'test@example.com'
		});

		// Initialize and mock a send failure
		await awsProvider.init();
		const transporter = (awsProvider as any).transporter;
		transporter.sendMail.mockRejectedValueOnce(new Error('Send failed'));

		const result = await awsProvider.sendEmail(
			'test@example.com',
			'Subject',
			'<p>Body</p>'
		);

		// Should return failure result
		expect(result.success).toBe(false);
		expect(result.message).toBe('Failed to send email');
	});

	test('clearSentEmails is idempotent', () => {
		const mockProvider = new MockEmailProvider();

		mockProvider.clearSentEmails();
		expect(mockProvider.getSentEmails()).toHaveLength(0);

		mockProvider.clearSentEmails();
		expect(mockProvider.getSentEmails()).toHaveLength(0);

		mockProvider.clearSentEmails();
		expect(mockProvider.getSentEmails()).toHaveLength(0);
	});

	test('mock provider handles rapid sequential calls', async () => {
		const mockProvider = new MockEmailProvider();

		// Fire off multiple emails rapidly
		const promises = [];
		for (let i = 0; i < 10; i++) {
			promises.push(
				mockProvider.sendEmail(
					`user${i}@example.com`,
					`Subject ${i}`,
					`<p>Body ${i}</p>`
				)
			);
		}

		const results = await Promise.all(promises);

		expect(results.every(r => r.success)).toBe(true);
		expect(mockProvider.getSentEmails()).toHaveLength(10);
	});

	test('AWS provider init is called automatically', async () => {
		const awsProvider = new AwsSesProvider({
			region: 'us-east-1',
			fromEmail: 'test@example.com'
		});

		// Provider should not be initialized yet
		expect((awsProvider as any).initialized).toBe(false);

		// Sending email should trigger init
		const result = await awsProvider.sendEmail(
			'test@example.com',
			'Subject',
			'<p>Body</p>'
		);

		expect(result.success).toBe(true);
		expect((awsProvider as any).initialized).toBe(true);
	});

	test('config with undefined values', () => {
		const config: EmailProviderConfig = {
			provider: 'mock',
			fromEmail: undefined,
			region: undefined
		};

		const provider = createEmailProvider(config);
		expect(provider).toBeInstanceOf(MockEmailProvider);
		expect((provider as any).config).toEqual(config);
	});

	test('extremely long subject line', async () => {
		const mockProvider = new MockEmailProvider();
		const longSubject = 'Subject '.repeat(100);

		const result = await mockProvider.sendEmail(
			'test@example.com',
			longSubject,
			'<p>Body</p>'
		);

		expect(result.success).toBe(true);
		const sentEmails = mockProvider.getSentEmails();
		expect(sentEmails[0].subject).toBe(longSubject);
	});
});

describe('MockEmailProvider Verification Helpers', () => {
	test('getSentEmails returns array reference', async () => {
		const mockProvider = new MockEmailProvider();

		await mockProvider.sendEmail('test1@example.com', 'Subject 1', '<p>Body 1</p>');
		const emails1 = mockProvider.getSentEmails();

		await mockProvider.sendEmail('test2@example.com', 'Subject 2', '<p>Body 2</p>');
		const emails2 = mockProvider.getSentEmails();

		// Both references should show updated count
		expect(emails1).toHaveLength(2);
		expect(emails2).toHaveLength(2);
	});

	test('timestamp increments for sequential emails', async () => {
		const mockProvider = new MockEmailProvider();

		await mockProvider.sendEmail('test1@example.com', 'Subject 1', '<p>Body 1</p>');
		await new Promise(resolve => setTimeout(resolve, 10));
		await mockProvider.sendEmail('test2@example.com', 'Subject 2', '<p>Body 2</p>');

		const emails = mockProvider.getSentEmails();
		expect(emails[1].timestamp.getTime()).toBeGreaterThanOrEqual(
			emails[0].timestamp.getTime()
		);
	});

	test('email details structure matches interface', async () => {
		const mockProvider = new MockEmailProvider();

		await mockProvider.sendEmail(
			'test@example.com',
			'Test Subject',
			'<p>HTML Body</p>',
			'Text Body'
		);

		const emails = mockProvider.getSentEmails();
		const email = emails[0];

		// Verify structure matches MockEmailData interface
		expect(email).toHaveProperty('to');
		expect(email).toHaveProperty('subject');
		expect(email).toHaveProperty('bodyHtml');
		expect(email).toHaveProperty('bodyText');
		expect(email).toHaveProperty('timestamp');
		expect(email.timestamp).toBeInstanceOf(Date);
	});
});

describe('AWS SES Provider Advanced Features', () => {
	test('multiple AWS providers have independent state', () => {
		const provider1 = new AwsSesProvider({
			region: 'us-east-1',
			fromEmail: 'east@example.com'
		});

		const provider2 = new AwsSesProvider({
			region: 'eu-west-1',
			fromEmail: 'west@example.com'
		});

		// Providers should have independent configs
		expect((provider1 as any).config.region).toBe('us-east-1');
		expect((provider2 as any).config.region).toBe('eu-west-1');
		expect((provider1 as any).initialized).toBe(false);
		expect((provider2 as any).initialized).toBe(false);
	});

	test('AWS provider preserves config across multiple sends', async () => {
		const awsProvider = new AwsSesProvider({
			region: 'us-east-1',
			fromEmail: 'noreply@example.com'
		});

		const result1 = await awsProvider.sendEmail('test1@example.com', 'Email 1', '<p>Body 1</p>');
		const result2 = await awsProvider.sendEmail('test2@example.com', 'Email 2', '<p>Body 2</p>');
		const result3 = await awsProvider.sendEmail('test3@example.com', 'Email 3', '<p>Body 3</p>');

		// All should succeed with same config
		expect(result1.success).toBe(true);
		expect(result2.success).toBe(true);
		expect(result3.success).toBe(true);

		// Config should remain unchanged
		expect((awsProvider as any).config.region).toBe('us-east-1');
		expect((awsProvider as any).config.fromEmail).toBe('noreply@example.com');
	});

	test('AWS provider config is accessible', () => {
		const config = {
			region: 'ap-south-1',
			fromEmail: 'india@example.com',
			accessKeyId: 'key',
			secretAccessKey: 'secret'
		};

		const provider = new AwsSesProvider(config);
		expect((provider as any).config).toEqual(config);
	});
});
