# @goobits/forms

Production-ready forms for SvelteKit with validation, security, and email delivery.

[![npm version](https://img.shields.io/npm/v/@goobits/forms.svg)](https://www.npmjs.com/package/@goobits/forms)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

---

## Key Features

- **Form Types** - Contact, support, feedback, and booking forms with category routing
- **Schema Validation** - Type-safe validation with Zod
- **Bot Protection** - reCAPTCHA v3, rate limiting, CSRF tokens
- **File Uploads** - Image uploads with preview and validation
- **Internationalization** - i18n with Paraglide and auto-detection
- **Accessibility** - WCAG 2.1 compliant, screen reader tested

---

## Quick Start

```bash
# Install package (includes all peer dependencies)
npm install @goobits/forms

# Optional: Email services
npm install nodemailer          # SMTP
npm install @aws-sdk/client-ses # AWS SES
```

```javascript
// src/hooks.server.js - Configure forms
import { initContactFormConfig } from '@goobits/forms/config';

initContactFormConfig({
	appName: 'My App',
	categories: {
		general: {
			label: 'General Inquiry',
			fields: ['name', 'email', 'message']
		}
	}
});
```

```javascript
// src/routes/api/contact/+server.js - Create API handler
import { createContactApiHandler } from '@goobits/forms/handlers/contactFormHandler';

export const POST = createContactApiHandler({
	adminEmail: process.env.ADMIN_EMAIL,
	fromEmail: process.env.FROM_EMAIL,
	emailServiceConfig: {
		provider: 'mock' // Development
		// provider: 'nodemailer' // Production SMTP
		// provider: 'aws-ses'    // Production AWS
	}
});
```

```svelte
<!-- src/routes/contact/+page.svelte - Add form to page -->
<script>
	import { ContactForm } from '@goobits/forms/ui';
	import '@goobits/forms/ui/variables.css';
	import '@goobits/forms/ui/ContactForm.css';
</script>

<ContactForm apiEndpoint="/api/contact" />
```

---

## Configuration

```javascript
// Customize form fields and categories
initContactFormConfig({
	categories: {
		support: {
			label: 'Technical Support',
			fields: ['name', 'email', 'browser', 'message']
		},
		business: {
			label: 'Business Inquiry',
			fields: ['name', 'email', 'company', 'message']
		}
	},

	// File upload settings
	fileSettings: {
		maxFileSize: 5 * 1024 * 1024, // 5MB
		acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
	},

	// reCAPTCHA protection
	recaptcha: {
		enabled: true,
		siteKey: process.env.RECAPTCHA_SITE_KEY,
		minScore: 0.5 // 0.0 (bot) to 1.0 (human)
	}
});
```

---

## Components

```javascript
// Form components
import {
	ContactForm,          // Main form with validation
	CategoryContactForm,  // Form with category selection
	ContactFormPage,      // Complete page layout
	FeedbackForm,         // Feedback widget
	FormField,            // Reusable field
	UploadImage           // File upload with preview
} from '@goobits/forms/ui';

// UI components
import {
	Input, Textarea, SelectMenu, ToggleSwitch,
	FormErrors, ThankYou
} from '@goobits/forms/ui';

// Advanced UI
import { Menu, MenuItem, MenuSeparator } from '@goobits/forms/ui';
import { Modal, Alert, Confirm } from '@goobits/forms/ui/modals';
import { tooltip, TooltipPortal } from '@goobits/forms/ui/tooltip';
```

---

## Styling

```javascript
// Import base styles
import '@goobits/forms/ui/variables.css';
import '@goobits/forms/ui/ContactForm.css';
```

```css
/* Customize with CSS variables */
.forms-scope {
	--color-primary-500: #3b82f6;
	--color-error-500: #ef4444;
	--font-family-base: 'Inter', system-ui, sans-serif;
	--border-radius-medium: 0.5rem;
}
```

See [variables.css](https://github.com/goobits/forms/blob/main/ui/variables.css) for all customization options.

---

## Email Providers

```javascript
// Development - Console logging
emailServiceConfig: {
	provider: 'mock'
}

// Production - Nodemailer (SMTP)
emailServiceConfig: {
	provider: 'nodemailer',
	smtp: {
		host: 'smtp.gmail.com',
		port: 587,
		secure: false, // true for port 465
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_APP_PASSWORD
		}
	}
}

// Production - AWS SES
emailServiceConfig: {
	provider: 'aws-ses',
	region: 'us-east-1',
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}
```

---

## Internationalization

```svelte
<script>
	// Quick override
	const messages = {
		howCanWeHelp: '¿Cómo podemos ayudarte?',
		sendMessage: 'Enviar mensaje',
		sending: 'Enviando...'
	};
</script>

<ContactForm {messages} />
```

```javascript
// Auto-detection in hooks.server.js
import { handleFormI18n } from '@goobits/forms/i18n';

export async function handle({ event, resolve }) {
	await handleFormI18n(event); // Detects from URL, session, browser
	return await resolve(event);
}
```

See [Getting Started Guide](./docs/getting-started.md#internationalization) for Paraglide integration.

---

## Security

```javascript
// Built-in protections
createContactApiHandler({
	// Rate limiting (IP-based)
	rateLimitMaxRequests: 3,     // Requests per window
	rateLimitWindowMs: 3600000,  // 1 hour window

	// reCAPTCHA verification
	recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,
	recaptchaMinScore: 0.5,

	// Custom validation
	customValidation: (data) => {
		if (data.phone && !isValidPhone(data.phone)) {
			return { phone: ['Invalid phone number'] };
		}
		return null;
	}
});
```

```javascript
// CSRF protection in routes/api/csrf/+server.js
import { setCsrfCookie } from '@goobits/forms/security/csrf';

export async function GET(event) {
	const token = setCsrfCookie(event);
	return new Response(JSON.stringify({ csrfToken: token }), {
		headers: { 'Content-Type': 'application/json' }
	});
}
```

---

## Documentation

**Getting Started:**
- [Installation & Setup](./docs/getting-started.md) - Complete guide with security and email
- [Configuration](./docs/configuration.md) - All options and providers
- [TypeScript](./docs/typescript.md) - Type-safe development

**Reference:**
- [API Reference](./docs/api-reference.md) - Components, props, handlers
- [Testing Guide](./docs/testing.md) - Unit and E2E testing
- [Troubleshooting](./docs/troubleshooting.md) - Common issues

**Examples:**
- [Contact API Handler](./examples/) - Server-side handler with email delivery

---

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test                 # All tests
pnpm test:unit            # Unit tests only
pnpm test:integration     # Integration tests

# Code quality
pnpm lint                 # ESLint
pnpm format               # Prettier

# Validation
pnpm validate:exports     # Verify package exports
pnpm validate:links       # Check documentation links
```

---

## License

MIT - see [LICENSE](./LICENSE) for details

---

## Support

- **[Documentation](./docs/)** - Guides and API reference
- **[GitHub Issues](https://github.com/goobits/forms/issues)** - Bug reports and feature requests
- **[Changelog](./CHANGELOG.md)** - Version history and migration guides
- **[npm Package](https://www.npmjs.com/package/@goobits/forms)** - Latest releases

---

**Built with:** [SvelteKit](https://kit.svelte.dev/) • [Zod](https://zod.dev/) • [Formsnap](https://formsnap.dev/) • [Superforms](https://superforms.rocks/)
