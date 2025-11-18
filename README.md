# @goobits/ui

Production-ready UI components for SvelteKit. Secure. Accessible. Done.

[![npm version](https://img.shields.io/npm/v/@goobits/ui.svg)](https://www.npmjs.com/package/@goobits/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1%20AA-green.svg)](./docs/accessibility-testing.md)
[![Accessibility Tests](https://img.shields.io/badge/a11y-axe--core-blue.svg)](./docs/accessibility-testing.md)

> **Important:** This package was previously named `@goobits/forms`. Starting with v2.0.0, it has been renamed to `@goobits/ui` to reflect its expanded scope beyond forms to include modals, menus, tooltips, and other UI components. See [MIGRATION.md](./MIGRATION.md) for upgrade instructions.

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
- **Accessibility** - WCAG 2.1 AA compliant with automated axe-core testing, keyboard navigation, and screen reader support

---

## Quick Start

### Install

```bash
npm install @goobits/ui
```

### Configure

```javascript
// src/hooks.server.js
import { initContactFormConfig } from '@goobits/ui/config';

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
import { createContactApiHandler } from '@goobits/ui/handlers/contactFormHandler';

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
	import { ContactForm } from '@goobits/ui/ui';
	import '@goobits/ui/ui/variables.css';
	import '@goobits/ui/ui/ContactForm.css';
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
- **[Accessibility Testing](./docs/accessibility-testing.md)** - WCAG compliance, axe-core integration, manual testing
- **[Migration](./docs/migration.md)** - Upgrade guides between versions
- **[Troubleshooting](./docs/troubleshooting.md)** - Common issues and solutions

### Examples
- **[Contact Form API Handler](./examples/contact-api/)** - Server-side handler with email delivery

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
} from '@goobits/ui/ui';
```

### UI Components

```javascript
import {
	Input, Textarea, SelectMenu, ToggleSwitch,  // Form inputs
	FormErrors, ThankYou,                        // Status components
	DemoPlayground                               // Interactive demo
} from '@goobits/ui/ui';

import { Menu, ContextMenu, MenuItem, MenuSeparator } from '@goobits/ui/ui';
import { Modal, Alert, Confirm, AppleModal } from '@goobits/ui/ui/modals';
import { tooltip, TooltipPortal } from '@goobits/ui/ui/tooltip';
```

See [API Reference](./docs/api-reference.md) for complete component documentation with props and usage.

---

## Styling

Import base styles and customize with CSS variables:

```javascript
import '@goobits/ui/ui/variables.css';
import '@goobits/ui/ui/ContactForm.css';
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
import { handleFormI18n } from '@goobits/ui/i18n';

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

### Dependencies

All required dependencies install automatically:

```bash
npm install @goobits/ui
```

This includes: @sveltejs/kit, svelte, formsnap, sveltekit-superforms, zod, @lucide/svelte

### Optional Email Service Dependencies

Choose one if you need email delivery:

```bash
npm install nodemailer          # For SMTP (Gmail, SendGrid, etc.)
npm install @aws-sdk/client-ses # For AWS SES
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
- **[npm Package](https://www.npmjs.com/package/@goobits/ui)** - Latest releases

---

**Built with:** [SvelteKit](https://kit.svelte.dev/) • [Zod](https://zod.dev/) • [Formsnap](https://formsnap.dev/) • [Superforms](https://superforms.rocks/)
