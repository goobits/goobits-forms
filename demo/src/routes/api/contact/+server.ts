import { dev } from '$app/environment';
import { createContactApiHandler } from '@goobits/ui/handlers/contactFormHandler';

const csrfSecret = process.env.FORMS_DEMO_CSRF_SECRET
	?? (dev ? 'forms-demo-contact-csrf-local-development-only' : undefined);
if (!csrfSecret) {
	throw new Error('FORMS_DEMO_CSRF_SECRET is required outside development');
}

export const POST = createContactApiHandler({
	csrfSecret,
	adminEmail: 'demo@example.com',
	fromEmail: 'noreply@demo.com',
	emailServiceConfig: {
		provider: 'mock' // Use mock provider for demo (logs to console)
	},
	rateLimitMaxRequests: 10,
	rateLimitWindowMs: 60000
});
