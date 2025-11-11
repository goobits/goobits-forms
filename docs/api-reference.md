# API Reference

Reference for all components, handlers, and utilities in @goobits/forms.

## TOC

**Quick Links:** [Form Components](#form-components) | [UI Components](#ui-components) | [Handlers](#handlers) | [Configuration](#configuration) | [Utilities](#utilities) | [Services](#services)

---

## Form Components

### Choosing a Form Component

| Component | Use When | Category Selector | Bundle Size | Best For |
|-----------|----------|-------------------|-------------|----------|
| **ContactForm** | Single form type | No | +12KB | Simple contact page, predetermined category |
| **CategoryContactForm** | 2+ form types | Yes (dropdown) | +15KB | Multi-department routing, consolidated forms |
| **ContactFormPage** | Need full page layout | Configurable | +18KB | Complete form page with header/footer |
| **FeedbackForm** | Quick feedback widget | No | +8KB | Embedded widget, minimal fields |

:::tip Decision Guide: Choosing a Form Component
- **Use ContactForm when:**
  - You have ONE type of inquiry (e.g., "Contact Us" page)
  - Category is predetermined programmatically
  - You want simpler UI without category selector

- **Use CategoryContactForm when:**
  - You have 2+ inquiry types (Support, Sales, General)
  - Users need to select their category
  - Different fields required per category

- **Use ContactFormPage when:**
  - You want complete page layout with consistent styling
  - Need header/footer around the form

- **Use FeedbackForm when:**
  - Embedded widget (not full page)
  - Quick feedback only (name, email, message)
  - Minimal UI footprint
:::

### Component Architecture

See how form components connect to configuration, API handlers, and services:

```mermaid
graph TB
    subgraph "Client Side (Browser)"
        CF[ContactForm<br/>Single category]
        CCF[CategoryContactForm<br/>Multi-category selector]
        CFP[ContactFormPage<br/>Full page layout]
        FF[FeedbackForm<br/>Minimal widget]
    end

    subgraph "Configuration Layer"
        Config[contactConfig<br/>categories, fields, security]
        Init[initContactFormConfig<br/>in hooks.server.js]
    end

    subgraph "Server Side APIs"
        CSRF[/api/csrf<br/>CSRF token generation]
        Handler[/api/contact<br/>createContactApiHandler]
    end

    subgraph "Backend Services"
        Validation[Form Validation<br/>Zod schemas]
        RateLimit[Rate Limiter<br/>IP-based throttling]
        reCAPTCHA[reCAPTCHA Service<br/>Bot detection]
        Email[Email Service<br/>Mock/Nodemailer/AWS SES]
    end

    CF --> Config
    CCF --> Config
    CFP --> Config
    FF --> Config
    Config --> Init

    CF --> CSRF
    CCF --> CSRF
    CFP --> CSRF

    CF --> Handler
    CCF --> Handler
    CFP --> Handler
    FF --> Handler

    Handler --> Validation
    Handler --> RateLimit
    Handler --> reCAPTCHA
    Handler --> Email

    style CF fill:#3b82f6,color:#fff
    style CCF fill:#3b82f6,color:#fff
    style CFP fill:#3b82f6,color:#fff
    style FF fill:#3b82f6,color:#fff
    style Handler fill:#10b981,color:#fff
    style Email fill:#f59e0b,color:#fff
```

---

### ContactForm

Main form component with validation, CSRF protection, and category-based field rendering.

**Import:**
```javascript
import { ContactForm } from '@goobits/forms/ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | `'/api/contact'` | API endpoint for form submission |
| `csrfToken` | `string` | `''` | CSRF token for security (optional, auto-fetched if not provided). **Performance:** Pre-fetch in `+page.server.js` to avoid 100-200ms delay on submission |
| `initialData` | `object` | `{}` | Pre-populate form fields |
| `messages` | `object` | `{}` | Override default i18n messages |
| `submitContactForm` | `function` | Built-in handler | Custom form submission function |

**Usage:**
```svelte
<script>
	import { ContactForm } from '@goobits/forms/ui';
</script>

<ContactForm
	apiEndpoint="/api/contact"
	initialData={{ name: 'John', email: 'john@example.com' }}
/>
```

**Features:**
- Category-based field rendering
- Auto-save to localStorage
- Form hydration on page load
- reCAPTCHA integration
- CSRF token handling
- Screen reader announcements
- Validation with Zod schemas

---

### CategoryContactForm

Form with category selection dropdown for multiple form types.

**Import:**
```javascript
import { CategoryContactForm } from '@goobits/forms/ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | `'/api/contact'` | API endpoint for form submission |
| `csrfToken` | `string` | `''` | CSRF token for security |
| `initialData` | `object` | `{}` | Pre-populate form fields |
| `messages` | `object` | `{}` | Override i18n messages |
| `showCategorySelector` | `boolean` | `true` | Show/hide category dropdown |

**Usage:**
```svelte
<script>
	import { CategoryContactForm } from '@goobits/forms/ui';
</script>

<CategoryContactForm
	apiEndpoint="/api/contact"
	showCategorySelector={true}
/>
```

**When to use:** Use CategoryContactForm when users need to select from multiple form types (general inquiry, support, feedback). Use ContactForm for single-purpose forms.

---

### FeedbackForm

Feedback widget for collecting user input.

**Import:**
```javascript
import { FeedbackForm } from '@goobits/forms/ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `feedbackType` | `string` | `''` | Pre-selected feedback type |
| `userComment` | `string` | `''` | Pre-filled comment |
| `userName` | `string` | `''` | Pre-filled user name |
| `userEmail` | `string` | `''` | Pre-filled user email |
| `messages` | `object` | `{}` | Override i18n messages |
| `isFormVisible` | `boolean` | `false` | Initial form visibility |
| `isThankYouVisible` | `boolean` | `false` | Initial thank you visibility |
| `submitContactForm` | `function` | Built-in handler | Custom submission function |

**Usage:**
```svelte
<script>
	import { FeedbackForm } from '@goobits/forms/ui';
</script>

<FeedbackForm
	isFormVisible={true}
	messages={{ feedbackPlaceholder: 'Tell us what you think...' }}
/>
```

---

### ContactFormPage

Page layout with form, header, and footer.

**Import:**
```javascript
import { ContactFormPage } from '@goobits/forms/ui';
```

**Props:** Same as ContactForm plus additional layout props.

**Usage:**
```svelte
<ContactFormPage apiEndpoint="/api/contact" />
```

---

### FormField

Reusable field component for custom forms.

**Import:**
```javascript
import { FormField } from '@goobits/forms/ui';
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `field` | `object` | Yes | Field configuration object |
| `value` | `any` | Yes | Current field value |
| `errors` | `array` | No | Validation errors |
| `touched` | `boolean` | No | Whether field has been touched |
| `onChange` | `function` | Yes | Value change handler |
| `onBlur` | `function` | Yes | Blur event handler |

---

### UploadImage

Image upload component with preview and validation.

**Import:**
```javascript
import { UploadImage } from '@goobits/forms/ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `File \| null` | `null` | Current uploaded file |
| `maxSize` | `number` | `5242880` | Max file size in bytes (default 5MB) |
| `acceptedTypes` | `array` | `['image/jpeg', 'image/png', ...]` | Allowed MIME types |
| `onChange` | `function` | Required | File change handler |
| `error` | `string` | `''` | Validation error message |

**Usage:**
```svelte
<script>
	import { UploadImage } from '@goobits/forms/ui';
	let file = $state(null);
</script>

<UploadImage
	value={file}
	maxSize={10485760}
	onChange={(newFile) => file = newFile}
/>
```

---

## UI Components

### Input

Text input component with validation styling.

**Import:**
```javascript
import { Input } from '@goobits/forms/ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | `'text'` | Input type (text, email, tel, etc.) |
| `value` | `string` | `''` | Current value |
| `placeholder` | `string` | `''` | Placeholder text |
| `error` | `string` | `''` | Error message |
| `disabled` | `boolean` | `false` | Disabled state |
| `required` | `boolean` | `false` | Required field |

---

### Textarea

Multi-line text input component.

**Import:**
```javascript
import { Textarea } from '@goobits/forms/ui';
```

**Props:** Same as Input plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `number` | `4` | Number of visible rows |
| `maxlength` | `number` | `undefined` | Maximum character length |

---

### SelectMenu

Dropdown select component.

**Import:**
```javascript
import { SelectMenu } from '@goobits/forms/ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `array` | `[]` | Array of {value, label} objects |
| `value` | `string` | `''` | Selected value |
| `placeholder` | `string` | `'Select...'` | Placeholder text |
| `onChange` | `function` | Required | Selection change handler |

---

### ToggleSwitch

Toggle switch component for boolean values.

**Import:**
```javascript
import { ToggleSwitch } from '@goobits/forms/ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | Toggle state |
| `label` | `string` | `''` | Label text |
| `onChange` | `function` | Required | State change handler |
| `disabled` | `boolean` | `false` | Disabled state |

---

### Modal System

**Import:**
```javascript
import { Modal, Alert, Confirm, AppleModal } from '@goobits/forms/ui/modals';
```

#### Modal

Base modal component.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Modal visibility |
| `title` | `string` | `''` | Modal title |
| `onClose` | `function` | Required | Close handler |
| `size` | `string` | `'medium'` | Size (small, medium, large) |

#### Alert

Alert dialog for notifications.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Alert visibility |
| `title` | `string` | `''` | Alert title |
| `message` | `string` | `''` | Alert message |
| `type` | `string` | `'info'` | Type (info, success, warning, error) |
| `onClose` | `function` | Required | Close handler |

#### Confirm

Confirmation dialog with actions.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Confirm visibility |
| `title` | `string` | `''` | Confirm title |
| `message` | `string` | `''` | Confirm message |
| `confirmText` | `string` | `'Confirm'` | Confirm button text |
| `cancelText` | `string` | `'Cancel'` | Cancel button text |
| `onConfirm` | `function` | Required | Confirm action handler |
| `onCancel` | `function` | Required | Cancel action handler |

#### AppleModal

Apple-style modal with animations.

**Props:** Same as Modal with additional animation options.

---

### Menu System

**Import:**
```javascript
import { Menu, ContextMenu, MenuItem, MenuSeparator } from '@goobits/forms/ui';
```

#### Menu

Dropdown menu component.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `array` | `[]` | Menu items configuration |
| `isVisible` | `boolean` | `false` | Menu visibility |
| `x` | `number` | `0` | X position |
| `y` | `number` | `0` | Y position |
| `onClose` | `function` | Required | Close handler |
| `placement` | `string` | `'bottom-start'` | Menu placement |

**Item Configuration:**
```javascript
const items = [
	{ type: 'action', label: 'Edit', onClick: () => {} },
	{ type: 'separator' },
	{ type: 'destructive', label: 'Delete', onClick: () => {} }
];
```

#### ContextMenu

Context menu with right-click trigger.

**Props:** Same as Menu plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `target` | `HTMLElement` | Required | Target element for context menu |

---

### Tooltip System

**Import:**
```javascript
import { tooltip, TooltipPortal } from '@goobits/forms/ui/tooltip';
```

#### tooltip (Svelte Action)

Use as Svelte action for hover tooltips.

**Usage:**
```svelte
<script>
	import { tooltip, TooltipPortal } from '@goobits/forms/ui/tooltip';
</script>

<!-- Add portal to layout -->
<TooltipPortal />

<!-- Use tooltip action -->
<button use:tooltip={{ content: "Click me" }}>
	Hover for tooltip
</button>

<!-- Click mode -->
<button use:tooltip={{ content: "Info", showOnClick: true }}>
	Click for tooltip
</button>
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `content` | `string \| function` | Required | Tooltip content |
| `showOnClick` | `boolean` | `false` | Show on click instead of hover |
| `placement` | `string` | `'top'` | Placement (top, bottom, left, right) |
| `delay` | `number` | `200` | Show delay in ms |
| `hideDelay` | `number` | `0` | Hide delay in ms |

---

## Handlers

### createContactApiHandler

Creates a SvelteKit API route handler for contact forms.

**Import:**
```javascript
import { createContactApiHandler } from '@goobits/forms/handlers/contactFormHandler';
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `adminEmail` | `string` | Required | Admin notification email |
| `fromEmail` | `string` | Required | From email address |
| `emailServiceConfig` | `object` | `{}` | Email service configuration |
| `recaptchaSecretKey` | `string` | `''` | reCAPTCHA secret key |
| `recaptchaMinScore` | `number` | `0.5` | Minimum reCAPTCHA score |
| `rateLimitMaxRequests` | `number` | `3` | Max requests per window |
| `rateLimitWindowMs` | `number` | `3600000` | Rate limit window (ms, default 1 hour) |
| `successMessage` | `string` | Default message | Custom success message |
| `errorMessage` | `string` | Default message | Custom error message |
| `customValidation` | `function` | `null` | Custom validation logic |
| `customSuccessHandler` | `function` | `null` | Custom success handler |

**Usage:**
```javascript
// /api/contact/+server.js
import { createContactApiHandler } from '@goobits/forms/handlers/contactFormHandler';

export const POST = createContactApiHandler({
	adminEmail: process.env.ADMIN_EMAIL,
	fromEmail: process.env.FROM_EMAIL,
	recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,
	customSuccessHandler: async (data) => {
		// Store in database
		await db.insert(data);
		return { message: 'Success!', id: data.id };
	}
});
```

---

## Configuration

### initContactFormConfig

Initialize form configuration with categories and fields.

**Import:**
```javascript
import { initContactFormConfig } from '@goobits/forms/config';
```

**Usage:**
```javascript
// src/hooks.server.js or src/app.js
import { initContactFormConfig } from '@goobits/forms/config';

const contactConfig = {
	appName: 'My App',
	categories: {
		general: {
			label: 'General Inquiry',
			fields: ['name', 'email', 'message']
		},
		support: {
			label: 'Technical Support',
			fields: ['name', 'email', 'phone', 'message', 'attachments']
		}
	},
	recaptcha: {
		enabled: true,
		provider: 'google-v3',
		siteKey: 'YOUR_SITE_KEY',
		minScore: 0.5
	},
	fileSettings: {
		maxFileSize: 5 * 1024 * 1024, // 5MB
		acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
	}
};

initContactFormConfig(contactConfig);
```

**Configuration Schema:**

```typescript
interface ContactConfig {
	appName: string;
	categories: Record<string, CategoryConfig>;
	recaptcha?: RecaptchaConfig;
	fileSettings?: FileSettings;
	ui?: UIConfig;
}

interface CategoryConfig {
	label: string;
	icon?: string;
	fields: string[];
}

interface RecaptchaConfig {
	enabled: boolean;
	provider: 'google-v3' | 'hcaptcha' | 'turnstile';
	siteKey: string;
	minScore?: number; // 0.0 - 1.0 for v3
}

interface FileSettings {
	maxFileSize: number; // in bytes
	acceptedImageTypes: string[]; // MIME types
}
```

---

## Utilities

### CSRF Protection

**Import:**
```javascript
import {
	generateCsrfToken,
	validateCsrfToken,
	createCsrfProtection
} from '@goobits/forms/security/csrf';
```

**Usage:**
```javascript
// Generate token
const token = generateCsrfToken();

// Validate token
const isValid = validateCsrfToken(token, storedToken);

// SvelteKit middleware
export const handle = createCsrfProtection();
```

---

### Internationalization

**Import:**
```javascript
import {
	handleFormI18n,
	loadWithFormI18n,
	createMessageGetter
} from '@goobits/forms/i18n';
```

**Usage:**
```javascript
// hooks.server.js - Auto-detection
export async function handle({ event, resolve }) {
	await handleFormI18n(event);
	return await resolve(event);
}

// +page.server.js - Data loading
export const load = async (event) => {
	return await loadWithFormI18n(event, async () => {
		return { /* your data */ };
	});
};

// Component - Message override
import { createMessageGetter } from '@goobits/forms/i18n';
const getMessage = createMessageGetter(customMessages);
```

---

### Validation Schemas

**Import:**
```javascript
import { contactSchema, feedbackSchema } from '@goobits/forms/validation';
```

**Usage:**
```javascript
import { z } from 'zod';
import { contactSchema } from '@goobits/forms/validation';

// Extend existing schema
const customSchema = contactSchema.extend({
	company: z.string().optional()
});

// Server-side validation
const result = customSchema.safeParse(formData);
if (!result.success) {
	return { errors: result.error.flatten() };
}
```

---

## Services

Advanced services for form handling, state management, and integrations.

### Form Storage

Persist form data to localStorage to prevent data loss.

**Import:**
```javascript
import {
	saveFormData,
	loadFormData,
	clearFormData,
	hasSavedData
} from '@goobits/forms/services';
```

**Usage:**
```javascript
// Save form data
saveFormData({ name: 'John', email: 'john@example.com' }, 'contact');

// Load saved data
const data = loadFormData('contact');

// Clear data
clearFormData('contact');
```

---

### Form Hydration

Pre-fill forms with saved or test data.

**Import:**
```javascript
import { hydrateForm, getTestDataForCategory } from '@goobits/forms/services';
```

**Usage:**
```javascript
// Hydrate form with saved data
const formData = hydrateForm({ category: 'contact', useTestData: false });

// Get test data for development
const testData = getTestDataForCategory('support');
```

---

### Screen Reader Service

Accessibility announcements for screen readers.

**Import:**
```javascript
import {
	announce,
	announceFormErrors,
	announceFormStatus
} from '@goobits/forms/services';
```

**Usage:**
```javascript
// Announce message
announce('Form submitted successfully', { priority: 'polite' });

// Announce errors
announceFormErrors({ email: ['Invalid email'], name: ['Required'] });

// Announce status
announceFormStatus('submitting');
```

---

### Email Service

Email delivery via Nodemailer, AWS SES, or mock provider.

**Import:**
```javascript
import { createEmailProvider } from '@goobits/forms/services';
```

**Usage:**
```javascript
// Create provider
const emailService = createEmailProvider({
	provider: 'nodemailer',
	smtp: {
		host: 'smtp.gmail.com',
		port: 587,
		auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
	}
});

// Send email
await emailService.sendEmail({
	to: 'admin@example.com',
	subject: 'New Contact',
	text: 'Message from user',
	html: '<p>Message from user</p>'
});
```

---

### Rate Limiter

IP and email-based rate limiting.

**Import:**
```javascript
import { rateLimitFormSubmission, resetIpRateLimit } from '@goobits/forms/services';
```

**Usage:**
```javascript
// Check rate limit
const result = await rateLimitFormSubmission({
	ipAddress: request.headers.get('x-forwarded-for'),
	email: 'user@example.com',
	maxRequests: 3,
	windowMs: 60000
});

if (!result.allowed) {
	return { error: 'Rate limit exceeded', retryAfter: result.retryAfter };
}
```

---

### reCAPTCHA

reCAPTCHA verification and provider creation.

**Import:**
```javascript
import { createRecaptchaProvider } from '@goobits/forms/services';
```

**Usage:**
```javascript
// Create provider
const recaptcha = createRecaptchaProvider({
	provider: 'google-v3',
	siteKey: process.env.RECAPTCHA_SITE_KEY,
	secretKey: process.env.RECAPTCHA_SECRET_KEY
});

// Execute challenge (client-side)
const token = await recaptcha.execute('contact_form');

// Verify token (server-side)
const result = await recaptcha.verify(token);
if (result.score < 0.5) {
	return { error: 'Failed security check' };
}
```

---

## TypeScript Support

All components and utilities include TypeScript type definitions. Import types:

```typescript
import type {
	ContactConfig,
	CategoryConfig,
	RecaptchaConfig,
	FileSettings
} from '@goobits/forms/config';

import type {
	MenuItem,
	MenuConfig,
	TooltipOptions
} from '@goobits/forms/ui';
```

See [TypeScript Guide](./typescript.md) for type documentation.

---

**See also:**
- [TypeScript Guide](./typescript.md) - Type-safe development
- [Configuration Guide](./configuration.md) - Configuration options
- [Troubleshooting](./troubleshooting.md) - Common issues
