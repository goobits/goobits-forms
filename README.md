# @goobits/forms

Production-ready forms for SvelteKit. Secure. Accessible. Done.

**Jump to**: [Quick Start](#quick-start) | [Configuration](#configuration) | [Components](#components) | [Internationalization](#internationalization) | [Examples](./examples)

## Key Features

- **Form Types** - Contact, support, feedback, booking, and business forms
- **Schema Validation** - Zod validation with type safety
- **Bot Protection** - reCAPTCHA v3 integration
- **File Uploads** - Image uploads with preview and validation
- **Internationalization** - i18n support with Paraglide integration
- **Accessibility** - WCAG 2.1 compliant with ARIA support

## 🔒 Security Notice

Implement server-side validation and sanitization. This package's client-side checks enhance UX but don't provide security.

## Quick Start

```bash
# Install package and dependencies
npm install @goobits/forms @sveltejs/kit svelte formsnap @lucide/svelte sveltekit-superforms zod clsx tailwind-merge
```

```js
// src/lib/contact-config.js - Configure form categories
export const contactConfig = {
	appName: 'My App',
	categories: {
		general: {
			label: 'General Inquiry',
			fields: ['name', 'email', 'message', 'coppa']
		},
		support: {
			label: 'Technical Support',
			fields: ['name', 'email', 'phone', 'message', 'attachments']
		}
	}
};
```

```js
// src/app.js - Initialize configuration
import { initContactFormConfig } from '@goobits/forms/config';
import { contactConfig } from '$lib/contact-config.js';

initContactFormConfig(contactConfig);
```

```svelte
<!-- src/routes/contact/+page.svelte - Basic usage -->
<script>
	import { ContactForm } from '@goobits/forms';
	export let data;
</script>

<h1>Contact Us</h1>
<ContactForm apiEndpoint="/api/contact" />
```

## Configuration

### Architecture

| Directory | Purpose |
|-----------|---------|
| `config/` | Form configurations and validation schemas |
| `handlers/` | Server-side form processing logic |
| `i18n/` | Internationalization and locale management |
| `security/` | CSRF protection and security features |
| `services/` | Email delivery, rate limiting, reCAPTCHA |
| `ui/` | Svelte components and form interfaces |
| `utils/` | Sanitization, logging, error handling |
| `validation/` | Zod schemas for type-safe validation |

### Minimal Configuration

```js
// src/lib/contact-config.js
export const contactConfig = {
	appName: 'My App',
	categories: {
		general: {
			label: 'General Inquiry',
			fields: ['name', 'email', 'message']
		}
	}
};
```

### With reCAPTCHA

```js
export const contactConfig = {
	appName: 'My App',
	categories: {
		general: { label: 'General Inquiry', fields: ['name', 'email', 'message'] }
	},
	recaptcha: {
		enabled: true,
		provider: 'google-v3',
		siteKey: 'YOUR_RECAPTCHA_SITE_KEY',
		minScore: 0.5
	}
};
```

### Complete Configuration

```js
// All available options
const contactConfig = {
	appName: 'My App',

	// UI customization
	ui: {
		submitButtonText: 'Send Message',
		submittingButtonText: 'Sending...',
		resetAfterSubmit: true,
		showSuccessMessage: true
	},

	// reCAPTCHA integration
	recaptcha: {
		enabled: true,
		provider: 'google-v3',
		siteKey: 'YOUR_RECAPTCHA_SITE_KEY',
		minScore: 0.5
	},

	// File upload settings
	uploads: {
		enabled: true,
		maxSize: '5MB',
		allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
	}
};
```

## Internationalization

### Quick Override

```svelte
<!-- Direct message prop override -->
<script>
	import { ContactForm } from '@goobits/forms';

	const messages = {
		howCanWeHelp: 'Comment pouvons-nous vous aider?',
		sendMessage: 'Envoyer le message',
		sending: 'Envoi en cours...'
	};
</script>

<ContactForm {messages} />
```

### Auto-Detection

```js
// hooks.server.js - Automatic language detection
import { handleFormI18n } from '@goobits/forms/i18n'

export async function handle({ event, resolve }) {
  await handleFormI18n(event) // Adds language info to event.locals
  return await resolve(event)
}
```

### Data Loading

```js
// contact/+page.server.js - Enhanced page loading
import { loadWithFormI18n } from '@goobits/forms/i18n'

export const load = async (event) => {
  return await loadWithFormI18n(event, async () => {
    return { formData, categories } // Your existing data
  })
}
```

### Framework Integration

```js
// Seamless Paraglide integration
import { createMessageGetter } from '@goobits/forms/i18n';
import * as m from '$paraglide/messages';

const getMessage = createMessageGetter({
	howCanWeHelp: m.howCanWeHelp,
	sendMessage: m.sendMessage,
	sending: m.sending
});
```

## Components

### Form Components

```svelte
<script>
	import {
		ContactForm,        // Main form with validation
		CategoryContactForm, // Form with category selection
		ContactFormPage,    // Complete page layout
		FeedbackForm,       // Quick feedback widget
		FormField,          // Reusable field component
		FormErrors,         // Error display
		ThankYou,           // Success message
		UploadImage         // File upload with preview
	} from '@goobits/forms/ui';
</script>
```

**ContactForm vs CategoryContactForm**: Use `ContactForm` for single-purpose forms. Use `CategoryContactForm` when users need to select from multiple form types (general inquiry, support, feedback).

### UI Components

```svelte
<script>
	// Modal system
	import { Modal, Alert, Confirm, AppleModal } from '@goobits/forms/ui/modals';

	// Menu components
	import { Menu, ContextMenu, MenuItem, MenuSeparator } from '@goobits/forms/ui/menu';

	// Utility components
	import { Tooltip, Portal } from '@goobits/forms/ui';
</script>
```

### Interactive Demo

Use the `DemoPlayground` component to create an interactive demonstration of all form components:

```svelte
<script>
	import { DemoPlayground } from '@goobits/forms/ui';
	import '@goobits/forms/ui/variables.css';
	import '@goobits/forms/ui/DemoPlayground.css';

	// Your external components (optional)
	import { ToggleSwitch, SelectMenu } from '$lib/components/ui';

	const contactConfig = {
		appName: 'My App',
		categories: {
			general: { label: 'General Inquiry', fields: ['name', 'email', 'message'] }
		}
	};
</script>

<DemoPlayground
	config={contactConfig}
	apiEndpoints={{
		contact: '/api/contact',
		feedback: '/api/feedback'
	}}
	externalComponents={{
		ToggleSwitch,
		SelectMenu
	}}
/>
```

## Styling

Import base styles and customize with CSS variables:

```js
import '@goobits/forms/ui/variables.css';
import '@goobits/forms/ui/ContactForm.css';
```

**Key customization variables:**

```css
.forms-scope {
  --color-primary-500: #2563eb;
  --color-error-500: #ef4444;
  --color-success-500: #10b981;
  --border-radius-medium: 0.375rem;
  --font-family-base: system-ui, sans-serif;
}
```

**Override component styles:**

```css
.contact-form {
	max-width: 600px;
	margin: 0 auto;
}
```

See [variables.css](./ui/variables.css) for all available customization options.

## Accessibility

Built accessible. Tested with NVDA, JAWS, VoiceOver.

Includes semantic HTML, ARIA labels, keyboard navigation, and screen reader announcements.

## License

MIT - see [LICENSE](LICENSE) for details

---

**Resources**: [Examples](./examples) | [Changelog](./CHANGELOG.md) | [Issues](https://github.com/goobits/forms/issues)
