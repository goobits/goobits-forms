# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-09

### Added
- **Standalone security implementations** - Package is now fully self-contained and ready for npm publishing
  - Complete inline reCAPTCHA verification service with Google API integration
  - Multi-tier rate limiting service (short/medium/long-term + email-based limits)
  - CSRF protection middleware with SvelteKit integration
  - Added `nanoid` dependency for secure token generation
- CSRF token support for progressive enhancement in `FeedbackForm` and `ContactForm`
- Security module exports in package.json (`./security/csrf`)

### Fixed
- **Critical security fixes**:
  - Closed reCAPTCHA bypass vulnerabilities in form components
  - Fixed CSRF token generation to be synchronous (critical bug)
  - Added undefined checks and fixed open redirect vulnerability
  - Added CSRF validation to contact form API handler
- Fixed modal z-index variable name in UI components
- Fixed ContactForm.css syntax error (stray closing brace)
- Corrected TypeScript types and removed unnecessary async declarations
- Updated import paths from `.js` to `.ts` extensions for proper module resolution
- Completed `RecaptchaApiResponse` interface with all required fields

### Changed
- **Migrated from Bun to pnpm** package manager for better compatibility
- **Removed workspace dependency** on `@goobits/security` - all security code now inlined
- Refactored reCAPTCHA and rate limiter services to use inline implementations
- Updated form styling and component improvements
- Derived `RecaptchaApiResponse` type from implementation for type safety
- Upgraded VM configuration to version 2.0 with improved host sync

### Removed
- Removed `@goobits/security` workspace dependency (functionality now built-in)
- Removed client-side CSRF token generation for better security
- Removed unused CSRF duplicates

## [1.0.1] - 2025-10-12

### Fixed
- Fixed critical bug in `formService.ts` where `schema._def.shape()` was incorrectly called as a function instead of accessing the property
- Resolved Svelte 5 `$props()` rune conflict in `FeedbackForm` component that caused "Cannot access 'props' before initialization" error

### Added
- ESLint configuration with TypeScript and Svelte support
- Prettier configuration with consistent code formatting rules
- Development environment (`dev/`) for testing library components with hot-reload
- VM configuration file for development server setup

### Changed
- Formatted entire codebase with Prettier (tab-based indentation, single quotes)
- Resolved all ESLint warnings and errors across the project
- Added `dev/` directory to `.gitignore`

## [1.0.0] - 2025-10-12

Initial release of @goobits/forms - A comprehensive Svelte 5 forms library.

### Features
- Configurable form components with validation
- Support for reCAPTCHA integration
- File upload capabilities
- Multiple email service providers (Nodemailer, AWS SES)
- Rate limiting functionality
- CSRF protection
- Internationalization (i18n) support
- Category-based contact forms
- Feedback form component
- Modal system with Apple-style design
- Context menu and tooltip components
- Form field components (Input, Textarea, SelectMenu, ToggleSwitch, UploadImage)
- Comprehensive validation using Zod v4
- Screen reader accessibility features
- Custom styling with CSS variables and BEM methodology

[1.1.0]: https://github.com/goobits/forms/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/goobits/forms/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/goobits/forms/releases/tag/v1.0.0
