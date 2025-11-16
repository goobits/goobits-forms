# Contribution: Form Component Improvements

## Overview
This contribution enhances the `Input.svelte` and `Textarea.svelte` components with improved accessibility, consistent BEM naming, and better testing support. It also adds a new `FormLabel.svelte` component for flexible form field composition using Svelte 5 Snippets.

## Changes Made

### 1. Input.svelte Improvements

#### New Props
- **`hasError`** (boolean): Explicit error state for ARIA support
  - Complements `variant` prop for programmatic error detection
  - Used for `aria-invalid` attribute

- **`describedBy`** (string): ARIA describedby support
  - Allows linking to error messages or help text
  - Improves screen reader experience

- **`data-testid`** (string): Testing support
  - Enables easier automated testing
  - Standard testing attribute

#### ARIA Attributes
All input elements now include:
```svelte
aria-invalid={hasError || variant === 'error'}
aria-describedby={describedBy}
data-testid={dataTestId}
```

This provides:
- Screen reader error announcements
- Programmatic error state detection
- Better testing capabilities

#### BEM Naming Improvements
Changed from loose naming to consistent BEM methodology:

**Before:**
```css
.input-group
.input-group-input
.input-group-prefix
.input-group-suffix
.input-sm
.input-error
.input-with-prefix
```

**After:**
```css
.input__group          /* Element */
.input__input          /* Element */
.input__prefix         /* Element */
.input__suffix         /* Element */
.input--sm             /* Modifier */
.input--error          /* Modifier */
.input--with-prefix    /* Modifier */
```

**Benefits:**
- Clear distinction between elements (`__`) and modifiers (`--`)
- Easier CSS maintenance and debugging
- Better isolation and namespace protection
- Industry-standard BEM methodology

---

### 2. Textarea.svelte Improvements

#### New Props
- **`hasError`** (boolean): Explicit error state for ARIA
- **`describedBy`** (string): ARIA describedby support

#### ARIA Attributes
```svelte
aria-invalid={hasError || variant === 'error'}
aria-describedby={describedBy}
```

#### BEM Naming Improvements
Changed from mixed naming to consistent BEM:

**Before:**
```css
.textarea
.input                    /* Reused from Input */
.input-sm
.input-error
.textarea-auto-resize
.char-counter
.char-counter-error
```

**After:**
```css
.textarea
.textarea__input          /* Element - specific to textarea */
.textarea__input--sm      /* Modifier */
.textarea__input--error   /* Modifier */
.textarea--auto-resize    /* Modifier */
.textarea__char-counter   /* Element */
.textarea__char-counter--error  /* Modifier */
```

**Benefits:**
- Textarea has its own namespace (no shared `.input` class)
- All classes follow BEM convention
- Easier to maintain and override styles
- Clear component boundaries

---

### 3. FormLabel.svelte (New Component)

A new generic form field wrapper component using Svelte 5 Snippets for flexible composition.

#### Features
- **Snippet-based composition**: Wraps any form input with label, help text, and messages
- **No framework lock-in**: No i18n dependencies - fully customizable
- **Built-in validation UI**: Error and success messages with SVG icons
- **Flexible layouts**: Inline and block modes
- **BEM naming**: Consistent `.form-label__*` namespace
- **Accessibility**: Proper label-input association, role="alert" for errors

#### Props
- `label` (string): Label text
- `id` (string): Field ID for label-input linking
- `required` (boolean): Shows required indicator (*)
- `optional` (boolean): Shows optional indicator
- `helpText` (string): Help text shown below input
- `error` (string): Error message (with icon)
- `success` (string): Success message (with icon)
- `inline` (boolean): Horizontal layout
- `optionalText` (string): Custom optional indicator text (default: "(optional)")
- `children` (Snippet): The form input element

#### Usage Example
```svelte
<script>
  import { Input, FormLabel } from '@goobits/forms/ui';

  let email = '';
  let emailError = '';
</script>

<FormLabel
  label="Email Address"
  id="email"
  required
  helpText="We'll never share your email"
  error={emailError}
>
  <Input
    id="email"
    type="email"
    bind:value={email}
    hasError={!!emailError}
    describedBy={emailError ? 'email-error' : 'email-help'}
    placeholder="you@example.com"
  />
</FormLabel>
```

#### BEM Classes
```css
.form-label              /* Block */
.form-label--inline      /* Modifier: horizontal layout */
.form-label__text        /* Element: label text */
.form-label__text--required   /* Modifier: required field */
.form-label__optional    /* Element: optional indicator */
.form-label__help        /* Element: help text */
.form-label__error       /* Element: error message */
.form-label__success     /* Element: success message */
.form-label__icon        /* Element: SVG icons */
```

**Benefits:**
- Modern Svelte 5 pattern (Snippets)
- No external dependencies
- Consistent with Input/Textarea BEM naming
- Fully customizable and reusable
- Works with any input component

---

## Accessibility Improvements Summary

### Screen Reader Support
1. **Error State Announcements**: `aria-invalid` attribute announces validation errors
2. **Descriptive Links**: `aria-describedby` connects inputs to help text and error messages
3. **Semantic HTML**: Proper use of native input attributes

### Keyboard Navigation
- All improvements maintain existing keyboard navigation
- Focus states remain unchanged
- High contrast mode support preserved

### Testing
- `data-testid` attribute enables reliable automated testing
- Consistent selectors across components

---

## Migration Guide

### For Existing Users

#### Input Component
```svelte
<!-- Before -->
<Input variant="error" />

<!-- After - Enhanced error handling -->
<Input
  variant="error"
  hasError={true}
  describedBy="email-error"
  data-testid="email-input"
/>

<!-- Error message element -->
<span id="email-error" class="error-message">
  Invalid email address
</span>
```

#### Textarea Component
```svelte
<!-- Before -->
<Textarea variant="error" />

<!-- After - Enhanced error handling -->
<Textarea
  variant="error"
  hasError={true}
  describedBy="message-error"
/>

<!-- Error message element -->
<span id="message-error" class="error-message" role="alert">
  Message is required
</span>
```

### CSS Migration

#### If you have custom CSS overrides

**Input.svelte - Update selectors:**
```css
/* Before */
.input-group { }
.input-sm { }
.input-error { }

/* After */
.input__group { }
.input--sm { }
.input--error { }
```

**Textarea.svelte - Update selectors:**
```css
/* Before */
.char-counter { }
.char-counter-error { }
.textarea-auto-resize { }

/* After */
.textarea__char-counter { }
.textarea__char-counter--error { }
.textarea--auto-resize { }
```

---

## Testing

### Manual Testing Performed
- ✅ Input renders with all variants (default, error, success)
- ✅ Textarea auto-resize works correctly
- ✅ ARIA attributes are correctly applied
- ✅ BEM classes are correctly applied
- ✅ High contrast mode works
- ✅ Keyboard navigation unchanged
- ✅ Screen reader announces errors

### Recommended Automated Tests
```typescript
// Test ARIA attributes
expect(input).toHaveAttribute('aria-invalid', 'true');
expect(input).toHaveAttribute('aria-describedby', 'error-id');
expect(input).toHaveAttribute('data-testid', 'my-input');

// Test BEM classes
expect(wrapper).toHaveClass('input__group');
expect(input).toHaveClass('input--error');
```

---

## Backward Compatibility

### Breaking Changes
⚠️ **CSS class names have changed**

If you have custom CSS targeting these components, you'll need to update selectors. The component functionality and props API remain backward compatible (new props are optional).

### Non-Breaking Changes
- New props are optional (default values maintain existing behavior)
- All existing props work unchanged
- Component behavior is identical

---

## Benefits

### For Developers
- Clearer CSS architecture with BEM
- Easier debugging with consistent naming
- Better testing with data-testid
- Type-safe props with TypeScript

### For Users
- Improved screen reader experience
- Better error announcements
- Consistent accessibility across forms

---

## Files Changed
- `ui/Input.svelte` - Added props, ARIA attributes, BEM naming
- `ui/Textarea.svelte` - Added props, ARIA attributes, BEM naming
- `ui/FormLabel.svelte` - New component (Svelte 5 Snippet-based wrapper)
- `ui/index.ts` - Added FormLabel export
- `package.json` - Version bump to 1.3.0
- `CHANGELOG.md` - Documented v1.3.0 changes

## Lines Changed
- Input.svelte: ~50 lines (props, attributes, CSS)
- Textarea.svelte: ~40 lines (props, attributes, CSS)
- FormLabel.svelte: ~190 lines (new component)
- Documentation: ~300 lines (CHANGELOG, CONTRIBUTION.md updates)
- Total: ~580 lines of improvements

---

## Questions or Feedback?

If you have questions about these changes or suggestions for improvements, please open an issue or discussion on the repository.
