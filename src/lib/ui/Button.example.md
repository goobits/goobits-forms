# Button Component Examples

The Button component is a flexible, accessible button that supports multiple variants, sizes, states, and icons.

## Basic Usage

```svelte
<script>
  import { Button } from '@goobits/ui';
</script>

<Button>Click me</Button>
```

## Variants

### Primary (Default)
The primary variant uses your theme's primary color. Use it for the main call-to-action.

```svelte
<Button variant="primary">
  Save Changes
</Button>
```

### Secondary
A neutral variant for less prominent actions.

```svelte
<Button variant="secondary">
  Cancel
</Button>
```

### Outline
A transparent button with a border. Great for secondary actions that need less visual weight.

```svelte
<Button variant="outline">
  View Details
</Button>
```

### Ghost
A minimal button with no background or border. Ideal for tertiary actions.

```svelte
<Button variant="ghost">
  Learn More
</Button>
```

### Danger
Use for destructive actions that require extra attention.

```svelte
<Button variant="danger">
  Delete Account
</Button>
```

## Sizes

### Small
```svelte
<Button size="sm">
  Small Button
</Button>
```

### Medium (Default)
```svelte
<Button size="md">
  Medium Button
</Button>
```

### Large
```svelte
<Button size="lg">
  Large Button
</Button>
```

## States

### Disabled
```svelte
<Button disabled>
  Disabled Button
</Button>
```

### Loading
Shows a spinner and prevents interaction while an async operation is in progress.

```svelte
<script>
  import { Button } from '@goobits/ui';

  let isLoading = $state(false);

  async function handleSubmit() {
    isLoading = true;
    try {
      await submitForm();
    } finally {
      isLoading = false;
    }
  }
</script>

<Button loading={isLoading} onclick={handleSubmit}>
  Submit Form
</Button>
```

## Button Types

### Submit Button (for forms)
```svelte
<form onsubmit={handleSubmit}>
  <Button type="submit">
    Submit
  </Button>
</form>
```

### Reset Button
```svelte
<Button type="reset">
  Reset Form
</Button>
```

### Regular Button (Default)
```svelte
<Button type="button" onclick={handleClick}>
  Click Me
</Button>
```

## Full Width

Make the button span the full width of its container.

```svelte
<Button fullWidth>
  Full Width Button
</Button>
```

## As a Link

When you provide an `href`, the button renders as an anchor element while maintaining button styling.

```svelte
<Button href="/docs" variant="ghost">
  Documentation
</Button>

<Button href="/pricing" variant="primary">
  View Pricing
</Button>
```

**Note:** Links cannot be disabled or loading. If you set `disabled={true}` or `loading={true}`, the button will render as a `<button>` element instead of an `<a>`.

## With Icons

### Icon on the Left

```svelte
<script>
  import { Button } from '@goobits/ui';
</script>

<Button variant="primary">
  {#snippet icon-left()}
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0l8 8-8 8V0z"/>
    </svg>
  {/snippet}
  Continue
</Button>
```

### Icon on the Right

```svelte
<Button variant="outline">
  Next Step
  {#snippet icon-right()}
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0l8 8-8 8V0z"/>
    </svg>
  {/snippet}
</Button>
```

### Icon Only

For icon-only buttons, make sure to provide an `aria-label` for accessibility.

```svelte
<Button variant="ghost" aria-label="Close dialog">
  {#snippet icon-left()}
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 1l14 14M15 1L1 15"/>
    </svg>
  {/snippet}
</Button>
```

### With Emoji Icons

```svelte
<Button variant="primary">
  {#snippet icon-left()}
    📁
  {/snippet}
  Upload File
</Button>

<Button variant="danger">
  {#snippet icon-left()}
    🗑️
  {/snippet}
  Delete
</Button>
```

## Click Handlers

```svelte
<script>
  import { Button } from '@goobits/ui';

  function handleClick(event) {
    console.log('Button clicked!', event);
    alert('Button was clicked!');
  }
</script>

<Button onclick={handleClick}>
  Click Me
</Button>
```

## Combination Examples

### All Variants with All Sizes

```svelte
<script>
  import { Button } from '@goobits/ui';

  const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger'];
  const sizes = ['sm', 'md', 'lg'];
</script>

<div style="display: flex; flex-direction: column; gap: 1rem;">
  {#each sizes as size}
    <div style="display: flex; gap: 0.5rem; align-items: center;">
      <span style="width: 60px;">{size}:</span>
      {#each variants as variant}
        <Button {variant} {size}>
          {variant}
        </Button>
      {/each}
    </div>
  {/each}
</div>
```

### Loading States for Different Variants

```svelte
<div style="display: flex; gap: 1rem; flex-wrap: wrap;">
  <Button variant="primary" loading>Loading Primary</Button>
  <Button variant="secondary" loading>Loading Secondary</Button>
  <Button variant="outline" loading>Loading Outline</Button>
  <Button variant="ghost" loading>Loading Ghost</Button>
  <Button variant="danger" loading>Loading Danger</Button>
</div>
```

### Form Example

```svelte
<script>
  import { Button } from '@goobits/ui';

  let formData = $state({ email: '', password: '' });
  let isSubmitting = $state(false);

  async function handleSubmit(event) {
    event.preventDefault();
    isSubmitting = true;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Form submitted successfully!');
    } catch (error) {
      alert('Error submitting form');
    } finally {
      isSubmitting = false;
    }
  }

  function handleReset() {
    formData = { email: '', password: '' };
  }
</script>

<form onsubmit={handleSubmit}>
  <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;">
    <input
      type="email"
      bind:value={formData.email}
      placeholder="Email"
      required
    />
    <input
      type="password"
      bind:value={formData.password}
      placeholder="Password"
      required
    />

    <div style="display: flex; gap: 0.5rem;">
      <Button type="submit" variant="primary" loading={isSubmitting}>
        Sign In
      </Button>
      <Button type="reset" variant="outline" onclick={handleReset}>
        Reset
      </Button>
    </div>
  </div>
</form>
```

### Button Group Example

```svelte
<div style="display: flex; gap: 0.5rem;">
  <Button variant="outline" size="sm">Left</Button>
  <Button variant="outline" size="sm">Center</Button>
  <Button variant="outline" size="sm">Right</Button>
</div>
```

### Toolbar Example

```svelte
<div style="display: flex; gap: 0.25rem; align-items: center;">
  <Button variant="ghost" size="sm" aria-label="Bold">
    <strong>B</strong>
  </Button>
  <Button variant="ghost" size="sm" aria-label="Italic">
    <em>I</em>
  </Button>
  <Button variant="ghost" size="sm" aria-label="Underline">
    <u>U</u>
  </Button>
  <div style="width: 1px; height: 24px; background: #ccc; margin: 0 0.25rem;"></div>
  <Button variant="ghost" size="sm" aria-label="Link">
    🔗
  </Button>
</div>
```

### CTA Section Example

```svelte
<div style="text-align: center; padding: 2rem;">
  <h2>Ready to get started?</h2>
  <p style="color: #666; margin-bottom: 2rem;">
    Join thousands of users already using our platform
  </p>

  <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
    <Button variant="primary" size="lg">
      Get Started Free
    </Button>
    <Button variant="outline" size="lg" href="/pricing">
      View Pricing
    </Button>
  </div>
</div>
```

## Accessibility

The Button component follows accessibility best practices:

- **Keyboard Navigation**: Fully accessible via keyboard (Enter and Space keys)
- **Focus Indicators**: Clear focus-visible styles for keyboard navigation
- **ARIA Attributes**: Proper `aria-disabled`, `aria-busy`, and `aria-label` support
- **High Contrast Mode**: Enhanced borders and outlines in high contrast mode
- **Reduced Motion**: Respects `prefers-reduced-motion` user preference
- **Touch Targets**: Minimum 44px touch targets on mobile devices

### Accessibility Example

```svelte
<!-- Icon-only button with aria-label -->
<Button variant="ghost" aria-label="Close notification">
  ✕
</Button>

<!-- Loading button with automatic aria-busy -->
<Button loading aria-label="Submitting form">
  Submit
</Button>

<!-- Disabled button with aria-disabled -->
<Button disabled aria-label="Action not available">
  Unavailable
</Button>
```

## Custom Styling

You can add custom classes for additional styling:

```svelte
<style>
  :global(.custom-button) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>

<Button class="custom-button" variant="primary">
  Custom Styled
</Button>
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Whether button is disabled |
| `loading` | `boolean` | `false` | Whether button is in loading state |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Button type attribute |
| `href` | `string \| undefined` | `undefined` | If provided, renders as anchor |
| `fullWidth` | `boolean` | `false` | Whether button spans full width |
| `class` | `string` | `''` | Additional CSS classes |
| `aria-label` | `string` | `undefined` | Accessible label |
| `data-testid` | `string` | `undefined` | Test identifier |

### Slots

| Slot | Description |
|------|-------------|
| `default` | Button content/text |
| `icon-left` | Icon before text |
| `icon-right` | Icon after text |

### Events

| Event | Description |
|-------|-------------|
| `onclick` | Fired when button is clicked |

All standard HTML button/anchor attributes are supported via prop spreading.
