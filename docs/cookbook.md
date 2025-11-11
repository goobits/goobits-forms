# Cookbook

Practical recipes for common form scenarios. Each recipe includes complete, copy-paste-ready code.

## TOC

**Recipe Index:**
- [Recipe 1: Simple Contact Form (5 min)](#recipe-1-simple-contact-form)
- [Recipe 2: Production-Ready Form (15 min)](#recipe-2-production-ready-form)
- [Recipe 3: Multi-Category Form (10 min)](#recipe-3-multi-category-form)
- [Recipe 4: Form with File Upload (10 min)](#recipe-4-form-with-file-upload)
- [Recipe 5: Custom Validation Pattern (8 min)](#recipe-5-custom-validation-pattern)

---

## Recipe 1: Simple Contact Form

**What you'll build:** Basic contact form that sends emails via Gmail SMTP

**Time estimate:** 5 minutes

:::note Prerequisites
Before starting this recipe, ensure you have:
- SvelteKit project initialized
- Gmail account with 2FA enabled
- Gmail app password created ([How to create](https://support.google.com/accounts/answer/185833))
:::

### Implementation

**Step 1: Install package**
```bash
npm install @goobits/forms
```

**Step 2: Create configuration**
```javascript
// src/lib/contact-config.js
export const contactConfig = {
	appName: 'My App',
	categories: {
		general: {
			label: 'Contact Us',
			fields: ['name', 'email', 'message', 'coppa']
		}
	}
};
```

**Step 3: Initialize in hooks**
```javascript
// src/hooks.server.js
import { initContactFormConfig } from '@goobits/forms/config';
import { contactConfig } from '$lib/contact-config.js';

initContactFormConfig(contactConfig);

export async function handle({ event, resolve }) {
	return await resolve(event);
}
```

**Step 4: Create API endpoint**
```javascript
// src/routes/api/contact/+server.js
import { createContactApiHandler } from '@goobits/forms/handlers/contactFormHandler';

export const POST = createContactApiHandler({
	adminEmail: process.env.ADMIN_EMAIL,
	fromEmail: process.env.FROM_EMAIL,
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
});
```

**Step 5: Add environment variables**
```bash
# .env (add to .gitignore!)
ADMIN_EMAIL=your-email@gmail.com
FROM_EMAIL=noreply@yourdomain.com
SMTP_USER=your-email@gmail.com
SMTP_APP_PASSWORD=your-16-char-app-password
```

**Step 6: Add form to page**
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

### Project Structure

Your complete project structure should look like this:

```filetree
src/
├── lib/
│   └── contact-config.js       ← Step 2
├── routes/
│   ├── api/
│   │   └── contact/
│   │       └── +server.js      ← Step 4
│   └── contact/
│       └── +page.svelte        ← Step 6
├── hooks.server.js             ← Step 3
└── .env                        ← Step 5 (add to .gitignore!)
```

### Test it

```bash
npm run dev
# Navigate to http://localhost:5173/contact
# Fill out form and submit
# Check your email inbox
```

### Troubleshooting

- **"Failed to send email"**: Check Gmail app password is correct (no spaces)
- **"SMTP connection failed"**: Ensure 2FA is enabled on Gmail account
- **"Module not found"**: Run `npm install` again

---

## Recipe 2: Production-Ready Form

**What you'll build:** Contact form with all security features (CSRF + reCAPTCHA + rate limiting)

**Time estimate:** 15 minutes

:::note Prerequisites
Before starting this recipe, ensure you have:
- Simple contact form working (Recipe 1)
- Google reCAPTCHA account ([Get keys](https://www.google.com/recaptcha/admin))
:::

### Implementation

**Step 1: Add reCAPTCHA to configuration**
```javascript
// src/lib/contact-config.js
export const contactConfig = {
	appName: 'My App',
	categories: {
		general: {
			label: 'Contact Us',
			fields: ['name', 'email', 'message', 'coppa']
		}
	},
	// ADD THIS:
	recaptcha: {
		enabled: true,
		provider: 'google-v3',
		siteKey: process.env.PUBLIC_RECAPTCHA_SITE_KEY,
		minScore: 0.5 // 0.0 (bot) to 1.0 (human)
	}
};
```

**Step 2: Create CSRF endpoint**
```javascript
// src/routes/api/csrf/+server.js
import { setCsrfCookie } from '@goobits/forms/security/csrf';

export async function GET(event) {
	const token = setCsrfCookie(event);
	return new Response(JSON.stringify({ csrfToken: token }), {
		headers: { 'Content-Type': 'application/json' }
	});
}
```

**Step 3: Update API handler with all security**
```javascript
// src/routes/api/contact/+server.js
import { createContactApiHandler } from '@goobits/forms/handlers/contactFormHandler';

export const POST = createContactApiHandler({
	adminEmail: process.env.ADMIN_EMAIL,
	fromEmail: process.env.FROM_EMAIL,

	// Email configuration
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
	},

	// Security features
	recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,
	recaptchaMinScore: 0.5,
	rateLimitMaxRequests: 3,          // 3 requests per window
	rateLimitWindowMs: 3600000         // 1 hour window
});
```

**Step 4: Update environment variables**
```bash
# .env
ADMIN_EMAIL=your-email@gmail.com
FROM_EMAIL=noreply@yourdomain.com
SMTP_USER=your-email@gmail.com
SMTP_APP_PASSWORD=your-16-char-app-password

# ADD THESE:
PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

**Step 5: Form component stays the same!**
```svelte
<!-- src/routes/contact/+page.svelte -->
<!-- No changes needed - security is handled automatically -->
<script>
	import { ContactForm } from '@goobits/forms/ui';
	import '@goobits/forms/ui/variables.css';
	import '@goobits/forms/ui/ContactForm.css';
</script>

<ContactForm apiEndpoint="/api/contact" />
```

### Project Structure

Recipe 2 adds security endpoints:

```filetree
src/
├── lib/
│   └── contact-config.js       ← Updated (Step 1 - reCAPTCHA config)
├── routes/
│   ├── api/
│   │   ├── contact/
│   │   │   └── +server.js      ← Updated (Step 2 - secrets)
│   │   └── csrf/
│   │       └── +server.js      ← NEW (Step 3 - CSRF endpoint)
│   └── contact/
│       ├── +page.svelte
│       └── +page.server.js     ← NEW (Step 4 - token prefetch)
├── hooks.server.js
└── .env                        ← Updated (Step 5 - reCAPTCHA secret)
```

### What you get

✅ **CSRF protection:** Prevents cross-site attacks
✅ **reCAPTCHA v3:** Invisible bot detection
✅ **Rate limiting:** Prevents abuse (3 submissions per hour per IP)
✅ **Automatic fallback:** If CSRF/reCAPTCHA fails, form still works (graceful degradation)

### Performance

- First submission: ~400ms (CSRF fetch + reCAPTCHA load + form submit)
- Subsequent submissions: ~200ms (CSRF/reCAPTCHA cached)

**Optimization:** Pre-fetch CSRF token in `+page.server.js` to eliminate 100-200ms delay:

```javascript
// src/routes/contact/+page.server.js
import { setCsrfCookie } from '@goobits/forms/security/csrf';

export async function load(event) {
	const csrfToken = setCsrfCookie(event);
	return { csrfToken };
}
```

---

## Recipe 3: Multi-Category Form

**What you'll build:** Single form that routes to different departments based on category selection

**Time estimate:** 10 minutes

:::note Prerequisites
Before starting this recipe, ensure you have:
- Simple contact form working (Recipe 1)
:::

### Implementation

**Step 1: Configure multiple categories**
```javascript
// src/lib/contact-config.js
export const contactConfig = {
	appName: 'My App',
	categories: {
		general: {
			label: 'General Inquiry',
			icon: 'fa fa-envelope',
			fields: ['name', 'email', 'message', 'coppa']
		},
		support: {
			label: 'Technical Support',
			icon: 'fa fa-life-ring',
			fields: ['name', 'email', 'browser', 'operatingSystem', 'message', 'attachments']
		},
		sales: {
			label: 'Sales Inquiry',
			icon: 'fa fa-dollar-sign',
			fields: ['name', 'email', 'company', 'businessRole', 'message', 'coppa']
		}
	}
};
```

**Step 2: Use CategoryContactForm component**
```svelte
<!-- src/routes/contact/+page.svelte -->
<script>
	// Change to CategoryContactForm
	import { CategoryContactForm } from '@goobits/forms/ui';
	import '@goobits/forms/ui/variables.css';
	import '@goobits/forms/ui/ContactForm.css';
</script>

<h1>Contact Us</h1>
<CategoryContactForm
	apiEndpoint="/api/contact"
	showCategorySelector={true}
/>
```

**Step 3: API handler stays the same!**
```javascript
// src/routes/api/contact/+server.js
// No changes needed - categories are handled automatically
export const POST = createContactApiHandler({
	adminEmail: process.env.ADMIN_EMAIL,
	fromEmail: process.env.FROM_EMAIL,
	emailServiceConfig: {
		provider: 'nodemailer',
		smtp: { /* ... */ }
	}
});
```

### Project Structure

Recipe 3 uses multi-category form:

```filetree
src/
├── lib/
│   └── contact-config.js       ← Updated (Step 1 - 3 categories)
├── routes/
│   ├── api/
│   │   └── contact/
│   │       └── +server.js      ← Same as Recipe 1/2
│   └── contact/
│       └── +page.svelte        ← Updated (Step 2 - CategoryContactForm)
├── hooks.server.js
└── .env
```

**Key difference:** Using `CategoryContactForm` instead of `ContactForm` enables the category dropdown selector.

### Advanced: Category-specific email routing

Route emails to different departments based on category:

```javascript
// src/routes/api/contact/+server.js
export const POST = createContactApiHandler({
	// Use custom success handler for routing
	customSuccessHandler: async (data, clientAddress) => {
		const emailService = createEmailProvider({
			provider: 'nodemailer',
			smtp: { /* ... */ }
		});

		// Route to different emails based on category
		const categoryEmails = {
			general: 'info@company.com',
			support: 'support@company.com',
			sales: 'sales@company.com'
		};

		const recipientEmail = categoryEmails[data.category] || process.env.ADMIN_EMAIL;

		await emailService.sendEmail({
			to: recipientEmail,
			from: process.env.FROM_EMAIL,
			subject: `[${data.category.toUpperCase()}] New message from ${data.name}`,
			html: `
				<h2>New ${data.category} inquiry</h2>
				<p><strong>From:</strong> ${data.name} (${data.email})</p>
				${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
				<p><strong>Message:</strong></p>
				<p>${data.message}</p>
			`
		});

		return { message: 'Thanks! We\'ll respond within 24 hours.' };
	}
});
```

### User Experience

- User selects category from dropdown
- Form fields update automatically (different fields per category)
- Category included in email subject for easy filtering
- Different departments receive relevant inquiries

---

## Recipe 4: Form with File Upload

**What you'll build:** Contact form that accepts image attachments (screenshots, photos)

**Time estimate:** 10 minutes

:::note Prerequisites
Before starting this recipe, ensure you have:
- Simple contact form working (Recipe 1)
:::

### Implementation

**Step 1: Add attachments field to configuration**
```javascript
// src/lib/contact-config.js
export const contactConfig = {
	appName: 'My App',
	categories: {
		support: {
			label: 'Technical Support',
			// ADD 'attachments' to fields array
			fields: ['name', 'email', 'message', 'attachments', 'coppa']
		}
	},
	// OPTIONAL: Customize file upload settings
	fileSettings: {
		maxFileSize: 5 * 1024 * 1024,  // 5MB per file (default)
		maxFiles: 3,                     // Up to 3 files (default)
		acceptedImageTypes: [            // Allowed types (default)
			'image/jpeg',
			'image/jpg',
			'image/png',
			'image/webp',
			'image/gif'
		]
	}
};
```

**Step 2: API handler processes files automatically**
```javascript
// src/routes/api/contact/+server.js
// Files are automatically included as email attachments!
export const POST = createContactApiHandler({
	adminEmail: process.env.ADMIN_EMAIL,
	fromEmail: process.env.FROM_EMAIL,
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
	// That's it! Files are automatically attached to email
});
```

**Step 3: Form component stays the same**
```svelte
<!-- src/routes/contact/+page.svelte -->
<!-- File upload UI appears automatically when 'attachments' in fields -->
<script>
	import { ContactForm } from '@goobits/forms/ui';
	import '@goobits/forms/ui/variables.css';
	import '@goobits/forms/ui/ContactForm.css';
</script>

<ContactForm apiEndpoint="/api/contact" />
```

### What users see

1. **File upload button** appears in form
2. **Drag-and-drop zone** for easy upload
3. **Image preview** thumbnails after selection
4. **Validation feedback** (file too large, wrong type, too many files)
5. **Loading indicator** during upload

### Advanced: Store files in S3 instead of email

```javascript
// src/routes/api/contact/+server.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'us-east-1' });

export const POST = createContactApiHandler({
	adminEmail: process.env.ADMIN_EMAIL,
	fromEmail: process.env.FROM_EMAIL,
	emailServiceConfig: { provider: 'nodemailer', /* ... */ },

	// Custom handler to upload files to S3
	customSuccessHandler: async (data, clientAddress) => {
		const fileUrls = [];

		// Upload each attachment to S3
		if (data.attachments && data.attachments.length > 0) {
			for (const file of data.attachments) {
				const key = `uploads/${Date.now()}-${file.name}`;
				await s3.send(new PutObjectCommand({
					Bucket: process.env.S3_BUCKET,
					Key: key,
					Body: Buffer.from(file.data, 'base64'),
					ContentType: file.type
				}));
				fileUrls.push(`https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`);
			}
		}

		// Send email with S3 links instead of attachments
		const emailService = createEmailProvider({
			provider: 'nodemailer',
			smtp: { /* ... */ }
		});

		await emailService.sendEmail({
			to: process.env.ADMIN_EMAIL,
			from: process.env.FROM_EMAIL,
			subject: `Support request from ${data.name}`,
			html: `
				<p><strong>From:</strong> ${data.name} (${data.email})</p>
				<p><strong>Message:</strong> ${data.message}</p>
				${fileUrls.length > 0 ? `
					<p><strong>Attachments:</strong></p>
					<ul>${fileUrls.map(url => `<li><a href="${url}">${url}</a></li>`).join('')}</ul>
				` : ''}
			`
		});

		return { message: 'Thanks! Your files were uploaded.' };
	}
});
```

---

## Recipe 5: Custom Validation Pattern

**What you'll build:** Form with business-specific validation (e.g., company email domains only, phone format validation)

**Time estimate:** 8 minutes

:::note Prerequisites
Before starting this recipe, ensure you have:
- Simple contact form working (Recipe 1)
:::

### Implementation

**Step 1: Add custom validation to API handler**
```javascript
// src/routes/api/contact/+server.js
import { createContactApiHandler } from '@goobits/forms/handlers/contactFormHandler';

export const POST = createContactApiHandler({
	adminEmail: process.env.ADMIN_EMAIL,
	fromEmail: process.env.FROM_EMAIL,
	emailServiceConfig: { provider: 'nodemailer', /* ... */ },

	// ADD THIS: Custom validation function
	customValidation: (data) => {
		const errors = {};

		// Validate company email domain
		if (data.email) {
			const allowedDomains = ['company.com', 'subsidiary.com'];
			const domain = data.email.split('@')[1];

			if (!allowedDomains.includes(domain)) {
				errors.email = 'Please use your company email address (@company.com)';
			}
		}

		// Validate phone format (US only)
		if (data.phone) {
			const phoneRegex = /^\+?1?\s*\(?[2-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
			if (!phoneRegex.test(data.phone)) {
				errors.phone = 'Please enter a valid US phone number';
			}
		}

		// Validate message length (business requirement: min 50 chars)
		if (data.message && data.message.length < 50) {
			errors.message = 'Please provide more details (minimum 50 characters)';
		}

		// Return null if no errors, otherwise return errors object
		return Object.keys(errors).length > 0 ? errors : null;
	}
});
```

### Pattern: Async validation with external API

Validate email exists in your CRM before accepting submission:

```javascript
// src/routes/api/contact/+server.js
export const POST = createContactApiHandler({
	adminEmail: process.env.ADMIN_EMAIL,
	fromEmail: process.env.FROM_EMAIL,
	emailServiceConfig: { provider: 'nodemailer', /* ... */ },

	customValidation: async (data) => {
		// Call external CRM API to check if email exists
		const response = await fetch(`https://crm.company.com/api/check-customer?email=${data.email}`, {
			headers: { 'Authorization': `Bearer ${process.env.CRM_API_KEY}` }
		});

		const { exists, isBlocked } = await response.json();

		if (!exists) {
			return {
				email: 'Email not found in our system. Are you an existing customer?'
			};
		}

		if (isBlocked) {
			return {
				email: 'This account is suspended. Please contact support.'
			};
		}

		return null; // Validation passed
	}
});
```

### Pattern: Cross-field validation

Validate that two fields match (e.g., email confirmation):

```javascript
customValidation: (data) => {
	// Add 'emailConfirm' field to your category configuration
	if (data.email && data.emailConfirm && data.email !== data.emailConfirm) {
		return {
			emailConfirm: 'Email addresses must match'
		};
	}

	return null;
}
```

### Pattern: Conditional validation

Require certain fields based on other field values:

```javascript
customValidation: (data) => {
	const errors = {};

	// If 'businessRole' is 'Other', require 'roleDescription'
	if (data.businessRole === 'Other' && !data.roleDescription) {
		errors.roleDescription = 'Please describe your role';
	}

	// If attaching files, require description of what's in them
	if (data.attachments && data.attachments.length > 0 && !data.attachmentDescription) {
		errors.attachmentDescription = 'Please describe your attachments';
	}

	return Object.keys(errors).length > 0 ? errors : null;
}
```

### Testing custom validation

```javascript
// tests/contact-validation.test.js
import { POST } from './src/routes/api/contact/+server.js';

test('rejects non-company email', async () => {
	const request = new Request('http://localhost/api/contact', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			name: 'John Doe',
			email: 'john@gmail.com',  // Should fail
			message: 'Test message'
		})
	});

	const response = await POST({ request });
	const data = await response.json();

	expect(response.status).toBe(400);
	expect(data.errors.email).toContain('company email');
});
```

---

## Next Steps

**Ready for more?**
- [API Reference](./api-reference.md) - Complete component and prop documentation
- [Configuration Guide](./configuration.md) - All configuration options
- [Testing Guide](./testing.md) - Unit and E2E testing strategies
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
