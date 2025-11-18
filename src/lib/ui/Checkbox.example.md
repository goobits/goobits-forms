# Checkbox Component Examples

The Checkbox component provides a customizable, accessible checkbox input with support for indeterminate states, error handling, and multiple sizes.

## Basic Usage

### Simple Checkbox

```svelte
<script>
  import { Checkbox } from '@goobits/ui';
  let agreed = $state(false);
</script>

<Checkbox bind:checked={agreed} label="I agree to the terms and conditions" />
```

### Checkbox without Label

For custom layouts, you can use the checkbox without a built-in label:

```svelte
<script>
  import { Checkbox } from '@goobits/ui';
  let selected = $state(false);
</script>

<Checkbox bind:checked={selected} aria-label="Select item" />
```

### Checkbox with Custom Label Slot

```svelte
<script>
  import { Checkbox } from '@goobits/ui';
  let accepted = $state(false);
</script>

<Checkbox bind:checked={accepted}>
  I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
</Checkbox>
```

## States

### Checked State

```svelte
<script>
  import { Checkbox } from '@goobits/ui';
  let checked = $state(true);
</script>

<Checkbox bind:checked label="Pre-selected option" />
```

### Indeterminate State

Use the indeterminate state for "select all" functionality:

```svelte
<script>
  import { Checkbox } from '@goobits/ui';
  let selectAll = $state(false);
  let indeterminate = $state(true);
  let items = $state(['item1', 'item2']);

  function handleSelectAll(checked) {
    if (checked) {
      items = ['item1', 'item2', 'item3'];
      indeterminate = false;
    } else {
      items = [];
      indeterminate = false;
    }
  }
</script>

<Checkbox
  bind:checked={selectAll}
  indeterminate={indeterminate}
  onchange={handleSelectAll}
  label="Select all items"
/>
```

### Disabled State

```svelte
<Checkbox label="Disabled option" disabled />
<Checkbox label="Disabled and checked" disabled checked />
```

### Error State

```svelte
<script>
  import { Checkbox } from '@goobits/ui';
  let agreed = $state(false);
  let error = $state('You must agree to continue');
</script>

<Checkbox
  bind:checked={agreed}
  label="I agree to the terms"
  error={error}
/>
```

## Sizes

The Checkbox component supports three sizes: small, medium (default), and large.

```svelte
<Checkbox size="sm" label="Small checkbox" />
<Checkbox size="md" label="Medium checkbox (default)" />
<Checkbox size="lg" label="Large checkbox" />
```

## Event Handling

### onChange Event

```svelte
<script>
  import { Checkbox } from '@goobits/ui';

  function handleChange(checked) {
    console.log('Checkbox is now:', checked);
    // Perform additional logic
  }
</script>

<Checkbox
  label="Notify me of updates"
  onchange={handleChange}
/>
```

## Form Integration

### With Form Names and Values

```svelte
<script>
  import { Checkbox } from '@goobits/ui';
  let newsletter = $state(false);
</script>

<form>
  <Checkbox
    bind:checked={newsletter}
    name="newsletter"
    value="subscribed"
    label="Subscribe to newsletter"
  />
  <button type="submit">Submit</button>
</form>
```

## CheckboxGroup Component

The CheckboxGroup component manages multiple related checkboxes with a shared name.

### Basic CheckboxGroup

```svelte
<script>
  import { CheckboxGroup } from '@goobits/ui';

  let selectedInterests = $state([]);

  const interests = [
    { value: 'sports', label: 'Sports' },
    { value: 'music', label: 'Music' },
    { value: 'art', label: 'Art' },
    { value: 'technology', label: 'Technology' }
  ];
</script>

<CheckboxGroup
  bind:value={selectedInterests}
  options={interests}
  name="interests"
  label="Select your interests"
/>

<p>Selected: {selectedInterests.join(', ')}</p>
```

### Horizontal Orientation

```svelte
<CheckboxGroup
  bind:value={selectedItems}
  options={options}
  name="items"
  label="Choose items"
  orientation="horizontal"
/>
```

### CheckboxGroup with Error

```svelte
<script>
  import { CheckboxGroup } from '@goobits/ui';

  let selected = $state([]);
  let error = $state('');

  function handleChange(values) {
    if (values.length === 0) {
      error = 'Please select at least one option';
    } else {
      error = '';
    }
  }
</script>

<CheckboxGroup
  bind:value={selected}
  options={options}
  name="required"
  label="Required selection"
  error={error}
  onchange={handleChange}
/>
```

### CheckboxGroup with Disabled Options

```svelte
<script>
  import { CheckboxGroup } from '@goobits/ui';

  const options = [
    { value: 'option1', label: 'Available Option 1' },
    { value: 'option2', label: 'Unavailable Option', disabled: true },
    { value: 'option3', label: 'Available Option 2' }
  ];
</script>

<CheckboxGroup
  bind:value={selected}
  options={options}
  name="mixed"
  label="Select available options"
/>
```

### Disabled CheckboxGroup

```svelte
<CheckboxGroup
  value={['sports', 'music']}
  options={interests}
  name="readonly-interests"
  label="Your interests (read-only)"
  disabled
/>
```

### Different Sizes

```svelte
<CheckboxGroup
  bind:value={selected}
  options={options}
  name="small"
  label="Small checkboxes"
  size="sm"
/>

<CheckboxGroup
  bind:value={selected}
  options={options}
  name="large"
  label="Large checkboxes"
  size="lg"
/>
```

## Accessibility

The Checkbox and CheckboxGroup components are built with accessibility in mind:

- **Keyboard Navigation**: Full keyboard support with Space to toggle
- **ARIA Attributes**: Proper `aria-checked`, `aria-invalid`, `aria-describedby`
- **Label Association**: Automatic label-to-input association via `for`/`id`
- **Error Announcements**: Errors are announced to screen readers via `role="alert"`
- **Indeterminate State**: Properly communicated via `aria-checked="mixed"`
- **Semantic HTML**: CheckboxGroup uses `<fieldset>` and `<legend>` for grouping

### Accessibility Example

```svelte
<script>
  import { Checkbox, CheckboxGroup } from '@goobits/ui';
</script>

<!-- Checkbox with proper labeling -->
<Checkbox
  id="terms-checkbox"
  name="terms"
  label="I have read and agree to the terms and conditions"
  aria-describedby="terms-help"
/>
<p id="terms-help">
  Please review our terms before continuing
</p>

<!-- CheckboxGroup with semantic structure -->
<CheckboxGroup
  options={preferences}
  name="preferences"
  label="Communication Preferences"
  aria-describedby="preferences-help"
/>
<p id="preferences-help">
  Select how you'd like us to contact you
</p>
```

## Advanced Usage

### Select All Pattern

```svelte
<script>
  import { Checkbox, CheckboxGroup } from '@goobits/ui';

  const allOptions = [
    { value: 'item1', label: 'Item 1' },
    { value: 'item2', label: 'Item 2' },
    { value: 'item3', label: 'Item 3' },
    { value: 'item4', label: 'Item 4' }
  ];

  let selected = $state([]);

  let selectAllChecked = $derived(selected.length === allOptions.length);
  let selectAllIndeterminate = $derived(
    selected.length > 0 && selected.length < allOptions.length
  );

  function handleSelectAll(checked) {
    if (checked) {
      selected = allOptions.map(opt => opt.value);
    } else {
      selected = [];
    }
  }
</script>

<Checkbox
  checked={selectAllChecked}
  indeterminate={selectAllIndeterminate}
  onchange={handleSelectAll}
  label="Select all"
/>

<CheckboxGroup
  bind:value={selected}
  options={allOptions}
  name="items"
/>
```

### Conditional Validation

```svelte
<script>
  import { Checkbox } from '@goobits/ui';

  let agreeToTerms = $state(false);
  let agreeToPrivacy = $state(false);
  let submitted = $state(false);

  let termsError = $derived(
    submitted && !agreeToTerms ? 'You must accept the terms' : ''
  );

  let privacyError = $derived(
    submitted && !agreeToPrivacy ? 'You must accept the privacy policy' : ''
  );

  function handleSubmit(e) {
    e.preventDefault();
    submitted = true;

    if (agreeToTerms && agreeToPrivacy) {
      console.log('Form submitted');
    }
  }
</script>

<form onsubmit={handleSubmit}>
  <Checkbox
    bind:checked={agreeToTerms}
    label="I agree to the Terms of Service"
    error={termsError}
  />

  <Checkbox
    bind:checked={agreeToPrivacy}
    label="I agree to the Privacy Policy"
    error={privacyError}
  />

  <button type="submit">Continue</button>
</form>
```

## API Reference

### Checkbox Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | Whether the checkbox is checked (bindable) |
| `indeterminate` | `boolean` | `false` | Whether the checkbox is in an indeterminate state |
| `disabled` | `boolean` | `false` | Whether the checkbox is disabled |
| `name` | `string` | `undefined` | Input name attribute |
| `value` | `string \| number` | `undefined` | Input value attribute |
| `label` | `string` | `undefined` | Label text |
| `error` | `string` | `undefined` | Error message to display |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the checkbox |
| `id` | `string` | auto-generated | Input ID |
| `class` | `string` | `''` | Additional CSS classes |
| `data-testid` | `string` | `undefined` | Test ID for automated testing |

### Checkbox Events

| Event | Payload | Description |
|-------|---------|-------------|
| `onchange` | `(checked: boolean) => void` | Fired when checked state changes |

### Checkbox Slots

| Slot | Description |
|------|-------------|
| default | Custom label content (overrides `label` prop) |

### CheckboxGroup Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `CheckboxOption[]` | required | Array of checkbox options |
| `value` | `(string \| number)[]` | `[]` | Selected values (bindable) |
| `name` | `string` | required | Name attribute for all checkboxes |
| `label` | `string` | `undefined` | Label for the group |
| `error` | `string` | `undefined` | Error message to display |
| `disabled` | `boolean` | `false` | Whether all checkboxes are disabled |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout orientation |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the checkboxes |
| `class` | `string` | `''` | Additional CSS classes |
| `data-testid` | `string` | `undefined` | Test ID for automated testing |

### CheckboxGroup Events

| Event | Payload | Description |
|-------|---------|-------------|
| `onchange` | `(values: (string \| number)[]) => void` | Fired when selection changes |

### CheckboxOption Interface

```typescript
interface CheckboxOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}
```
