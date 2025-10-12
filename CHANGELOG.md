# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.1]: https://github.com/goobits/forms/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/goobits/forms/releases/tag/v1.0.0
