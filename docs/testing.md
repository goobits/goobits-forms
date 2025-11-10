# Testing Guide

Test forms built with @goobits/forms.

---

## Unit Testing Components

### Testing ContactForm

```typescript
// ContactForm.test.ts
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { ContactForm } from '@goobits/forms/ui';
import { initContactFormConfig } from '@goobits/forms/config';

beforeAll(() => {
	initContactFormConfig({
		appName: 'Test App',
		categories: {
			general: {
				label: 'General',
				fields: ['name', 'email', 'message']
			}
		}
	});
});

test('renders form fields', () => {
	const { getByLabelText } = render(ContactForm, {
		props: { apiEndpoint: '/api/contact' }
	});

	expect(getByLabelText('Name')).toBeInTheDocument();
	expect(getByLabelText('Email')).toBeInTheDocument();
	expect(getByLabelText('Message')).toBeInTheDocument();
});

test('submits form with valid data', async () => {
	const mockSubmit = vi.fn().mockResolvedValue({ success: true });

	const { getByLabelText, getByText } = render(ContactForm, {
		props: {
			apiEndpoint: '/api/contact',
			submitContactForm: mockSubmit
		}
	});

	await fireEvent.input(getByLabelText('Name'), { target: { value: 'John Doe' } });
	await fireEvent.input(getByLabelText('Email'), { target: { value: 'john@example.com' } });
	await fireEvent.input(getByLabelText('Message'), { target: { value: 'Test message' } });

	await fireEvent.click(getByText('Send Message'));

	await waitFor(() => {
		expect(mockSubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'John Doe',
				email: 'john@example.com',
				message: 'Test message'
			}),
			'/api/contact'
		);
	});
});

test('displays validation errors', async () => {
	const { getByLabelText, getByText, findByText } = render(ContactForm, {
		props: { apiEndpoint: '/api/contact' }
	});

	// Submit without filling fields
	await fireEvent.click(getByText('Send Message'));

	// Wait for validation errors
	expect(await findByText(/name is required/i)).toBeInTheDocument();
	expect(await findByText(/email is required/i)).toBeInTheDocument();
});
```

---

## Integration Testing API Handlers

### Testing createContactApiHandler

```typescript
// api/contact.test.ts
import { createContactApiHandler } from '@goobits/forms/handlers/contactFormHandler';
import { RequestEvent } from '@sveltejs/kit';

describe('Contact API Handler', () => {
	const handler = createContactApiHandler({
		adminEmail: 'admin@test.com',
		fromEmail: 'noreply@test.com',
		emailServiceConfig: { provider: 'mock' }
	});

	test('accepts valid submission', async () => {
		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				category: 'general',
				name: 'John Doe',
				email: 'john@example.com',
				message: 'Test message'
			})
		});

		const event = { request } as RequestEvent;
		const response = await handler(event);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
	});

	test('rejects invalid email', async () => {
		const request = new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				category: 'general',
				name: 'John Doe',
				email: 'invalid-email',
				message: 'Test'
			})
		});

		const event = { request } as RequestEvent;
		const response = await handler(event);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.success).toBe(false);
		expect(data.errors.email).toBeDefined();
	});
});
```

---

## Mocking reCAPTCHA

### Mock reCAPTCHA for Tests

```typescript
// setup-tests.ts
global.grecaptcha = {
	ready: (callback: () => void) => callback(),
	execute: vi.fn().mockResolvedValue('mock-recaptcha-token')
};

// Or mock the verification service
vi.mock('@goobits/forms/services/recaptchaVerifierService', () => ({
	verifyRecaptcha: vi.fn().mockResolvedValue({
		success: true,
		score: 0.9
	})
}));
```

### Test with reCAPTCHA

```typescript
import { verifyRecaptcha } from '@goobits/forms/services/recaptchaVerifierService';

test('verifies reCAPTCHA token', async () => {
	const handler = createContactApiHandler({
		adminEmail: 'admin@test.com',
		fromEmail: 'noreply@test.com',
		recaptchaSecretKey: 'test-secret',
		emailServiceConfig: { provider: 'mock' }
	});

	const request = new Request('http://localhost/api/contact', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			category: 'general',
			name: 'John',
			email: 'john@example.com',
			message: 'Test',
			recaptchaToken: 'mock-token'
		})
	});

	await handler({ request } as RequestEvent);

	expect(verifyRecaptcha).toHaveBeenCalledWith(
		'mock-token',
		'test-secret',
		expect.any(Number)
	);
});
```

---

## Testing CSRF Protection

```typescript
import { generateCsrfToken, validateCsrfToken } from '@goobits/forms/security/csrf';

test('generates valid CSRF token', () => {
	const token = generateCsrfToken();
	expect(token).toBeTruthy();
	expect(typeof token).toBe('string');
	expect(token.length).toBeGreaterThan(20);
});

test('validates matching CSRF tokens', () => {
	const token = generateCsrfToken();
	expect(validateCsrfToken(token, token)).toBe(true);
});

test('rejects mismatched CSRF tokens', () => {
	const token1 = generateCsrfToken();
	const token2 = generateCsrfToken();
	expect(validateCsrfToken(token1, token2)).toBe(false);
});
```

---

## E2E Testing with Playwright

### Full Form Submission Flow

```typescript
// e2e/contact-form.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/contact');
	});

	test('submits form successfully', async ({ page }) => {
		await page.fill('[name="name"]', 'John Doe');
		await page.fill('[name="email"]', 'john@example.com');
		await page.fill('[name="message"]', 'This is a test message');

		await page.click('button[type="submit"]');

		await expect(page.locator('.thank-you-message')).toBeVisible();
		await expect(page.locator('.thank-you-message')).toContainText('Thank you');
	});

	test('shows validation errors for empty fields', async ({ page }) => {
		await page.click('button[type="submit"]');

		await expect(page.locator('.error-message')).toHaveCount(3);
	});

	test('validates email format', async ({ page }) => {
		await page.fill('[name="email"]', 'invalid-email');
		await page.blur('[name="email"]');

		await expect(page.locator('.error-message')).toContainText('valid email');
	});
});
```

### Testing File Upload

```typescript
test('uploads file attachment', async ({ page }) => {
	await page.goto('/contact');

	// Upload file
	const fileInput = page.locator('input[type="file"]');
	await fileInput.setInputFiles('./test-fixtures/sample-image.jpg');

	// Verify preview appears
	await expect(page.locator('.upload-preview')).toBeVisible();

	// Fill other fields and submit
	await page.fill('[name="name"]', 'John Doe');
	await page.fill('[name="email"]', 'john@example.com');
	await page.fill('[name="message"]', 'Attached screenshot');

	await page.click('button[type="submit"]');

	await expect(page.locator('.thank-you-message')).toBeVisible();
});
```

---

## Testing Custom Validation

```typescript
import { contactSchema } from '@goobits/forms/validation';
import { z } from 'zod';

test('validates required fields', () => {
	const result = contactSchema.safeParse({});

	expect(result.success).toBe(false);
	if (!result.success) {
		expect(result.error.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ path: ['category'] }),
				expect.objectContaining({ path: ['name'] }),
				expect.objectContaining({ path: ['email'] })
			])
		);
	}
});

test('accepts valid data', () => {
	const validData = {
		category: 'general',
		name: 'John Doe',
		email: 'john@example.com',
		message: 'Test message'
	};

	const result = contactSchema.safeParse(validData);

	expect(result.success).toBe(true);
	if (result.success) {
		expect(result.data).toEqual(validData);
	}
});

test('rejects invalid email', () => {
	const result = contactSchema.safeParse({
		category: 'general',
		name: 'John',
		email: 'not-an-email',
		message: 'Test'
	});

	expect(result.success).toBe(false);
});
```

---

## Testing Rate Limiting

```typescript
// Mock rate limiter for tests
vi.mock('@goobits/forms/services/rateLimiterService', () => ({
	checkRateLimit: vi.fn().mockResolvedValue({ allowed: true })
}));

test('rate limits excessive requests', async () => {
	const { checkRateLimit } = await import('@goobits/forms/services/rateLimiterService');

	// Allow first 5 requests
	(checkRateLimit as any).mockResolvedValueOnce({ allowed: true });

	// Block 6th request
	(checkRateLimit as any).mockResolvedValueOnce({
		allowed: false,
		retryAfter: 60000
	});

	const handler = createContactApiHandler({
		adminEmail: 'admin@test.com',
		fromEmail: 'noreply@test.com',
		rateLimitMaxRequests: 5,
		emailServiceConfig: { provider: 'mock' }
	});

	// ... test rate limit behavior
});
```

---

## Test Configuration

### Vitest Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/tests/setup.ts']
	}
});
```

### Test Setup File

```typescript
// src/tests/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock browser APIs
global.fetch = vi.fn();
global.grecaptcha = {
	ready: (callback: () => void) => callback(),
	execute: vi.fn().mockResolvedValue('mock-token')
};

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	clear: vi.fn()
};
global.localStorage = localStorageMock as any;
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
	test:
		runs-on: ubuntu-latest

		steps:
			- uses: actions/checkout@v3
			- uses: actions/setup-node@v3
				with:
					node-version: 18

			- name: Install pnpm
				run: npm install -g pnpm

			- name: Install dependencies
				run: pnpm install

			- name: Run unit tests
				run: pnpm test

			- name: Run E2E tests
				run: pnpm test:e2e

			- name: Upload coverage
				uses: codecov/codecov-action@v3
```

---

## Best Practices

1. **Mock external services** - Don't send real emails or make real API calls in tests
2. **Test user interactions** - Focus on what users do, not implementation details
3. **Use data-testid** - Add test IDs for reliable element selection
4. **Test error states** - Verify validation and error handling
5. **Test accessibility** - Use testing-library's accessibility queries
6. **Isolate tests** - Each test should be independent
7. **Use factories** - Create test data factories for consistent fixtures

---

**Related:** [API Reference](./api-reference.md) | [Troubleshooting](./troubleshooting.md) | [Getting Started](./getting-started.md)
