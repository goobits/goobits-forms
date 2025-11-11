import { createContactApiHandler } from '@goobits/forms/handlers/contactFormHandler';

export const POST = createContactApiHandler({
	adminEmail: 'demo@example.com',
	fromEmail: 'noreply@demo.com',
	emailServiceConfig: {
		provider: 'mock' // Use mock provider for demo (logs to console)
	},
	rateLimitMaxRequests: 10,
	rateLimitWindowMs: 60000
});
