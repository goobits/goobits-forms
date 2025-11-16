# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **TypeScript configuration** - Added `tsconfig.json` with strict type checking
  - Enabled strict mode with comprehensive compiler options
  - Configured to check source files while excluding tests and demo folder
  - Added Node.js types support for process and environment variables

### Fixed
- **TypeScript errors** - Resolved all 98 TypeScript errors across the codebase
  - Fixed module imports for zod, @sveltejs/kit, nanoid, and AWS dependencies
  - Corrected null/undefined handling throughout the codebase
  - Added missing type definitions and properties (e.g., `autoDetect` in FieldConfig)
  - Fixed tooltip event handler type signatures and property access
  - Resolved duplicate RateLimitResult export issue
  - Fixed implicit any types with proper type annotations
  - Updated test mocks to match new implementation signatures
- **Linting compliance** - Replaced `@ts-ignore` with `@ts-expect-error` for better type safety
  - Ensures TypeScript comments fail if the following line has no errors
  - Applied to optional peer dependency imports (nodemailer)

### Changed
- **Type safety improvements** - Enhanced type definitions across handlers and services
  - Added index signature to ContactFormData for type compatibility
  - Made `categoryToFieldMap` optional in ValidationConfig
  - Fixed SvelteKit redirect import usage (function, not RequestEvent property)
  - Improved null checking and type guards for string operations

## [1.2.2] - 2025-11-16

### Fixed
- **ToggleSwitch form submission bug** - Added `type="button"` attribute to prevent toggle from submitting parent forms
  - HTML buttons default to `type="submit"` inside forms, causing toggles to unexpectedly trigger form submissions
  - This fix eliminates the need for workarounds like `event.preventDefault()` in consuming applications

## [1.2.1] - 2025-11-12

### Changed
- **Test suite optimization** - Streamlined test coverage by removing 321 redundant tests
- **Enhanced test coverage** - Added comprehensive test coverage for critical modules (P0 and P1)

### Fixed
- Fixed exports validation filename to properly exclude from vitest runs

## [1.2.0] - 2025-11-10

### Fixed
- **Critical package.json corrections**:
  - Fixed i18n subpath export configuration
  - Corrected module extensions from `.js` to `.ts` for proper resolution
  - Fixed incorrect dependency name: `lucide-svelte` → `@lucide/svelte`
  - Added i18n directory to published files array
- **Documentation accuracy improvements**:
  - Fixed incorrect property names throughout examples (threshold → minScore, attachment → attachments)
  - Corrected Python-style comments (#) to JavaScript (//) in code examples
  - Fixed CSS variable examples to match actual implementation
  - Corrected import paths and component exports

### Changed
- **Documentation restructure** - Comprehensive audit and rewrite for clarity and consistency
  - Reduced documentation length by 40% while increasing information density
  - Improved scannability with tables, clear hierarchy, and jump links
  - Applied consistent "confident simplicity" voice (Apple-inspired minimalism)
  - Reorganized configuration examples into progressive tiers (Minimal → Complete)
  - Renamed i18n sections to use-case driven names
  - Enhanced accessibility section with detailed WCAG compliance information
- **Component documentation** - Added missing component documentation
  - Documented Modal system (Modal, Alert, Confirm, AppleModal)
  - Documented CategoryContactForm usage and comparison
  - Added Menu and Tooltip system documentation
  - Improved DemoPlayground usage instructions

### Removed
- Removed emoji clutter from documentation (retained only Security Notice indicator)
- Cleaned verbose table of contents in favor of concise jump links

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

[1.2.2]: https://github.com/goobits/forms/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/goobits/forms/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/goobits/forms/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/goobits/forms/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/goobits/forms/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/goobits/forms/compare/v0.0.0...v1.0.0
