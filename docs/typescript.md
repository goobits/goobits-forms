# TypeScript Guide

Type-safe form development with @goobits/forms.

---

## Type Definitions

All types are included in the package. Import from module subpaths:

```typescript
import type {
	ContactConfig,
	CategoryConfig,
	RecaptchaConfig,
	FileSettings
} from '@goobits/forms/config';

import type {
	ContactFormData,
	FeedbackFormData
} from '@goobits/forms/validation';

import type {
	MenuItem,
	MenuConfig,
	TooltipOptions
} from '@goobits/forms/ui';
```

---

## Configuration Types

### ContactConfig

```typescript
interface ContactConfig {
	appName: string;
	categories: Record<string, CategoryConfig>;
	recaptcha?: RecaptchaConfig;
	fileSettings?: FileSettings;
	ui?: UIConfig;
}
```

### CategoryConfig

```typescript
interface CategoryConfig {
	label: string;
	icon?: string;
	fields: string[];
}
```

### RecaptchaConfig

```typescript
interface RecaptchaConfig {
	enabled: boolean;
	provider: 'google-v3' | 'hcaptcha' | 'turnstile';
	siteKey: string;
	minScore?: number; // 0.0 - 1.0
}
```

### FileSettings

```typescript
interface FileSettings {
	maxFileSize: number; // bytes
	acceptedImageTypes: string[]; // MIME types
}
```

---

## Form Data Types

### ContactFormData

```typescript
interface ContactFormData {
	category: string;
	name?: string;
	email?: string;
	phone?: string;
	message?: string;
	subject?: string;
	company?: string;
	attachments?: File | null;
	coppa?: boolean;
}
```

### Usage in Components

```typescript
<script lang="ts">
	import type { ContactFormData } from '@goobits/forms/validation';

	async function handleSubmit(data: ContactFormData) {
		console.log(data.email); // Type-safe
	}
</script>
```

---

## Handler Types

### API Handler Options

```typescript
interface ContactApiHandlerOptions {
	adminEmail: string;
	fromEmail: string;
	emailServiceConfig?: EmailServiceConfig;
	recaptchaSecretKey?: string;
	recaptchaMinScore?: number;
	rateLimitMaxRequests?: number;
	rateLimitWindowMs?: number;
	successMessage?: string;
	errorMessage?: string;
	rateLimitMessage?: string;
	logSubmissions?: boolean;
	customValidation?: (data: any) => Record<string, string[]> | null;
	customSuccessHandler?: (
		data: any,
		clientAddress: string,
		recaptchaScore?: number
	) => Promise<any>;
}
```

### Email Service Config

```typescript
type EmailServiceConfig =
	| { provider: 'mock' }
	| { provider: 'nodemailer'; smtp: SMTPConfig }
	| { provider: 'aws-ses'; region: string; accessKeyId: string; secretAccessKey: string };

interface SMTPConfig {
	host: string;
	port: number;
	secure: boolean;
	auth: {
		user: string;
		pass: string;
	};
}
```

---

## Component Props Types

### ContactForm Props

```typescript
interface ContactFormProps {
	apiEndpoint?: string;
	csrfToken?: string;
	initialData?: Partial<ContactFormData>;
	messages?: Record<string, string>;
	submitContactForm?: (data: any, endpoint: string) => Promise<any>;
}
```

### FeedbackForm Props

```typescript
interface FeedbackFormProps {
	feedbackType?: string;
	userComment?: string;
	userName?: string;
	userEmail?: string;
	messages?: Record<string, string>;
	isFormVisible?: boolean;
	isThankYouVisible?: boolean;
	submitContactForm?: (data: any) => Promise<any>;
}
```

---

## Usage Examples

### Typed Configuration

```typescript
// src/lib/contact-config.ts
import type { ContactConfig } from '@goobits/forms/config';

export const contactConfig: ContactConfig = {
	appName: 'My App',
	categories: {
		general: {
			label: 'General Inquiry',
			fields: ['name', 'email', 'message']
		}
	},
	recaptcha: {
		enabled: true,
		provider: 'google-v3',
		siteKey: import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY,
		minScore: 0.5
	}
};
```

### Typed API Handler

```typescript
// src/routes/api/contact/+server.ts
import type { RequestHandler } from './$types';
import { createContactApiHandler } from '@goobits/forms/handlers/contactFormHandler';

export const POST: RequestHandler = createContactApiHandler({
	adminEmail: process.env.ADMIN_EMAIL!,
	fromEmail: process.env.FROM_EMAIL!,
	customSuccessHandler: async (data, clientAddress, recaptchaScore) => {
		// data is typed automatically
		console.log('Email:', data.email);
		console.log('Client IP:', clientAddress);
		console.log('reCAPTCHA score:', recaptchaScore);

		return { message: 'Success!' };
	}
});
```

### Typed Custom Validation

```typescript
import type { ContactFormData } from '@goobits/forms/validation';

function validatePhone(phone: string): boolean {
	return /^\+?[\d\s()-]{7,}$/.test(phone);
}

export const POST = createContactApiHandler({
	customValidation: (data: ContactFormData) => {
		const errors: Record<string, string[]> = {};

		if (data.phone && !validatePhone(data.phone)) {
			errors.phone = ['Please enter a valid phone number'];
		}

		if (data.email && !data.email.includes('@')) {
			errors.email = ['Invalid email format'];
		}

		return Object.keys(errors).length > 0 ? errors : null;
	}
});
```

---

## Menu and Tooltip Types

### Menu Items

```typescript
import type { MenuItem } from '@goobits/forms/ui/menu';

const menuItems: MenuItem[] = [
	{
		type: 'action',
		label: 'Edit',
		icon: 'edit',
		onClick: () => console.log('Edit clicked')
	},
	{
		type: 'separator'
	},
	{
		type: 'destructive',
		label: 'Delete',
		icon: 'trash',
		onClick: () => console.log('Delete clicked')
	}
];
```

### Tooltip Options

```typescript
import type { TooltipOptions } from '@goobits/forms/ui/tooltip';

const tooltipConfig: TooltipOptions = {
	content: 'This is a tooltip',
	placement: 'top',
	showOnClick: false,
	delay: 200,
	hideDelay: 0
};
```

---

## Zod Schema Validation

Leverage Zod for type-safe validation:

```typescript
import { z } from 'zod';
import { contactSchema } from '@goobits/forms/validation';

// Extend existing schema
const customContactSchema = contactSchema.extend({
	company: z.string().min(1, 'Company is required'),
	website: z.string().url('Must be a valid URL').optional()
});

// Type inference
type CustomContactData = z.infer<typeof customContactSchema>;

// Server-side validation
export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();

	const result = customContactSchema.safeParse(data);

	if (!result.success) {
		return new Response(JSON.stringify({
			success: false,
			errors: result.error.flatten().fieldErrors
		}), { status: 400 });
	}

	// result.data is typed as CustomContactData
	console.log(result.data.company); // Type-safe
};
```

---

## Generic Form Helper

Create reusable typed form handler:

```typescript
import type { z } from 'zod';

export function createTypedFormHandler<T extends z.ZodType>(
	schema: T,
	handler: (data: z.infer<T>) => Promise<Response>
): RequestHandler {
	return async ({ request }) => {
		const data = await request.json();
		const result = schema.safeParse(data);

		if (!result.success) {
			return new Response(JSON.stringify({
				success: false,
				errors: result.error.flatten().fieldErrors
			}), { status: 400 });
		}

		return handler(result.data);
	};
}

// Usage
const customSchema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
	age: z.number().min(18)
});

export const POST = createTypedFormHandler(customSchema, async (data) => {
	// data is fully typed based on schema
	console.log(data.name, data.email, data.age);

	return new Response(JSON.stringify({ success: true }));
});
```

---

## SvelteKit Integration

### Load Function with Types

```typescript
// src/routes/contact/+page.server.ts
import type { PageServerLoad } from './$types';
import { generateCsrfToken } from '@goobits/forms/security/csrf';

export const load: PageServerLoad = async ({ cookies }) => {
	const csrfToken = generateCsrfToken();

	return {
		csrfToken
	};
};
```

### Component with Types

```svelte
<!-- src/routes/contact/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import { ContactForm } from '@goobits/forms/ui';

	let { data }: { data: PageData } = $props();
</script>

<ContactForm csrfToken={data.csrfToken} />
```

---

## Type Guards

Create type guards for runtime type checking:

```typescript
import type { ContactFormData } from '@goobits/forms/validation';

function isContactFormData(data: unknown): data is ContactFormData {
	return (
		typeof data === 'object' &&
		data !== null &&
		'category' in data &&
		typeof (data as any).category === 'string'
	);
}

// Usage
export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();

	if (!isContactFormData(data)) {
		return new Response('Invalid data format', { status: 400 });
	}

	// data is now typed as ContactFormData
	console.log(data.category);
};
```

---

## Common TypeScript Issues

### Issue: Cannot find module

```typescript
// AVOID: Wrong
import { ContactForm } from '@goobits/forms';

// RECOMMENDED: Correct
import { ContactForm } from '@goobits/forms/ui';
```

### Issue: Type 'unknown' error

```typescript
// AVOID: No type safety
const data = await request.json();
console.log(data.email); // Error: Property 'email' does not exist on type 'unknown'

// RECOMMENDED: With type assertion
const data = await request.json() as ContactFormData;
console.log(data.email); // Type-safe

// BEST: With validation
const result = contactSchema.safeParse(await request.json());
if (result.success) {
	console.log(result.data.email); // Type-safe and validated
}
```

---

## tsconfig.json Setup

Recommended TypeScript configuration:

```json
{
	"compilerOptions": {
		"target": "ES2022",
		"module": "ESNext",
		"moduleResolution": "bundler",
		"strict": true,
		"esModuleInterop": true,
		"skipLibCheck": true,
		"resolveJsonModule": true,
		"types": ["@sveltejs/kit", "@goobits/forms"]
	}
}
```

---

**Related:** [API Reference](./api-reference.md) | [Getting Started](./getting-started.md) | [Configuration](./configuration.md)
