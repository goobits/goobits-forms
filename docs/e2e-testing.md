# E2E Testing Guide

This guide covers end-to-end (E2E) testing for the @goobits/ui package using Playwright.

## Table of Contents

- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Structure](#test-structure)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Debugging](#debugging)
- [Accessibility Testing](#accessibility-testing)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Project dependencies installed

### Installation

Playwright and dependencies are already installed as part of the project setup. To install browsers:

```bash
pnpm playwright install --with-deps
```

This will install Chromium, Firefox, and WebKit browsers along with their system dependencies.

## Running Tests

### Basic Commands

```bash
# Run all E2E tests
pnpm test:e2e

# Run tests in UI mode (interactive)
pnpm test:e2e:ui

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Run tests in debug mode
pnpm test:e2e:debug

# Generate test code
pnpm test:e2e:codegen

# View HTML report
pnpm test:e2e:report
```

### Running Specific Tests

```bash
# Run a specific test file
pnpm playwright test e2e/components/button.spec.ts

# Run tests matching a pattern
pnpm playwright test --grep "accessibility"

# Run tests on a specific browser
pnpm playwright test --project=chromium
pnpm playwright test --project=firefox
pnpm playwright test --project=webkit
```

### Parallel Execution

Tests run in parallel by default. To control parallelism:

```bash
# Run tests sequentially
pnpm playwright test --workers=1

# Run with specific number of workers
pnpm playwright test --workers=4
```

## Writing Tests

### Test Structure

Tests are organized in the `/e2e` directory:

```
e2e/
├── fixtures/          # Test helpers and utilities
├── components/        # Component-specific tests
├── accessibility/     # Accessibility tests
└── integration/       # Integration and flow tests
```

### Basic Test Example

```typescript
import { test, expect } from '../fixtures/test-helpers'

test.describe('Component Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should do something', async ({ page }) => {
    // Arrange
    const element = page.locator('selector')

    // Act
    await element.click()

    // Assert
    await expect(element).toBeVisible()
  })
})
```

### Using Test Helpers

```typescript
import { test, expect, checkA11y, waitForVisible } from '../fixtures/test-helpers'

test('should be accessible', async ({ page }) => {
  await page.goto('/')

  // Check accessibility
  await checkA11y(page)

  // Wait for element
  await waitForVisible(page, '.my-element')
})
```

### Mocking API Responses

```typescript
test('should handle API responses', async ({ page }) => {
  // Mock API endpoint
  await page.route('**/api/contact', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    })
  })

  await page.goto('/')
  // Test continues...
})
```

## Test Structure

### Component Tests

Component tests focus on individual UI components:

- **Button tests** - Click, keyboard navigation, states
- **Modal tests** - Open/close, focus trap, backdrop
- **Form tests** - Validation, submission, error handling
- **Menu tests** - Navigation, keyboard interaction
- **Tooltip tests** - Show/hide, positioning
- **Toast tests** - Notifications, auto-dismiss

### Integration Tests

Integration tests verify complete user flows:

- **Contact form flow** - Full form submission process
- **Multi-step processes** - Complex workflows
- **Error scenarios** - Error handling and recovery

### Accessibility Tests

Accessibility tests use @axe-core/playwright to verify WCAG compliance:

- Color contrast
- Keyboard navigation
- Screen reader compatibility
- ARIA attributes
- Form labels
- Heading hierarchy

## Best Practices

### 1. Use Proper Selectors

```typescript
// Good: Use semantic selectors
const submitButton = page.getByRole('button', { name: 'Submit' })
const emailInput = page.getByLabel('Email')

// Avoid: CSS selectors when possible
const button = page.locator('.btn-submit')
```

### 2. Wait for Elements

```typescript
// Good: Wait for element to be ready
await page.waitForSelector('.modal', { state: 'visible' })
await element.waitFor({ state: 'attached' })

// Avoid: Fixed timeouts
await page.waitForTimeout(1000) // Use sparingly
```

### 3. Test User Behavior

```typescript
// Good: Test what users do
await page.getByRole('button', { name: 'Submit' }).click()
await page.getByLabel('Email').fill('user@example.com')

// Avoid: Testing implementation details
await page.evaluate(() => window.submitForm())
```

### 4. Handle Asynchronous Operations

```typescript
// Good: Properly await async operations
await submitButton.click()
await page.waitForLoadState('networkidle')

// Avoid: Not awaiting promises
submitButton.click() // Wrong!
```

### 5. Clean Test Data

```typescript
test.beforeEach(async ({ page }) => {
  // Clear localStorage/cookies
  await page.context().clearCookies()
  await page.evaluate(() => localStorage.clear())
})
```

### 6. Use Test Isolation

Each test should be independent and not rely on the state from other tests.

```typescript
test.describe('Independent tests', () => {
  test.beforeEach(async ({ page }) => {
    // Reset to known state
    await page.goto('/')
  })

  test('test 1', async ({ page }) => {
    // This test doesn't depend on test 2
  })

  test('test 2', async ({ page }) => {
    // This test doesn't depend on test 1
  })
})
```

## CI/CD Integration

### GitHub Actions

E2E tests run automatically on push and pull requests via GitHub Actions.

See `.github/workflows/e2e.yml` for configuration.

### Local CI Simulation

To run tests as they would in CI:

```bash
CI=true pnpm test:e2e
```

This enables:
- `forbidOnly` - Fails if `test.only` is used
- Retries (2 retries on failure)
- Single worker (sequential execution)

## Debugging

### Interactive Debugging

```bash
# Debug mode with Playwright Inspector
pnpm test:e2e:debug

# Debug a specific test
pnpm playwright test --debug e2e/components/button.spec.ts
```

### Headed Mode

See the browser while tests run:

```bash
pnpm test:e2e:headed
```

### Screenshots and Videos

Playwright automatically captures:
- Screenshots on failure
- Videos on first retry
- Traces on first retry

View them in the HTML report:

```bash
pnpm test:e2e:report
```

### Console Logs

```typescript
test('debug test', async ({ page }) => {
  // Log to console
  page.on('console', msg => console.log(msg.text()))

  // Pause execution
  await page.pause()
})
```

### VS Code Debugging

1. Install Playwright VS Code extension
2. Set breakpoints in test files
3. Run "Debug Test" from the test explorer

## Accessibility Testing

### Running Accessibility Tests

```bash
# Run all accessibility tests
pnpm playwright test e2e/accessibility/

# Run with verbose output
pnpm playwright test e2e/accessibility/ --reporter=verbose
```

### Writing Accessibility Tests

```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()

  expect(results.violations).toEqual([])
})
```

### Checking Specific Components

```typescript
test('form should be accessible', async ({ page }) => {
  await page.goto('/')

  const results = await new AxeBuilder({ page })
    .include('form')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()

  expect(results.violations).toEqual([])
})
```

### Excluding Known Issues

```typescript
const results = await new AxeBuilder({ page })
  .exclude('.third-party-widget') // Exclude elements you don't control
  .analyze()
```

## Visual Regression Testing

Playwright supports screenshot comparison:

```typescript
test('should match screenshot', async ({ page }) => {
  await page.goto('/')

  // Take and compare screenshot
  await expect(page).toHaveScreenshot('homepage.png')

  // Compare element screenshot
  await expect(page.locator('form')).toHaveScreenshot('contact-form.png')
})
```

Update screenshots:

```bash
pnpm playwright test --update-snapshots
```

## Troubleshooting

### Tests Failing Locally but Passing in CI

- Check browser versions
- Verify environment variables
- Clear browser cache and storage
- Check for timing issues

### Flaky Tests

- Add proper waits (`waitForSelector`, `waitForLoadState`)
- Avoid fixed timeouts
- Ensure test isolation
- Check for race conditions

### Performance Issues

- Run fewer workers: `--workers=2`
- Run specific test files
- Use `test.only` during development (remove before commit)

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)

## Support

For issues or questions:
- Open an issue on [GitHub](https://github.com/goobits/forms/issues)
- Check existing E2E tests for examples
- Review Playwright documentation
