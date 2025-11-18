# Accessibility Testing Guide

This guide covers automated and manual accessibility testing for @goobits/ui components to ensure WCAG 2.1 AA compliance.

## Table of Contents

- [Overview](#overview)
- [Automated Testing with axe-core](#automated-testing-with-axe-core)
- [Running Accessibility Tests](#running-accessibility-tests)
- [Writing Accessibility Tests](#writing-accessibility-tests)
- [Test Utilities](#test-utilities)
- [WCAG 2.1 Compliance Checklist](#wcag-21-compliance-checklist)
- [Manual Testing](#manual-testing)
- [Common Accessibility Issues](#common-accessibility-issues)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Resources](#resources)

## Overview

@goobits/ui is committed to accessibility and WCAG 2.1 Level AA compliance. We use automated testing with **axe-core** combined with manual testing to ensure our components are accessible to all users.

### Why Accessibility Testing?

- **Legal Compliance**: Meet ADA, Section 508, and international accessibility requirements
- **Better UX**: Accessible components benefit all users, not just those with disabilities
- **SEO Benefits**: Better semantic HTML improves search engine rankings
- **Wider Audience**: Reach users who rely on assistive technologies

### Testing Stack

- **axe-core**: Industry-standard accessibility testing engine
- **jest-axe**: Axe integration for Vitest
- **Vitest**: Test runner
- **@testing-library/svelte**: Component testing utilities

## Automated Testing with axe-core

### What is axe-core?

[axe-core](https://github.com/dequelabs/axe-core) is an accessibility testing engine developed by Deque Systems. It tests against WCAG 2.0, 2.1, 2.2, and Section 508 requirements.

### What axe-core Tests

- **ARIA attributes**: Correct usage and values
- **Form labels**: All inputs have associated labels
- **Color contrast**: Text meets minimum contrast ratios
- **Keyboard navigation**: Interactive elements are keyboard accessible
- **Semantic HTML**: Proper use of HTML5 elements
- **Focus management**: Focus order and visibility
- **Alt text**: Images have appropriate alternative text
- **Headings**: Proper heading hierarchy

### Limitations

Automated testing catches approximately 30-50% of accessibility issues. Manual testing is still required for:

- Keyboard navigation flows
- Screen reader announcements
- Focus trap implementation
- Logical reading order
- Context-specific issues

## Running Accessibility Tests

### Run All Accessibility Tests

```bash
pnpm test:a11y
```

### Watch Mode

```bash
pnpm test:a11y:watch
```

### Run Tests for Specific Component

```bash
pnpm vitest run Input.a11y.test.ts
```

### Include in Standard Test Suite

```bash
pnpm test
```

All `*.a11y.test.ts` files are automatically included in the standard test run.

## Writing Accessibility Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { render } from './test-utils';
import { testAccessibility, testWCAG_AA } from '../utils/a11y-test-utils';
import YourComponent from './YourComponent.svelte';

describe('YourComponent - Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(YourComponent, {
      props: { /* your props */ }
    });

    await testAccessibility(container);
  });

  it('should meet WCAG 2.1 AA standards', async () => {
    const { container } = render(YourComponent, {
      props: { /* your props */ }
    });

    const results = await testWCAG_AA(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Testing Different States

Always test accessibility across all component states:

```typescript
describe('Button States', () => {
  it('should be accessible when disabled', async () => {
    const { container } = render(Button, {
      props: { disabled: true }
    });

    await testAccessibility(container);
  });

  it('should be accessible when loading', async () => {
    const { container } = render(Button, {
      props: { loading: true }
    });

    await testAccessibility(container);
  });

  it('should be accessible in error state', async () => {
    const { container } = render(Button, {
      props: { variant: 'error' }
    });

    await testAccessibility(container);
  });
});
```

### Testing Keyboard Navigation

```typescript
import { testKeyboardNavigation, assertFocusable } from '../utils/a11y-test-utils';

it('should be keyboard accessible', () => {
  const { container } = render(Button, {
    props: { 'aria-label': 'Submit' }
  });

  const button = container.querySelector('button');
  testKeyboardNavigation(button!);
  assertFocusable(button!);
});
```

### Testing ARIA Attributes

```typescript
import { assertARIAAttributes } from '../utils/a11y-test-utils';

it('should have proper ARIA attributes', () => {
  const { container } = render(Dialog, {
    props: {
      open: true,
      title: 'Confirm Action'
    }
  });

  const dialog = container.querySelector('[role="dialog"]');

  assertARIAAttributes(dialog!, {
    'aria-modal': 'true',
    'aria-labelledby': 'dialog-title'
  });
});
```

### Handling Color Contrast in Unit Tests

Color contrast violations often occur in unit tests because CSS is not fully loaded. Disable this rule for component tests:

```typescript
await testAccessibility(container, {
  axeOptions: {
    rules: {
      'color-contrast': { enabled: false }
    }
  }
});
```

**Important**: Run full end-to-end tests with actual CSS to verify color contrast in production.

## Test Utilities

### Core Testing Functions

#### `testAccessibility(container, options?)`

Tests for all accessibility violations.

```typescript
await testAccessibility(container, {
  wcagLevel: 'AA',
  rules: {
    'color-contrast': { enabled: false }
  }
});
```

#### `testWCAG_AA(container)`

Tests specifically for WCAG 2.1 Level AA compliance.

```typescript
const results = await testWCAG_AA(container);
expect(results).toHaveNoViolations();
```

#### `testWCAG_A(container)`

Tests for WCAG 2.1 Level A compliance (minimum).

```typescript
const results = await testWCAG_A(container);
expect(results).toHaveNoViolations();
```

#### `testKeyboardNavigation(element)`

Verifies an element can receive focus.

```typescript
const button = getByRole('button');
testKeyboardNavigation(button);
```

#### `assertFocusable(element)`

Asserts an element is focusable and can receive keyboard focus.

```typescript
const link = getByRole('link');
assertFocusable(link);
```

#### `assertARIAAttributes(element, attributes)`

Asserts specific ARIA attributes exist with expected values.

```typescript
assertARIAAttributes(dialog, {
  'aria-modal': 'true',
  'aria-labelledby': 'dialog-title'
});
```

### Specialized Testing Functions

#### `testFormLabels(container)`

Tests that all form controls have proper labels.

```typescript
const results = await testFormLabels(container);
expect(results).toHaveNoViolations();
```

#### `testARIA(container)`

Tests ARIA-specific rules.

```typescript
const results = await testARIA(container);
expect(results).toHaveNoViolations();
```

#### `testColorContrast(container)`

Tests color contrast specifically.

```typescript
const results = await testColorContrast(container);
expect(results).toHaveNoViolations();
```

### Helper Functions

#### `getFocusableElements(container)`

Returns all focusable elements within a container.

```typescript
const focusableElements = getFocusableElements(modal);
expect(focusableElements.length).toBeGreaterThan(0);
```

#### `testTabOrder(elements)`

Tests that elements can be focused in the correct order.

```typescript
const inputs = getAllByRole('textbox');
testTabOrder(inputs);
```

#### `formatViolations(results)`

Formats axe violations for debugging.

```typescript
const results = await axe(container);
if (results.violations.length > 0) {
  console.log(formatViolations(results));
}
```

## WCAG 2.1 Compliance Checklist

### Level A (Minimum)

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only means of conveying information
- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Page has a title
- [ ] Link purpose is clear
- [ ] Headings and labels are descriptive

### Level AA (Target)

- [ ] Text has contrast ratio of at least 4.5:1
- [ ] Large text has contrast ratio of at least 3:1
- [ ] Text can be resized to 200% without loss of functionality
- [ ] No images of text (except logos)
- [ ] Consistent navigation across pages
- [ ] Consistent identification of components
- [ ] Multiple ways to find pages
- [ ] Focus is visible
- [ ] Headings and labels are descriptive

### Level AAA (Aspirational)

- [ ] Text has contrast ratio of at least 7:1
- [ ] Large text has contrast ratio of at least 4.5:1
- [ ] No audio plays automatically
- [ ] Section headings are used
- [ ] Unusual words are explained

## Manual Testing

### Screen Reader Testing

Test with popular screen readers:

- **NVDA** (Windows, free): https://www.nvaccess.org/
- **JAWS** (Windows, commercial): https://www.freedomscientific.com/products/software/jaws/
- **VoiceOver** (macOS/iOS, built-in): Press Cmd+F5
- **TalkBack** (Android, built-in)

#### Screen Reader Checklist

- [ ] All interactive elements are announced
- [ ] Form labels are read correctly
- [ ] Error messages are announced
- [ ] Dynamic content updates are announced
- [ ] Modal dialogs trap focus properly
- [ ] Navigation is logical and clear
- [ ] Images have appropriate alt text

### Keyboard-Only Testing

Navigate your application using only the keyboard:

- **Tab**: Move forward through interactive elements
- **Shift+Tab**: Move backward
- **Enter**: Activate buttons and links
- **Space**: Toggle checkboxes and buttons
- **Arrow keys**: Navigate within components (menus, radio groups)
- **Escape**: Close dialogs and menus

#### Keyboard Testing Checklist

- [ ] All interactive elements are reachable
- [ ] Focus order is logical
- [ ] Focus indicator is visible
- [ ] No keyboard traps
- [ ] Shortcuts don't conflict
- [ ] Skip links work
- [ ] Modal focus trap works

### Visual Testing

- [ ] Zoom to 200% without horizontal scrolling
- [ ] Test with high contrast mode
- [ ] Test with reduced motion enabled
- [ ] Test with Windows High Contrast
- [ ] Verify color is not the only indicator

### Cognitive Testing

- [ ] Instructions are clear and concise
- [ ] Error messages are helpful
- [ ] Time limits can be extended
- [ ] Content is organized logically
- [ ] Headings create clear structure

## Common Accessibility Issues

### Issue: Missing Alt Text

**Problem**: Images don't have alt attributes.

**Solution**:
```svelte
<img src="logo.png" alt="Company Logo" />
```

Decorative images should have empty alt:
```svelte
<img src="decorative.png" alt="" />
```

### Issue: Missing Form Labels

**Problem**: Inputs don't have associated labels.

**Solutions**:

Explicit label:
```svelte
<label for="email">Email</label>
<input id="email" type="email" />
```

Aria-label:
```svelte
<input type="email" aria-label="Email address" />
```

### Issue: Insufficient Color Contrast

**Problem**: Text doesn't have 4.5:1 contrast ratio.

**Solution**: Use darker colors or larger text. Test with:
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Chrome DevTools: Inspect element > Accessibility panel

### Issue: Keyboard Trap

**Problem**: Users can't navigate away from a component with keyboard.

**Solution**: Ensure Tab, Shift+Tab, and Escape work correctly. Use focus trap for modals:

```typescript
// Modal should trap focus within itself
const focusableElements = getFocusableElements(modal);
// When Tab on last element, focus first element
// When Shift+Tab on first element, focus last element
```

### Issue: Missing Focus Indicator

**Problem**: Can't see which element has focus.

**Solution**: Always style :focus and :focus-visible:

```css
button:focus-visible {
  outline: 2px solid blue;
  outline-offset: 2px;
}
```

### Issue: Poor ARIA Usage

**Problem**: Incorrect or redundant ARIA attributes.

**Solution**: Follow the first rule of ARIA:

> "If you can use a native HTML element or attribute with the semantics and behavior you require already built in, instead of re-purposing an element and adding an ARIA role, state or property to make it accessible, then do so."

Good:
```svelte
<button>Submit</button>
```

Bad:
```svelte
<div role="button" tabindex="0">Submit</div>
```

## Best Practices

### 1. Use Semantic HTML

```svelte
<!-- Good -->
<button>Click me</button>

<!-- Bad -->
<div onclick={handleClick}>Click me</div>
```

### 2. Provide Text Alternatives

```svelte
<!-- Images -->
<img src="chart.png" alt="Sales increased 25% in Q4" />

<!-- Icon buttons -->
<button aria-label="Close dialog">
  <CloseIcon />
</button>
```

### 3. Ensure Keyboard Accessibility

```svelte
<script>
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }
</script>

<div
  role="button"
  tabindex="0"
  on:click={handleClick}
  on:keydown={handleKeyDown}
>
  Custom Button
</div>
```

### 4. Manage Focus

```svelte
<script>
  import { onMount } from 'svelte';

  let dialogElement: HTMLElement;
  let previouslyFocused: HTMLElement | null;

  onMount(() => {
    // Save previously focused element
    previouslyFocused = document.activeElement as HTMLElement;

    // Focus dialog
    dialogElement?.focus();

    return () => {
      // Restore focus when closing
      previouslyFocused?.focus();
    };
  });
</script>
```

### 5. Announce Dynamic Changes

```svelte
<!-- Success message -->
<div role="status" aria-live="polite">
  Form submitted successfully!
</div>

<!-- Error message -->
<div role="alert" aria-live="assertive">
  An error occurred. Please try again.
</div>
```

### 6. Label Everything

```svelte
<!-- Form field -->
<label>
  Email
  <input type="email" required />
</label>

<!-- Region -->
<nav aria-label="Main navigation">
  <!-- nav content -->
</nav>

<!-- Modal -->
<div role="dialog" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm Action</h2>
  <!-- dialog content -->
</div>
```

### 7. Don't Rely on Color Alone

```svelte
<!-- Bad: only uses color -->
<span style="color: red;">Required field</span>

<!-- Good: uses color + icon + text -->
<span style="color: red;">
  <ErrorIcon aria-hidden="true" />
  Required field
</span>
```

## CI/CD Integration

### GitHub Actions

Add accessibility tests to your CI pipeline:

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install

      - name: Run accessibility tests
        run: pnpm test:a11y

      - name: Upload results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: axe-violations
          path: ./axe-violations.json
```

### Pre-commit Hooks

Add accessibility tests to pre-commit hooks:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "pnpm test:a11y"
    }
  }
}
```

### Fail on Violations

Configure tests to fail the build on any violations:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // Fail fast on first test failure
    bail: 1,
    // Other config...
  }
});
```

## Resources

### Official Documentation

- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **axe-core**: https://github.com/dequelabs/axe-core
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility

### Testing Tools

- **axe DevTools**: Browser extension for manual testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built into Chrome DevTools
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/

### Screen Readers

- **NVDA**: https://www.nvaccess.org/ (Windows, free)
- **JAWS**: https://www.freedomscientific.com/products/software/jaws/ (Windows)
- **VoiceOver**: Built into macOS/iOS
- **TalkBack**: Built into Android

### Learning Resources

- **WebAIM**: https://webaim.org/
- **A11ycasts**: https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g
- **Inclusive Components**: https://inclusive-components.design/
- **The A11Y Project**: https://www.a11yproject.com/

### Communities

- **Web Accessibility Slack**: https://web-a11y.slack.com/
- **A11Y Weekly**: Newsletter with accessibility news
- **WebAIM Forum**: https://webaim.org/discussion/

## Support

For questions or issues related to accessibility:

1. Check this documentation
2. Review component-specific tests in `src/lib/ui/**/*.a11y.test.ts`
3. Open an issue on GitHub: https://github.com/goobits/forms/issues
4. Consult WCAG 2.1 guidelines: https://www.w3.org/WAI/WCAG21/quickref/

---

**Remember**: Automated tests are a starting point, not a finish line. Always complement automated testing with manual testing and real user feedback.
