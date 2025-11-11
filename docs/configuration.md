# Configuration Guide

Reference for configuring @goobits/forms.

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

**Design Philosophy: Category-Based Fields**
Fields are organized by category rather than hardcoded per component. This approach enables:
- **Flexibility:** Add new form types without changing component code
- **Reusability:** Same `ContactForm` component serves multiple purposes (support, sales, general)
- **Dynamic rendering:** Switch fields based on user selection in `CategoryContactForm`
- **Validation consistency:** Single schema definition prevents frontend/backend mismatch

### Available Fields

Complete reference for all built-in form fields:

| Field | Type | Description | Validation | Default Placeholder |
|-------|------|-------------|------------|---------------------|
| `name` | `text` | User's full name | Required, max 100 chars | "Your name" |
| `email` | `email` | Email address | Required, valid email, max 254 chars | "your@email.com" |
| `message` | `textarea` | Message content | Required, max 5000 chars | "Tell us more..." |
| `phone` | `tel` | Phone number | Required | "+1 (555) 123-4567" |
| `company` | `text` | Company name | Required | "Your company name" |
| `businessRole` | `text` | Role in company | Required | "Your role" |
| `preferredDate` | `date` | Preferred date | Required | - |
| `preferredTime` | `time` | Preferred time | Required | - |
| `browser` | `text` | Browser name | Required | "Chrome, Firefox, Safari, etc." |
| `browserVersion` | `text` | Browser version | Required | "e.g., 91.0" |
| `operatingSystem` | `text` | Operating system | Required | "Windows 10, macOS, etc." |
| `attachments` | `file` | Image upload (up to 3) | Optional, 5MB max per file | - |
| `coppa` | `checkbox` | COPPA compliance | Required | - |

**Usage Notes:**
- All fields except `attachments` are required by default
- Fields can be customized by overriding defaults in `initContactFormConfig()`
- Custom fields can be added using the same pattern

---

## reCAPTCHA

Protect forms from bots.

```javascript
recaptcha: {
	enabled: false, // Default: disabled
	provider: 'google-v3', // Default: 'google-v3'
	siteKey: '', // Required when enabled
	minScore: 0.5 // Default: 0.5 (v3 only, range: 0.0-1.0)
}
```

**Defaults:**
- `enabled`: `false`
- `provider`: `'google-v3'`
- `minScore`: `0.5`

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
	maxFileSize: 5 * 1024 * 1024, // Default: 5MB in bytes
	acceptedImageTypes: [ // Default: common image formats
		'image/jpeg',
		'image/jpg',
		'image/png',
		'image/webp',
		'image/gif',
		'application/pdf' // Optional: allow PDFs
	]
}
```

**Defaults:**
- `maxFileSize`: `5242880` (5MB)
- `acceptedImageTypes`: `['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']`

**Technical Details:**
- File validation happens client-side before upload
- Large files (>10MB) may impact form performance
- MIME type validation prevents malicious uploads
- Rejected files trigger validation errors without submission

---

## UI Configuration

Customize form UI text and behavior.

```javascript
ui: {
	submitButtonText: 'Send Message', // Default
	submittingButtonText: 'Sending...', // Default
	resetAfterSubmit: true, // Default
	showSuccessMessage: true, // Default
	successMessageDuration: 5000 // Default: 5000ms (5 seconds)
}
```

**Defaults:**
- `submitButtonText`: `'Send Message'`
- `submittingButtonText`: `'Sending...'`
- `resetAfterSubmit`: `true`
- `showSuccessMessage`: `true`
- `successMessageDuration`: `5000` (5 seconds)

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
	rateLimitMaxRequests: 3, // Default: 3 requests
	rateLimitWindowMs: 3600000, // Default: 3600000ms (1 hour)

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
			return { phone: 'Invalid phone number' };
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

**Technical Details:**

**Rate Limiting:**
- Uses in-memory IP-based tracking (resets on server restart)
- Default: 3 requests per 3600 seconds (1 hour) per IP
- Returns HTTP 429 with `retryAfter` header when exceeded
- Edge case: Multiple users behind same NAT may share limit

**reCAPTCHA:**
- `minScore` range: 0.0 (bot) to 1.0 (human)
- Default: 0.5 (balanced security/UX)
- Lower scores (0.3-0.4) reduce false positives but increase bot risk
- Higher scores (0.6-0.8) increase security but may block legitimate users
- Performance: Adds ~200ms latency on first load (cached after)

**Defaults Summary:**
- `rateLimitMaxRequests`: `3`
- `rateLimitWindowMs`: `3600000` (1 hour)
- `recaptchaMinScore`: `0.5`
- `logSubmissions`: `true`

---

## Email Service Providers

### Choosing an Email Provider

| Provider | Best For | Setup Time | Monthly Cost | Deliverability | Complexity |
|----------|----------|------------|--------------|----------------|------------|
| **Mock** | Development, testing | 1 min | Free | N/A (doesn't send) | ⭐ (minimal) |
| **Nodemailer (Gmail)** | Personal projects, MVPs | 10 min | Free (100/day limit) | Good (95-98%) | ⭐⭐ (low) |
| **Nodemailer (SendGrid)** | Growing startups | 15 min | $15-80/mo | Excellent (99%+) | ⭐⭐⭐ (medium) |
| **AWS SES** | Production, high-volume | 30 min | $0.10/1000 emails | Excellent (99%+) | ⭐⭐⭐⭐ (high) |

**Decision Guide:**
- 🧪 **Testing?** → Mock (logs to console, no external dependencies)
- 🏠 **Personal project or MVP?** → Gmail SMTP (free, quick setup)
- 🚀 **Growing startup (1K-10K emails/day)?** → SendGrid or Mailgun (reliable delivery, support)
- 🏢 **Enterprise (>10K emails/day)?** → AWS SES (scales, lowest cost per email)

**Pattern Explained: Provider Abstraction**
Email services are pluggable via the provider pattern. This design enables:
- **Vendor independence:** Switch from Nodemailer to AWS SES without changing form code
- **Testing:** Mock provider enables testing without external dependencies or email quotas
- **Progressive enhancement:** Start with mock in development, upgrade to production provider when ready
- **Cost optimization:** Choose provider based on volume (Gmail free → SendGrid mid-tier → AWS SES high-volume)

---

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

## Example

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

**See also:**
- [Getting Started](./getting-started.md) - Basic setup
- [API Reference](./api-reference.md) - Component props
- [TypeScript Guide](./typescript.md) - Type definitions
