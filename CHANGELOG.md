# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-18

### BREAKING CHANGES

- **Package renamed from `@goobits/forms` to `@goobits/ui`**
  - This package has been renamed to better reflect its expanded scope beyond forms
  - Now includes 30+ UI components: forms, buttons, cards, modals, menus, tooltips, notifications, and more
  - **Migration required**: See [MIGRATION.md](./MIGRATION.md) for complete upgrade instructions
  - All exports, component names, and APIs remain exactly the same
  - Only the package name has changed

- **Project structure reorganized**
  - All source files moved to `/src/lib/` (SvelteKit standard)
  - Build output now in `/dist/` directory
  - TypeScript compiled to JavaScript with type definitions

### Added - New UI Components (15 total)

#### Form Components
- **Button** - Comprehensive button component with 5 variants (primary, secondary, outline, ghost, danger), 3 sizes, loading states, icon support
- **Checkbox** - Single checkbox with indeterminate state support
- **CheckboxGroup** - Manage multiple related checkboxes with vertical/horizontal layouts
- **Radio** - Custom-styled radio button component
- **RadioGroup** - Radio button group with arrow key navigation and descriptions
- **Slider** - Single value and range slider with keyboard navigation, custom marks, and value formatting
- **DatePicker** - Date selection with dropdown calendar, locale support, and min/max constraints
- **DateRangePicker** - Select start and end dates with validation

#### UI Components
- **Card** - Flexible card container with 3 variants (elevated, outlined, filled)
- **CardHeader** - Card header with title, subtitle, and action slots
- **CardBody** - Card body content wrapper
- **CardFooter** - Card footer with alignment options
- **Badge** - Status badge/chip with 6 color variants, dismissible option, and status dots
- **Toast** - Toast notification component with auto-dismiss and action buttons
- **ToastContainer** - Container for managing multiple toast notifications
- **ToastProvider** - App-level provider for toast system

#### Utilities
- **25+ date utility functions** - Date formatting, parsing, manipulation, and calendar helpers
- **Accessibility test utilities** - Comprehensive a11y testing helpers with axe-core
- **Component test utilities** - Testing helpers for Svelte components

### Added - Testing Infrastructure

#### Unit Testing
- **@testing-library/svelte** integration for component testing
- **1,300+ unit tests** across all components
- **Test utilities module** with render helpers, mocks, and fixtures
- **Test templates and examples** for writing component tests
- **Enhanced Vitest configuration** with UI component coverage

#### Accessibility Testing
- **axe-core + jest-axe** integration for automated a11y testing
- **200+ accessibility tests** verifying WCAG 2.1 AA compliance
- **Dedicated a11y test utilities** for common testing patterns
- **Comprehensive documentation** for accessibility testing
- **Tests for Input, Textarea, Checkbox, Radio, Slider, DatePicker, and more**

#### E2E Testing
- **Playwright** test framework with multi-browser support
- **102 comprehensive E2E tests** covering components, integration, and accessibility
- **5 browsers tested**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Component E2E tests**: Button, Modal, Form, Menu, Tooltip, Toast
- **Integration tests**: Full contact form flow with validation
- **18 accessibility E2E tests** with @axe-core/playwright
- **GitHub Actions CI/CD workflow** for automated testing

### Added - Build & Development

- **TypeScript build compilation**
  - Configured `@sveltejs/package` for compiling TypeScript to JavaScript
  - Generates `.js`, `.d.ts`, and `.d.ts.map` files
  - 236 files built to `/dist/` directory for publishing
  - Proper module resolution for better compatibility

- **Improved type safety**
  - Removed explicit `any` types from config, handlers, and validation modules
  - Replaced with proper TypeScript types (`Record<string, unknown>`, `z.AnyZodObject`, etc.)
  - Enabled ESLint warnings for `no-explicit-any`

### Added - Documentation

- **MIGRATION.md** - Comprehensive guide for upgrading from @goobits/forms
- **docs/testing-ui-components.md** - Guide for writing component tests
- **docs/accessibility-testing.md** - Complete a11y testing guide with WCAG checklist
- **docs/e2e-testing.md** - E2E testing guide with Playwright
- **15+ component example files** (.example.md) with usage examples and API docs

### Changed

- **Package scope expanded** from forms-only to comprehensive UI library
  - Originally: 12 components (mostly forms)
  - Now: 30+ components (forms, buttons, cards, modals, menus, tooltips, notifications)

- **Component organization**
  - All components now in `/src/lib/ui/` directory
  - Better logical grouping (modals/, menu/, tooltip/, toast/)
  - Improved export structure

- **Build system**
  - Switched from raw TypeScript publishing to compiled JavaScript
  - Added pre-publish build step
  - Cleaner distribution package

### Why This Change?

The package originally focused on form components but has evolved into a comprehensive UI component library:

**Existing Components (Pre-2.0):**
- Forms: ContactForm, FeedbackForm, CategoryContactForm, FormField
- Inputs: Input, Textarea, SelectMenu, ToggleSwitch, UploadImage
- Modals: Modal, Alert, Confirm, AppleModal (8+ components)
- Menus: Menu, ContextMenu, MenuItem, MenuSeparator
- Tooltips: Tooltip system with positioning engine
- Other: FormErrors, ThankYou, DemoPlayground

**New Components (2.0):**
- Button, Badge, Card (+ Header/Body/Footer)
- Checkbox, CheckboxGroup, Radio, RadioGroup
- Slider, DatePicker, DateRangePicker
- Toast notification system

The new name `@goobits/ui` better represents this comprehensive UI library.

### Migration Steps

1. Uninstall old package: `npm uninstall @goobits/forms`
2. Install new package: `npm install @goobits/ui`
3. Find and replace: `@goobits/forms` → `@goobits/ui` in all files
4. Verify imports and CSS paths are updated
5. Clear cache and rebuild: `rm -rf node_modules .svelte-kit && npm install && npm run build`

See [MIGRATION.md](./MIGRATION.md) for detailed instructions and troubleshooting.

### Deprecation Notice

- The `@goobits/forms` package will receive security fixes only until **June 1, 2026**
- After June 1, 2026, `@goobits/forms` will be deprecated and no longer maintained
- All new features and updates will be published to `@goobits/ui`

### Test Coverage

- **1,500+ total tests** (unit + accessibility + E2E)
- **95%+ coverage** on security-critical code
- **80%+ coverage** on UI components
- **WCAG 2.1 AA compliance** verified across all components
- **Cross-browser compatibility** tested (Chrome, Firefox, Safari, Mobile)

---

## [1.3.1] - 2025-11-16

### Changed
- **Build configuration** - Added workspace configuration for standalone package publishing
  - Added `pnpm-workspace.yaml` for better monorepo integration
  - Improved package publishing workflow

### Fixed
- **NPM package** - Excluded test files and dev configs from published package
  - Added comprehensive `.npmignore` to reduce package size
  - Excluded tests, demos, and development configurations
  - Cleaner package distribution for consumers

## [1.3.0] - 2025-11-16

### Added
- **New FormLabel component** - Generic form field wrapper using Svelte 5 Snippets
  - Wraps inputs with label, help text, and error/success messages
  - Flexible composition pattern for custom form layouts
  - Built-in error/success icons with SVG
  - Configurable optional text indicator
  - Inline and block layout modes
  - Full BEM naming methodology
  - High contrast mode support
- **Input component enhancements**
  - Added `hasError` prop for explicit error state (ARIA support)
  - Added `describedBy` prop for linking to error/help text elements
  - Added `data-testid` prop for automated testing support
  - Added `aria-invalid` and `aria-describedby` attributes
  - Improved screen reader announcements for validation errors
- **Textarea component enhancements**
  - Added `hasError` prop for explicit error state (ARIA support)
  - Added `describedBy` prop for linking to error/help text elements
  - Added `aria-invalid` and `aria-describedby` attributes
  - Matches Input component accessibility improvements

### Changed
- **BEM naming refactor** - Migrated to consistent BEM methodology
  - Input: `.input-group` → `.input__group`, `.input-sm` → `.input--sm`, etc.
  - Textarea: Established `.textarea__input` namespace, `.char-counter` → `.textarea__char-counter`, etc.
  - Clear distinction between elements (`__`) and modifiers (`--`)
  - Better CSS isolation and maintainability
  - ⚠️ **Breaking**: CSS class names changed (see CONTRIBUTION.md for migration guide)

### Documentation
- Added comprehensive CONTRIBUTION.md with migration guide
- Documented all accessibility improvements
- Provided usage examples for new props
- Included backward compatibility notes

## [1.2.3] - 2025-11-16

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

Initial release of @goobits/ui - A comprehensive Svelte 5 forms library.

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

[1.2.3]: https://github.com/goobits/forms/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/goobits/forms/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/goobits/forms/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/goobits/forms/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/goobits/forms/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/goobits/forms/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/goobits/forms/compare/v0.0.0...v1.0.0
