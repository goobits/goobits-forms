# @goobits/forms

Production-ready forms for SvelteKit. Secure. Accessible. Done.

[![npm version](https://img.shields.io/npm/v/@goobits/forms.svg)](https://www.npmjs.com/package/@goobits/forms)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

---

## Choose Your Path

**🚀 [Quick Start](#quick-start)** - Ship a contact form in 5 minutes
**📚 [Documentation](#documentation)** - Complete guides and API reference

---

## Key Features

- **Form Types** - Contact, support, feedback, booking forms with category-based routing
- **Schema Validation** - Type-safe validation with Zod v4
- **Bot Protection** - reCAPTCHA v3, rate limiting, CSRF tokens
- **File Uploads** - Image uploads with preview and client-side validation
- **Internationalization** - i18n with Paraglide integration and auto-detection
- **Accessibility** - WCAG 2.1 compliant, tested with NVDA/JAWS/VoiceOver

---

## Quick Start

### Install

```bash
npm install @goobits/forms
```

### Configure

```javascript
// src/hooks.server.js
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

### Create API

```javascript
// src/routes/api/contact/+server.js
import { createContactApiHandler } from '@goobits/forms/handlers/contactFormHandler';

export const POST = createContactApiHandler({
	adminEmail: process.env.ADMIN_EMAIL,
	fromEmail: process.env.FROM_EMAIL,
	emailServiceConfig: { provider: 'mock' } // or 'nodemailer', 'aws-ses'
});
```

### Add Form

```svelte
<!-- src/routes/contact/+page.svelte -->
<script>
	import { ContactForm } from '@goobits/forms/ui';
	import '@goobits/forms/ui/variables.css';
	import '@goobits/forms/ui/ContactForm.css';
</script>

<ContactForm apiEndpoint="/api/contact" />
```

**Done!** Start dev server and visit `/contact`.

---

## 🔒 Security

Build secure forms by validating data server-side. This package provides client-side checks for better UX, but security happens in your API handlers.

**Included protections:**
- CSRF token validation
- Rate limiting (IP-based, configurable)
- reCAPTCHA verification
- Input sanitization helpers
- File upload validation

See [Getting Started Guide](./docs/getting-started.md#security-features) for production deployment.

---

## Documentation

### Getting Started
- **[Installation & Setup](./docs/getting-started.md)** - Complete setup guide with reCAPTCHA, CSRF, and email configuration
- **[Configuration](./docs/configuration.md)** - All configuration options and providers
- **[TypeScript](./docs/typescript.md)** - Type-safe form development

### API Reference
- **[Components](./docs/api-reference.md#form-components)** - ContactForm, FeedbackForm, CategoryContactForm, FormField
- **[UI Components](./docs/api-reference.md#ui-components)** - Modals, Menus, Tooltips, Inputs
- **[Handlers](./docs/api-reference.md#handlers)** - API route handlers and email services
- **[Security](./docs/api-reference.md#utilities)** - CSRF protection, rate limiting

### Guides
- **[Testing](./docs/testing.md)** - Unit tests, E2E tests, mocking strategies
- **[Migration](./docs/migration.md)** - Upgrade guides between versions
- **[Troubleshooting](./docs/troubleshooting.md)** - Common issues and solutions

### Examples
- **[Basic Contact Form](./examples/contact-api/)** - Simple contact form with email delivery
- **[File Upload](./examples/file-upload/)** - Image uploads with validation (coming soon)
- **[i18n Integration](./examples/i18n-paraglide/)** - Paraglide internationalization (coming soon)
- **[Custom Validation](./examples/custom-validation/)** - Extend validation logic (coming soon)
- **[Production Deployment](./examples/production-deployment/)** - Full production setup (coming soon)

---

## Component Overview

### Form Components

```javascript
import {
	ContactForm,          // Main form with validation
	CategoryContactForm,  // Form with category selection
	ContactFormPage,      // Complete page layout
	FeedbackForm,         // Quick feedback widget
	FormField,            // Reusable field component
	UploadImage           // File upload with preview
} from '@goobits/forms/ui';
```

### UI Components

```javascript
import {
	Input, Textarea, SelectMenu, ToggleSwitch,  // Form inputs
	FormErrors, ThankYou,                        // Status components
	DemoPlayground                               // Interactive demo
} from '@goobits/forms/ui';

import { Menu, ContextMenu, MenuItem, MenuSeparator } from '@goobits/forms/ui';
import { Modal, Alert, Confirm, AppleModal } from '@goobits/forms/ui/modals';
import { tooltip, TooltipPortal } from '@goobits/forms/ui/tooltip';
```

See [API Reference](./docs/api-reference.md) for complete component documentation with props and usage.

---

## Styling

Import base styles and customize with CSS variables:

```javascript
import '@goobits/forms/ui/variables.css';
import '@goobits/forms/ui/ContactForm.css';
```

```css
.forms-scope {
	--color-primary-500: #3b82f6;
	--color-error-500: #ef4444;
	--font-family-base: 'Inter', system-ui, sans-serif;
	--border-radius-medium: 0.5rem;
}
```

See [variables.css](./ui/variables.css) for all customization options.

---

## Email Configuration

### Development

```javascript
emailServiceConfig: { provider: 'mock' }
```

### Production (Nodemailer)

```javascript
emailServiceConfig: {
	provider: 'nodemailer',
	smtp: {
		host: 'smtp.gmail.com',
		port: 587,
		secure: false,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_APP_PASSWORD
		}
	}
}
```

### Production (AWS SES)

```javascript
emailServiceConfig: {
	provider: 'aws-ses',
	region: 'us-east-1',
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}
```

See [Getting Started Guide](./docs/getting-started.md#email-configuration) for complete setup instructions.

---

## Internationalization

### Quick Override

```svelte
<script>
	const messages = {
		howCanWeHelp: '¿Cómo podemos ayudarte?',
		sendMessage: 'Enviar mensaje',
		sending: 'Enviando...'
	};
</script>

<ContactForm {messages} />
```

### Auto-Detection

```javascript
// hooks.server.js
import { handleFormI18n } from '@goobits/forms/i18n';

export async function handle({ event, resolve }) {
	await handleFormI18n(event);
	return await resolve(event);
}
```

See [Getting Started Guide](./docs/getting-started.md#internationalization) for Paraglide integration.

---

## Requirements

- **Node.js** ≥18.0.0
- **pnpm** ≥9.0.0 (or npm/yarn)
- **SvelteKit** project

### Peer Dependencies

```bash
npm install @sveltejs/kit svelte formsnap sveltekit-superforms zod
```

### Optional Dependencies

```bash
# For email delivery
npm install nodemailer          # SMTP
npm install @aws-sdk/client-ses # AWS SES

# For UI icons
npm install @lucide/svelte
```

---

## License

MIT - see [LICENSE](./LICENSE) for details

---

## Links

- **[Documentation](./docs/)** - Complete guides and API reference
- **[Examples](./examples/)** - Real-world implementations
- **[Changelog](./CHANGELOG.md)** - Version history and migration guides
- **[GitHub Issues](https://github.com/goobits/forms/issues)** - Report bugs or request features
- **[npm Package](https://www.npmjs.com/package/@goobits/forms)** - Latest releases

---

**Built with:** [SvelteKit](https://kit.svelte.dev/) • [Zod](https://zod.dev/) • [Formsnap](https://formsnap.dev/) • [Superforms](https://superforms.rocks/)
