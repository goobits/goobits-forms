import { initContactFormConfig } from '@goobits/ui/config';

initContactFormConfig({
	appName: '@goobits/ui Demo',
	categories: {
		general: {
			label: 'General Inquiry',
			fields: ['name', 'email', 'message', 'coppa']
		}
	}
});

export async function handle({ event, resolve }) {
	return await resolve(event);
}
