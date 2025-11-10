# Configuration Guide

Complete reference for configuring @goobits/forms.

---

## Contact Form Configuration

### Basic Structure

```typescript
interface ContactConfig {
	appName: string;
	categories: Record<string, CategoryConfig>;
	recaptcha?: RecaptchaConfig;
	fileSettings?: FileSettings;
	ui?: UIConfig;
}
```

---

## Categories

Define form types and their fields.

```javascript
categories: {
	general: {
		label: 'General Inquiry',
		icon: 'fa fa-envelope', // Optional icon class
		fields: ['name', 'email', 'message', 'coppa']
	},
	support: {
		label: 'Technical Support',
		icon: 'fa fa-life-ring',
		fields: ['name', 'email', 'phone', 'message', 'attachments']
	}
}
```

### Available Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | Text | User's full name |
| `email` | Email | Email address |
| `phone` | Tel | Phone number |
| `message` | Textarea | Message content |
| `subject` | Text | Email subject |
| `company` | Text | Company name |
| `attachments` | File | Image upload |
| `coppa` | Checkbox | COPPA compliance |
| `category` | Select | Category selector |

---

## reCAPTCHA

Protect forms from bots.

```javascript
recaptcha: {
	enabled: true,
	provider: 'google-v3', // or 'hcaptcha', 'turnstile'
	siteKey: 'YOUR_SITE_KEY',
	minScore: 0.5 // 0.0-1.0 (v3 only)
}
```

**Score Guidelines:**
- `0.9-1.0` - Very likely human
- `0.7-0.8` - Likely human
- `0.5-0.6` - Neutral (recommended threshold)
- `0.3-0.4` - Possibly bot
- `0.0-0.2` - Very likely bot

---

## File Upload Settings

Configure file uploads and validation.

```javascript
fileSettings: {
	maxFileSize: 5 * 1024 * 1024, // 5MB in bytes
	acceptedImageTypes: [
		'image/jpeg',
		'image/jpg',
		'image/png',
		'image/webp',
		'image/gif',
		'application/pdf' // Optional: allow PDFs
	]
}
```

**Size Limits:**
- `1MB` = `1024 * 1024`
- `5MB` = `5 * 1024 * 1024`
- `10MB` = `10 * 1024 * 1024`

---

## UI Configuration

Customize form UI text and behavior.

```javascript
ui: {
	submitButtonText: 'Send Message',
	submittingButtonText: 'Sending...',
	resetAfterSubmit: true,
	showSuccessMessage: true,
	successMessageDuration: 5000 // milliseconds
}
```

---

## API Handler Configuration

Server-side handler options.

```javascript
createContactApiHandler({
	// Required
	adminEmail: 'admin@example.com',
	fromEmail: 'noreply@example.com',

	// Email Service
	emailServiceConfig: {
		provider: 'mock', // or 'nodemailer', 'aws-ses'
		// ... provider-specific config
	},

	// Security
	recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,
	recaptchaMinScore: 0.5,

	// Rate Limiting
	rateLimitMaxRequests: 5,
	rateLimitWindowMs: 60000, // 1 minute

	// Messages
	successMessage: 'Thank you for your message!',
	errorMessage: 'Something went wrong. Please try again.',
	rateLimitMessage: 'Too many requests. Please wait.',

	// Logging
	logSubmissions: true,

	// Custom Handlers
	customValidation: (data) => {
		// Return errors object or null
		if (data.phone && !isValidPhone(data.phone)) {
			return { phone: ['Invalid phone number'] };
		}
		return null;
	},

	customSuccessHandler: async (data, clientAddress) => {
		// Process form data
		await database.insert(data);
		return { message: 'Success!', id: data.id };
	}
});
```

---

## Email Service Providers

### Mock (Development)

```javascript
emailServiceConfig: {
	provider: 'mock'
}
```

Logs to console, doesn't send emails.

---

### Nodemailer (SMTP)

```javascript
emailServiceConfig: {
	provider: 'nodemailer',
	smtp: {
		host: 'smtp.gmail.com',
		port: 587,
		secure: false, // true for port 465
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASSWORD
		}
	}
}
```

**Popular SMTP Providers:**

| Provider | Host | Port | Secure |
|----------|------|------|--------|
| Gmail | `smtp.gmail.com` | 587 | false |
| SendGrid | `smtp.sendgrid.net` | 587 | false |
| Mailgun | `smtp.mailgun.org` | 587 | false |
| Postmark | `smtp.postmarkapp.com` | 587 | false |

---

### AWS SES

```javascript
emailServiceConfig: {
	provider: 'aws-ses',
	region: 'us-east-1',
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	apiVersion: 'latest' // optional
}
```

---

## Complete Example

```javascript
// src/lib/contact-config.js
export const contactConfig = {
	appName: 'Acme Corp',

	categories: {
		general: {
			label: 'General Inquiry',
			icon: 'fa fa-envelope',
			fields: ['name', 'email', 'message', 'coppa']
		},
		support: {
			label: 'Technical Support',
			icon: 'fa fa-life-ring',
			fields: ['name', 'email', 'phone', 'message', 'attachments']
		},
		sales: {
			label: 'Sales Inquiry',
			icon: 'fa fa-shopping-cart',
			fields: ['name', 'email', 'phone', 'company', 'message']
		}
	},

	recaptcha: {
		enabled: true,
		provider: 'google-v3',
		siteKey: process.env.PUBLIC_RECAPTCHA_SITE_KEY,
		minScore: 0.5
	},

	fileSettings: {
		maxFileSize: 5 * 1024 * 1024,
		acceptedImageTypes: [
			'image/jpeg',
			'image/png',
			'image/webp'
		]
	},

	ui: {
		submitButtonText: 'Send Message',
		submittingButtonText: 'Sending...',
		resetAfterSubmit: true,
		showSuccessMessage: true
	}
};

// Initialize in hooks.server.js
import { initContactFormConfig } from '@goobits/forms/config';
import { contactConfig } from '$lib/contact-config.js';

initContactFormConfig(contactConfig);
```

---

## Environment Variables

Recommended `.env` structure:

```bash
# Application
PUBLIC_APP_NAME=My App

# Email
ADMIN_EMAIL=admin@example.com
FROM_EMAIL=noreply@example.com

# reCAPTCHA
PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key

# Email Service (choose one)
# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# AWS SES
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

---

**Related:** [Getting Started](./getting-started.md) | [API Reference](./api-reference.md) | [Troubleshooting](./troubleshooting.md)
