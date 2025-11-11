# API Reference

Reference for all components, handlers, and utilities in @goobits/forms.

**Navigation:** [Form Components](#form-components) | [UI Components](#ui-components) | [Handlers](#handlers) | [Configuration](#configuration) | [Utilities](#utilities)

---

## Form Components

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
| `rateLimitWindowMs` | `number` | `60000` | Rate limit window (ms) |
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

**Related:** [Getting Started](./getting-started.md) | [Configuration](./configuration.md) | [Troubleshooting](./troubleshooting.md)
