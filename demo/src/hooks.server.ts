import { initContactFormConfig } from '@goobits/forms/config';

initContactFormConfig({
	appName: '@goobits/forms Demo',
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
