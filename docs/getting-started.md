# Getting Started

Build your first form with @goobits/forms in 10 minutes.

**Prerequisites:** SvelteKit project with Node.js ≥18 and pnpm ≥9

---

## Installation

Install the package:

```bash
npm install @goobits/forms
```

All required dependencies (@sveltejs/kit, svelte, formsnap, sveltekit-superforms, zod, @lucide/svelte) install automatically.

**Optional email service** (choose one if you need email delivery):

```bash
npm install nodemailer          # For SMTP (Gmail, SendGrid, etc.)
npm install @aws-sdk/client-ses # For AWS SES
```

---

## Quick Start

Build a basic contact form in 3 steps.

### Step 1: Configure Your Form

Create form configuration:

```javascript
// src/lib/contact-config.js
export const contactConfig = {
	appName: 'My App',
	categories: {
		general: {
			label: 'General Inquiry',
			fields: ['name', 'email', 'message', 'coppa']
		}
	}
};
```

Initialize in your app:

```javascript
// src/hooks.server.js
import { initContactFormConfig } from '@goobits/forms/config';
import { contactConfig } from '$lib/contact-config.js';

initContactFormConfig(contactConfig);

export async function handle({ event, resolve }) {
	return await resolve(event);
}
```

**Available fields:**
- `name` - User's full name
- `email` - Email address
- `phone` - Phone number
- `message` - Message textarea
- `attachments` - File upload
- `coppa` - COPPA compliance checkbox
- `subject` - Subject line
- `category` - Category selector

---

### Step 2: Create API Handler

Create server endpoint to process form submissions:

```javascript
// src/routes/api/contact/+server.js
import { createContactApiHandler } from '@goobits/forms/handlers/contactFormHandler';

export const POST = createContactApiHandler({
	adminEmail: process.env.ADMIN_EMAIL,
	fromEmail: process.env.FROM_EMAIL,
	emailServiceConfig: {
		provider: 'mock' // Use 'mock' for development
	}
});
```

**Environment variables:**
```bash
# .env
ADMIN_EMAIL=admin@example.com
FROM_EMAIL=noreply@example.com
```

---

### Step 3: Add Form to Page

Use the form component:

```svelte
<!-- src/routes/contact/+page.svelte -->
<script>
	import { ContactForm } from '@goobits/forms/ui';
	import '@goobits/forms/ui/variables.css';
	import '@goobits/forms/ui/ContactForm.css';
</script>

<h1>Contact Us</h1>
<ContactForm apiEndpoint="/api/contact" />
```

**Test your form:**
1. Start dev server: `npm run dev`
2. Navigate to `/contact`
3. Fill out and submit form
4. Check browser console for submission log (mock provider)

---

## Adding Security Features

### reCAPTCHA Protection

Protect against bots with Google reCAPTCHA v3.

**1. Get reCAPTCHA keys:**
- Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
- Create new site (choose v3)
- Get site key and secret key

**2. Update configuration:**
```javascript
// src/lib/contact-config.js
export const contactConfig = {
	appName: 'My App',
	categories: { /* ... */ },
	recaptcha: {
		enabled: true,
		provider: 'google-v3',
		siteKey: 'YOUR_RECAPTCHA_SITE_KEY',
		minScore: 0.5 // 0.0 (bot) to 1.0 (human)
	}
};
```

**3. Update API handler:**
```javascript
export const POST = createContactApiHandler({
	adminEmail: process.env.ADMIN_EMAIL,
	fromEmail: process.env.FROM_EMAIL,
	recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY
});
```

**4. Add to environment:**
```bash
# .env
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

---

### CSRF Protection

Protect against cross-site request forgery.

**1. Create CSRF endpoint:**
```javascript
// src/routes/api/csrf/+server.js
import { generateCsrfToken, setCsrfCookie } from '@goobits/forms/security/csrf';

export async function GET({ cookies }) {
	const token = generateCsrfToken();
	setCsrfCookie(cookies, token);

	return new Response(JSON.stringify({ csrfToken: token }), {
		headers: { 'Content-Type': 'application/json' }
	});
}
```

**2. Pass token to form:**
```svelte
<script>
	import { ContactForm } from '@goobits/forms/ui';
	export let data; // From +page.server.js
</script>

<ContactForm
	apiEndpoint="/api/contact"
	csrfToken={data.csrfToken}
/>
```

**3. Generate token on page load:**
```javascript
// src/routes/contact/+page.server.js
import { generateCsrfToken } from '@goobits/forms/security/csrf';

export async function load({ cookies }) {
	const csrfToken = generateCsrfToken();
	return { csrfToken };
}
```

**Note:** Forms auto-fetch CSRF token if not provided, but passing it improves performance.

---

## Email Configuration

### Development (Mock Provider)

For testing without sending real emails:

```javascript
emailServiceConfig: {
	provider: 'mock'
}
```

Submissions log to console instead of sending emails.

---

### Production (Nodemailer SMTP)

Send emails via SMTP (Gmail, SendGrid, Mailgun, etc.):

```javascript
emailServiceConfig: {
	provider: 'nodemailer',
	smtp: {
		host: 'smtp.gmail.com',
		port: 587,
		secure: false,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_APP_PASSWORD // Use app password, not account password
		}
	}
}
```

**Gmail setup:**
1. Enable 2-factor authentication
2. Generate app password: [Google Account > Security > App Passwords](https://myaccount.google.com/apppasswords)
3. Use app password in configuration

**Environment variables:**
```bash
SMTP_USER=your-email@gmail.com
SMTP_APP_PASSWORD=your-app-password
```

---

### Production (AWS SES)

Send emails via Amazon Simple Email Service:

```javascript
emailServiceConfig: {
	provider: 'aws-ses',
	region: 'us-east-1',
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}
```

**AWS SES setup:**
1. Create AWS account
2. Verify sender email in SES console
3. Request production access (starts in sandbox mode)
4. Create IAM user with SES sending permissions
5. Generate access keys

**Environment variables:**
```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

---

## File Uploads

Enable image uploads with validation.

**1. Update configuration:**
```javascript
export const contactConfig = {
	appName: 'My App',
	categories: {
		support: {
			label: 'Technical Support',
			fields: ['name', 'email', 'message', 'attachments']
		}
	},
	fileSettings: {
		maxFileSize: 5 * 1024 * 1024, // 5MB in bytes
		acceptedImageTypes: [
			'image/jpeg',
			'image/png',
			'image/webp',
			'image/gif'
		]
	}
};
```

**2. Handle uploads server-side:**
```javascript
export const POST = createContactApiHandler({
	adminEmail: process.env.ADMIN_EMAIL,
	fromEmail: process.env.FROM_EMAIL,
	customSuccessHandler: async (data) => {
		if (data.attachments) {
			// File is base64-encoded in data.attachments
			// Store in S3, save to disk, or include in email
			console.log('File uploaded:', data.attachments);
		}
		return { message: 'Success!' };
	}
});
```

---

## Styling and Customization

### Import Base Styles

```svelte
<script>
	import '@goobits/forms/ui/variables.css';
	import '@goobits/forms/ui/ContactForm.css';
</script>
```

### Customize with CSS Variables

Override design tokens:

```css
/* app.css or +layout.svelte */
.forms-scope {
	/* Colors */
	--color-primary-500: #3b82f6;
	--color-primary-600: #2563eb;
	--color-error-500: #ef4444;
	--color-success-500: #10b981;

	/* Typography */
	--font-family-base: 'Inter', system-ui, sans-serif;
	--font-size-base: 1rem;

	/* Spacing */
	--spacing-4: 1rem;
	--spacing-6: 1.5rem;

	/* Border radius */
	--border-radius-medium: 0.5rem;
}
```

See [variables.css](../ui/variables.css) for all available customization options.

### Override Component Styles

```css
/* Custom form styling */
.contact-form {
	max-width: 600px;
	margin: 2rem auto;
	padding: 2rem;
	background: white;
	border-radius: 0.5rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.contact-form__submit-button {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

---

## Internationalization

### Quick Message Override

Override specific messages directly:

```svelte
<script>
	import { ContactForm } from '@goobits/forms/ui';

	const customMessages = {
		howCanWeHelp: '¿Cómo podemos ayudarte?',
		sendMessage: 'Enviar mensaje',
		sending: 'Enviando...',
		thankYou: '¡Gracias!',
		messageSent: 'Tu mensaje ha sido enviado.'
	};
</script>

<ContactForm messages={customMessages} />
```

### Full i18n Integration

For complete i18n setup with Paraglide and automatic language detection, see the [main README](../README.md#internationalization).

---

## Multiple Form Categories

Support different form types with category selection:

```javascript
// src/lib/contact-config.js
export const contactConfig = {
	appName: 'My App',
	categories: {
		general: {
			label: 'General Inquiry',
			icon: 'fa fa-envelope',
			fields: ['name', 'email', 'message']
		},
		support: {
			label: 'Technical Support',
			icon: 'fa fa-life-ring',
			fields: ['name', 'email', 'phone', 'message', 'attachments']
		},
		sales: {
			label: 'Sales Inquiry',
			icon: 'fa fa-shopping-cart',
			fields: ['name', 'email', 'phone', 'message', 'company']
		}
	}
};
```

Use CategoryContactForm:
```svelte
<script>
	import { CategoryContactForm } from '@goobits/forms/ui';
</script>

<CategoryContactForm apiEndpoint="/api/contact" />
```

---

## Next Steps

**Add advanced features:**
- [Configuration Guide](./configuration.md) - All configuration options
- [API Reference](./api-reference.md) - Complete component documentation
- [TypeScript Guide](./typescript.md) - Type-safe form development

**Production deployment:**
- [Testing Guide](./testing.md) - Test your forms
- [Migration Guide](./migration.md) - Upgrade between versions

**Need help?**
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
- [Examples](../examples/) - Real-world implementations
- [GitHub Issues](https://github.com/goobits/forms/issues) - Report bugs or ask questions

---

**Quick Reference:**

| Task | Code |
|------|------|
| Install | `npm install @goobits/forms` |
| Configure | `initContactFormConfig(config)` in `hooks.server.js` |
| Create API | `createContactApiHandler()` in `/api/contact/+server.js` |
| Add form | `<ContactForm apiEndpoint="/api/contact" />` |
| Import styles | `import '@goobits/forms/ui/ContactForm.css'` |
| Enable reCAPTCHA | Add `recaptcha: { enabled: true, ... }` to config |
| Enable CSRF | Create `/api/csrf/+server.js` endpoint |
| Customize colors | Override `--color-primary-500` in `.forms-scope` |

---

**Related:** [Configuration](./configuration.md) | [API Reference](./api-reference.md) | [Examples](../examples/)
