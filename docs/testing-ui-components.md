# Testing UI Components

This guide covers how to write effective tests for Svelte UI components using Vitest and Testing Library.

## Table of Contents

- [Quick Start](#quick-start)
- [Testing Infrastructure](#testing-infrastructure)
- [Writing Tests](#writing-tests)
- [Testing Patterns](#testing-patterns)
- [Accessibility Testing](#accessibility-testing)
- [Best Practices](#best-practices)
- [Common Issues](#common-issues)

## Quick Start

### Running Tests

```bash
# Run tests in watch mode (reruns on file changes)
pnpm test:watch

# Run tests once
pnpm test:run

# Run tests with UI
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage
```

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '$lib/ui/test-utils'
import MyComponent from './MyComponent.svelte'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(MyComponent, { props: { title: 'Hello' } })
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

## Testing Infrastructure

### Files and Configuration

- **`/home/user/goobits-forms/src/lib/ui/test-utils.ts`** - Custom test utilities and helpers
- **`/home/user/goobits-forms/tests/setup.ts`** - Global test setup and mocks
- **`/home/user/goobits-forms/vitest.config.ts`** - Vitest configuration
- **`/home/user/goobits-forms/src/lib/ui/Component.test.example.ts`** - Example test template

### Available Dependencies

All testing dependencies are already installed:

- `@testing-library/svelte` - Svelte component testing utilities
- `@testing-library/jest-dom` - DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `vitest` - Test runner
- `jsdom` - DOM implementation
- `jest-axe` - Accessibility testing
- `axe-core` - Accessibility engine

### Test Utilities

The `test-utils.ts` module provides:

```typescript
// Custom render function
import { render } from '$lib/ui/test-utils'

// Re-exported Testing Library utilities
import { screen, waitFor, within } from '$lib/ui/test-utils'

// User events
import { userEvent } from '$lib/ui/test-utils'

// Vitest functions
import { vi, expect, describe, it } from '$lib/ui/test-utils'

// Helper functions
import {
  createSubmitHandler,
  createEventHandler,
  mockMatchMedia,
  createFormData,
  getValidationErrors,
  checkAccessibility,
  getFocusableElements,
  testTabOrder,
  pressKey,
  createMockFile
} from '$lib/ui/test-utils'
```

## Writing Tests

### 1. Component Rendering

Test that components render with correct props:

```typescript
import { render, screen } from '$lib/ui/test-utils'
import Button from './Button.svelte'

describe('Button', () => {
  it('renders with label', () => {
    render(Button, { props: { label: 'Click me' } })
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies variant classes', () => {
    render(Button, { props: { variant: 'primary' } })
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-primary')
  })
})
```

### 2. User Interactions

Test user events like clicks, typing, and navigation:

```typescript
import { render, screen, userEvent } from '$lib/ui/test-utils'
import Input from './Input.svelte'

describe('Input', () => {
  it('handles text input', async () => {
    render(Input, { props: { label: 'Name' } })

    const input = screen.getByLabelText('Name')
    await userEvent.type(input, 'John Doe')

    expect(input).toHaveValue('John Doe')
  })

  it('calls onChange handler', async () => {
    const handleChange = vi.fn()
    render(Input, { props: { label: 'Name', onChange: handleChange } })

    const input = screen.getByLabelText('Name')
    await userEvent.type(input, 'test')

    expect(handleChange).toHaveBeenCalled()
  })
})
```

### 3. Form Validation

Test form validation logic:

```typescript
import { render, screen, userEvent, waitFor } from '$lib/ui/test-utils'
import ContactForm from './ContactForm.svelte'

describe('ContactForm', () => {
  it('shows validation error for invalid email', async () => {
    render(ContactForm)

    const emailInput = screen.getByLabelText(/email/i)
    await userEvent.type(emailInput, 'invalid-email')
    await userEvent.tab() // Trigger blur

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const handleSubmit = vi.fn()
    render(ContactForm, { props: { onSubmit: handleSubmit } })

    await userEvent.type(screen.getByLabelText(/name/i), 'John Doe')
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled()
    })
  })
})
```

### 4. Async Operations

Test components with async data fetching:

```typescript
import { render, screen, waitFor } from '$lib/ui/test-utils'
import DataList from './DataList.svelte'

describe('DataList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state', async () => {
    global.fetch = vi.fn(() =>
      new Promise(resolve => setTimeout(() =>
        resolve({ ok: true, json: async () => ({ items: [] }) }),
        100
      ))
    )

    render(DataList)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  it('displays data after loading', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ items: ['Item 1', 'Item 2'] })
      })
    )

    render(DataList)

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })
  })

  it('handles errors', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

    render(DataList)

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
```

## Testing Patterns

### Query Priority

Use queries in this order (most to least preferred):

1. **`getByRole`** - Best for accessibility
   ```typescript
   screen.getByRole('button', { name: 'Submit' })
   screen.getByRole('textbox', { name: 'Email' })
   ```

2. **`getByLabelText`** - Good for form inputs
   ```typescript
   screen.getByLabelText('Email address')
   ```

3. **`getByPlaceholderText`** - When labels aren't available
   ```typescript
   screen.getByPlaceholderText('Enter your email')
   ```

4. **`getByText`** - For non-interactive content
   ```typescript
   screen.getByText('Welcome back')
   ```

5. **`getByTestId`** - Last resort
   ```typescript
   screen.getByTestId('custom-widget')
   ```

### Query Variants

- **`getBy`** - Throws error if not found (synchronous)
- **`queryBy`** - Returns null if not found (for asserting non-existence)
- **`findBy`** - Returns promise, waits for element (async)

```typescript
// Element must exist
const button = screen.getByRole('button')

// Check if element doesn't exist
expect(screen.queryByText('Error')).not.toBeInTheDocument()

// Wait for element to appear
const message = await screen.findByText('Success', {}, { timeout: 3000 })
```

### Testing Modals and Portals

Components that render in portals need special handling:

```typescript
import { render, screen } from '$lib/ui/test-utils'
import Modal from '$lib/ui/modals/Modal.svelte'

describe('Modal', () => {
  it('renders in portal', () => {
    render(Modal, { props: { isOpen: true, title: 'Confirm' } })

    // Modal content is rendered in document.body, not in container
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('traps focus within modal', async () => {
    render(Modal, {
      props: {
        isOpen: true,
        title: 'Confirm Action'
      }
    })

    const focusableElements = getFocusableElements(screen.getByRole('dialog'))
    testTabOrder(focusableElements)
  })
})
```

### Testing Keyboard Navigation

```typescript
import { render, screen, pressKey } from '$lib/ui/test-utils'
import Menu from '$lib/ui/menu/Menu.svelte'

describe('Menu keyboard navigation', () => {
  it('navigates with arrow keys', async () => {
    render(Menu, { props: { items: ['Item 1', 'Item 2', 'Item 3'] } })

    const menu = screen.getByRole('menu')
    await pressKey(menu, 'ArrowDown')

    expect(screen.getByText('Item 1')).toHaveFocus()

    await pressKey(menu, 'ArrowDown')
    expect(screen.getByText('Item 2')).toHaveFocus()
  })

  it('closes on Escape key', async () => {
    const handleClose = vi.fn()
    render(Menu, { props: { items: ['Item 1'], onClose: handleClose } })

    await pressKey(screen.getByRole('menu'), 'Escape')
    expect(handleClose).toHaveBeenCalled()
  })
})
```

## Accessibility Testing

### Using jest-axe

Test for accessibility violations:

```typescript
import { render } from '$lib/ui/test-utils'
import { axe, toHaveNoViolations } from 'jest-axe'
import Button from './Button.svelte'

expect.extend(toHaveNoViolations)

describe('Button accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(Button, { props: { label: 'Click me' } })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### Manual Accessibility Checks

```typescript
import { render, screen, checkAccessibility } from '$lib/ui/test-utils'
import CustomWidget from './CustomWidget.svelte'

describe('CustomWidget accessibility', () => {
  it('has accessible name', () => {
    render(CustomWidget)
    const widget = screen.getByRole('button')
    expect(widget).toHaveAccessibleName()
  })

  it('has correct ARIA attributes', () => {
    render(CustomWidget, { props: { expanded: true } })
    const widget = screen.getByRole('button')
    expect(widget).toHaveAttribute('aria-expanded', 'true')
  })

  it('is keyboard accessible', () => {
    const { container } = render(CustomWidget)
    const widget = container.querySelector('.custom-widget')

    const { isAccessible, hasRole, isKeyboardAccessible } =
      checkAccessibility(widget)

    expect(isAccessible).toBe(true)
  })
})
```

### Focus Management

```typescript
import { render, screen, getFocusableElements, testTabOrder } from '$lib/ui/test-utils'
import Dialog from './Dialog.svelte'

describe('Dialog focus management', () => {
  it('focuses first element when opened', () => {
    render(Dialog, { props: { isOpen: true } })
    const dialog = screen.getByRole('dialog')
    const focusable = getFocusableElements(dialog)

    expect(document.activeElement).toBe(focusable[0])
  })

  it('maintains correct tab order', () => {
    render(Dialog, { props: { isOpen: true } })
    const dialog = screen.getByRole('dialog')
    const focusable = getFocusableElements(dialog)

    testTabOrder(focusable) // Throws if tab order is incorrect
  })

  it('returns focus to trigger when closed', () => {
    const { component } = render(Dialog, { props: { isOpen: false } })
    const trigger = screen.getByRole('button', { name: 'Open Dialog' })

    trigger.focus()
    component.$set({ isOpen: true })
    component.$set({ isOpen: false })

    expect(document.activeElement).toBe(trigger)
  })
})
```

## Best Practices

### 1. Test User Behavior, Not Implementation

❌ Bad - Testing implementation details:
```typescript
it('updates state variable', () => {
  const { component } = render(Counter)
  component.count = 5
  expect(component.count).toBe(5)
})
```

✅ Good - Testing user-facing behavior:
```typescript
it('increments counter on button click', async () => {
  render(Counter)
  await userEvent.click(screen.getByRole('button', { name: 'Increment' }))
  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})
```

### 2. Use Semantic Queries

❌ Bad:
```typescript
const button = container.querySelector('.submit-btn')
```

✅ Good:
```typescript
const button = screen.getByRole('button', { name: /submit/i })
```

### 3. Avoid Testing Library Internals

❌ Bad:
```typescript
expect(component.$$).toBeDefined()
expect(component.$$.ctx[0]).toBe('value')
```

✅ Good:
```typescript
expect(screen.getByText('value')).toBeInTheDocument()
```

### 4. Clean Up After Tests

```typescript
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/svelte'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
```

### 5. Use Descriptive Test Names

❌ Bad:
```typescript
it('works', () => { /* ... */ })
it('test1', () => { /* ... */ })
```

✅ Good:
```typescript
it('displays validation error when email is invalid', () => { /* ... */ })
it('submits form when all required fields are filled', () => { /* ... */ })
```

### 6. Group Related Tests

```typescript
describe('ContactForm', () => {
  describe('validation', () => {
    it('validates email format', () => { /* ... */ })
    it('validates required fields', () => { /* ... */ })
  })

  describe('submission', () => {
    it('submits valid form', () => { /* ... */ })
    it('shows success message', () => { /* ... */ })
  })
})
```

### 7. Mock External Dependencies

```typescript
import { beforeEach, vi } from 'vitest'

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({ success: true })
    })
  )
})
```

## Common Issues

### Issue: Component not rendering

**Problem:** Component doesn't appear in the DOM

**Solution:** Check if you're awaiting async operations:

```typescript
// If component has onMount or async logic
await waitFor(() => {
  expect(screen.getByText('Content')).toBeInTheDocument()
})
```

### Issue: Events not triggering

**Problem:** Click or input events don't work

**Solution:** Use `userEvent` instead of `fireEvent`:

```typescript
// ❌ Don't use fireEvent
import { fireEvent } from '@testing-library/svelte'
fireEvent.click(button)

// ✅ Use userEvent
import { userEvent } from '$lib/ui/test-utils'
await userEvent.click(button)
```

### Issue: Can't find element

**Problem:** Query fails to find an element

**Solution:** Use `screen.debug()` to see current DOM:

```typescript
render(MyComponent)
screen.debug() // Prints current DOM to console
```

### Issue: Timing issues

**Problem:** Tests fail intermittently

**Solution:** Use proper waiting utilities:

```typescript
// ❌ Don't use setTimeout
setTimeout(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
}, 100)

// ✅ Use waitFor
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
}, { timeout: 3000 })

// ✅ Or use findBy (combines getBy + waitFor)
const element = await screen.findByText('Loaded')
```

### Issue: Portal components not found

**Problem:** Modal/tooltip content not in container

**Solution:** Query from `screen` instead of `container`:

```typescript
// ❌ Portal content not in container
const { container } = render(Modal, { props: { isOpen: true } })
container.querySelector('.modal') // null

// ✅ Query from screen (searches document.body)
render(Modal, { props: { isOpen: true } })
screen.getByRole('dialog') // Found!
```

## Coverage Thresholds

The project has the following coverage requirements:

- **Security-critical code:** 85-100% coverage
- **UI components:** 80% coverage (lines, functions, statements)
- **Branches:** 75% coverage

Run coverage reports with:

```bash
pnpm test:coverage
```

Coverage reports are generated in `/home/user/goobits-forms/coverage/`.

## Additional Resources

- [Testing Library Docs](https://testing-library.com/docs/svelte-testing-library/intro)
- [Vitest Documentation](https://vitest.dev/)
- [jest-dom Matchers](https://github.com/testing-library/jest-dom)
- [User Event API](https://testing-library.com/docs/user-event/intro)
- [Accessibility Testing with jest-axe](https://github.com/nickcolley/jest-axe)

## Example Tests

See `/home/user/goobits-forms/src/lib/ui/Component.test.example.ts` for comprehensive examples of:

- Basic component rendering
- User interactions
- Form validation
- Async operations
- Accessibility testing
- Context and stores
- Snapshot testing

Copy this template when creating new component tests.
