# Migration Guide

Upgrade guides for @goobits/ui version migrations.

---

## v2.x → v3.0.0

Version 3 removes general-purpose server security exports from the UI package.
Install `@goobits/security` and import the required owner directly:

```ts
import { createSvelteKitCsrf } from '@goobits/security/csrf/sveltekit';
import { createRateLimiter } from '@goobits/security/rate-limit';
import { verifyRecaptcha } from '@goobits/security/recaptcha';
```

The built-in contact handlers already use these implementations. Applications
that create tokens should configure `createSvelteKitCsrf` once and call
`getOrCreate(event)` from loads or token endpoints. See the root
[migration guide](../MIGRATION.md#v300---canonical-security-ownership).

---

## v1.1.0 → v1.2.0

**Release Date:** 2025-11-10

### Breaking Changes

None - fully backward compatible.

### Important Updates

**1. Import Path Corrections**

If you were using incorrect import paths (which would have caused errors), update them:

```javascript
// AVOID: Old (incorrect - would have errored)
import { ContactForm } from '@goobits/ui';

// RECOMMENDED: New (correct)
import { ContactForm } from '@goobits/ui/ui';
```

**2. Configuration Property Names**

Update configuration to use correct property names:

```javascript
// AVOID: Old (incorrect - never worked)
const config = {
	uploads: {
		enabled: true,
		maxSize: '5MB',
		allowedTypes: ['image/jpeg']
	}
};

// RECOMMENDED: New (correct)
const config = {
	fileSettings: {
		maxFileSize: 5 * 1024 * 1024, // 5MB in bytes
		acceptedImageTypes: ['image/jpeg', 'image/png']
	}
};
```

**3. reCAPTCHA Property Name**

```javascript
// AVOID: Old
recaptcha: {
	threshold: 0.5
}

// RECOMMENDED: New
recaptcha: {
	minScore: 0.5
}
```

### New Features

- **Menu and Tooltip Documentation** - Components were available but undocumented
- **Modal System Documentation** - Complete Modal, Alert, Confirm, AppleModal docs
- **Improved Documentation** - 40% shorter, more scannable, better organized

### Migration Steps

1. **Review imports** - Ensure all imports use correct paths
2. **Update config** - Change `uploads` → `fileSettings` if using file uploads
3. **Update reCAPTCHA** - Change `threshold` → `minScore` if using reCAPTCHA
4. **Test thoroughly** - No behavior changes, but verify configuration

---

## v1.0.1 → v1.1.0

**Release Date:** 2025-11-09

### Breaking Changes

**1. Historical security bundling (superseded in v3)**

Version 1.1 temporarily bundled server security inside the UI package. Those
paths were removed in v3; current applications should follow the v3 guide above.

**2. Package Manager Change**

Migrated from Bun to pnpm. Update scripts if you were using Bun-specific features.

```json
// package.json - use pnpm instead of bun
{
	"scripts": {
		"dev": "pnpm run dev"
	}
}
```

### New Features

- **Inline reCAPTCHA Verification** - Complete Google reCAPTCHA integration
- **Multi-tier Rate Limiting** - Short/medium/long-term + email-based limits
- **CSRF Protection Middleware** - Built-in SvelteKit integration
- **Progressive Enhancement** - CSRF tokens in FeedbackForm and ContactForm

### Migration Steps

These historical steps are intentionally omitted because they would recreate a
security boundary that no longer exists.

### Security Improvements

- Fixed reCAPTCHA bypass vulnerabilities
- Fixed CSRF token generation bug (critical)
- Added undefined checks for open redirect prevention
- Added CSRF validation to contact form handler

---

## v1.0.0 → v1.0.1

**Release Date:** 2025-10-12

### Breaking Changes

None - bug fix release.

### Bug Fixes

- Fixed `schema._def.shape()` function call error in formService.ts
- Fixed Svelte 5 `$props()` rune initialization error in FeedbackForm

### Migration Steps

No changes required - update package version:

```bash
npm install @goobits/ui@1.0.1
```

---

## Upgrading from Pre-1.0

If upgrading from a pre-release version, follow these steps:

### 1. Update Package

```bash
npm install @goobits/ui@latest
```

### 2. Update Dependencies

Ensure you have required peer dependencies:

```bash
npm install @sveltejs/kit svelte formsnap sveltekit-superforms zod
```

### 3. Update Imports

Change to new import paths:

```javascript
// Forms
import { ContactForm, FeedbackForm } from '@goobits/ui/ui';

// Configuration
import { initContactFormConfig } from '@goobits/ui/config';

// Handlers
import { createContactApiHandler } from '@goobits/ui/handlers/contactFormHandler';

// Validation
import { contactSchema } from '@goobits/ui/validation';
```

### 4. Update Configuration

Use new configuration format:

```javascript
const contactConfig = {
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
		siteKey: 'YOUR_SITE_KEY',
		minScore: 0.5
	},
	fileSettings: {
		maxFileSize: 5 * 1024 * 1024,
		acceptedImageTypes: ['image/jpeg', 'image/png']
	}
};

initContactFormConfig(contactConfig);
```

### 5. Update Zod to v4

```bash
npm install zod@^4.0.0
```

Update validation schemas to Zod v4 syntax if using custom schemas.

---

## Version Comparison

| Feature | v1.0.0 | v1.1.0 | v1.2.0 |
|---------|--------|--------|--------|
| Contact Forms | ✅ | ✅ | ✅ |
| reCAPTCHA | ✅ | ✅ (improved) | ✅ |
| CSRF Protection | ✅ | ✅ (fixed bug) | ✅ |
| Rate Limiting | ✅ | ✅ (multi-tier) | ✅ |
| i18n Support | ✅ | ✅ | ✅ |
| File Uploads | ✅ | ✅ | ✅ |
| Modal System | ✅ | ✅ | ✅ (documented) |
| Menu Components | ✅ | ✅ | ✅ (documented) |
| Tooltip System | ✅ | ✅ | ✅ (documented) |
| Standalone Security | ❌ | ✅ | ✅ |
| Package Manager | Bun | pnpm | pnpm |
| Documentation | Good | Good | Excellent |

---

## Need Help?

- [Troubleshooting Guide](./troubleshooting.md)
- [GitHub Issues](https://github.com/goobits/forms/issues)
- [Changelog](../CHANGELOG.md) - Detailed version history

---

**After migrating:**
- [Configuration Guide](./configuration.md) - Update your config
- [API Reference](./api-reference.md) - Check new features
- [Troubleshooting](./troubleshooting.md) - Resolve migration issues
