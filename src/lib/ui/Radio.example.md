# Radio Component Examples

This document demonstrates various use cases for the Radio and RadioGroup components in @goobits/ui.

## Table of Contents

- [Basic Radio Button](#basic-radio-button)
- [Radio with Label](#radio-with-label)
- [RadioGroup Examples](#radiogroup-examples)
- [Horizontal Layout](#horizontal-layout)
- [With Descriptions](#with-descriptions)
- [Disabled Options](#disabled-options)
- [Error State](#error-state)
- [Required Field](#required-field)
- [Different Sizes](#different-sizes)
- [Form Integration](#form-integration)

## Basic Radio Button

Simple radio button with basic props:

```svelte
<script>
  import { Radio } from '@goobits/ui';

  let selectedPlan = $state('free');
</script>

<Radio
  name="plan"
  value="free"
  bind:checked={selectedPlan === 'free'}
  label="Free Plan"
/>

<Radio
  name="plan"
  value="premium"
  bind:checked={selectedPlan === 'premium'}
  label="Premium Plan"
/>

<p>Selected: {selectedPlan}</p>
```

## Radio with Label

Radio button with custom label using slot:

```svelte
<script>
  import { Radio } from '@goobits/ui';

  let selected = $state(false);
</script>

<Radio name="custom" value="option1" bind:checked={selected}>
  {#snippet label()}
    <strong>Custom Label</strong> with <em>formatted</em> text
  {/snippet}
</Radio>
```

## RadioGroup Examples

### Basic RadioGroup

Simple radio group with multiple options:

```svelte
<script>
  import { RadioGroup } from '@goobits/ui';

  let selectedColor = $state('blue');

  const colorOptions = [
    { value: 'red', label: 'Red' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' }
  ];
</script>

<RadioGroup
  bind:value={selectedColor}
  name="color"
  label="Choose a color"
  options={colorOptions}
/>

<p>Selected color: {selectedColor}</p>
```

## Horizontal Layout

Radio group with horizontal orientation:

```svelte
<script>
  import { RadioGroup } from '@goobits/ui';

  let selectedSize = $state();

  const sizeOptions = [
    { value: 's', label: 'Small' },
    { value: 'm', label: 'Medium' },
    { value: 'l', label: 'Large' },
    { value: 'xl', label: 'Extra Large' }
  ];
</script>

<RadioGroup
  bind:value={selectedSize}
  name="size"
  label="Choose a size"
  options={sizeOptions}
  orientation="horizontal"
/>
```

## With Descriptions

Radio group with descriptive text for each option:

```svelte
<script>
  import { RadioGroup } from '@goobits/ui';

  let selectedPlan = $state();

  const planOptions = [
    {
      value: 'free',
      label: 'Free',
      description: 'Perfect for personal projects and testing'
    },
    {
      value: 'pro',
      label: 'Professional',
      description: 'For small teams and growing businesses'
    },
    {
      value: 'enterprise',
      label: 'Enterprise',
      description: 'Advanced features and dedicated support'
    }
  ];
</script>

<RadioGroup
  bind:value={selectedPlan}
  name="plan"
  label="Choose your plan"
  options={planOptions}
/>
```

## Disabled Options

Radio group with some options disabled:

```svelte
<script>
  import { RadioGroup } from '@goobits/ui';

  let selectedFeature = $state();

  const featureOptions = [
    { value: 'basic', label: 'Basic Features' },
    {
      value: 'advanced',
      label: 'Advanced Features',
      description: 'Requires Premium subscription',
      disabled: true
    },
    {
      value: 'beta',
      label: 'Beta Features',
      description: 'Coming soon',
      disabled: true
    }
  ];
</script>

<RadioGroup
  bind:value={selectedFeature}
  name="features"
  label="Available Features"
  options={featureOptions}
/>
```

### Entirely Disabled Group

```svelte
<RadioGroup
  bind:value={selectedOption}
  name="disabled-group"
  label="Disabled Group"
  options={options}
  disabled={true}
/>
```

## Error State

Radio group with error validation:

```svelte
<script>
  import { RadioGroup } from '@goobits/ui';

  let selectedPayment = $state();
  let error = $state('');

  const paymentOptions = [
    { value: 'credit', label: 'Credit Card' },
    { value: 'debit', label: 'Debit Card' },
    { value: 'paypal', label: 'PayPal' }
  ];

  function handleSubmit() {
    if (!selectedPayment) {
      error = 'Please select a payment method';
    } else {
      error = '';
      // Process payment
    }
  }
</script>

<RadioGroup
  bind:value={selectedPayment}
  name="payment"
  label="Payment Method"
  options={paymentOptions}
  error={error}
/>

<button onclick={handleSubmit}>Submit</button>
```

## Required Field

Radio group marked as required:

```svelte
<script>
  import { RadioGroup } from '@goobits/ui';

  let agreedToTerms = $state();

  const agreementOptions = [
    { value: 'yes', label: 'I agree to the terms and conditions' },
    { value: 'no', label: 'I do not agree' }
  ];
</script>

<RadioGroup
  bind:value={agreedToTerms}
  name="agreement"
  label="Terms and Conditions"
  options={agreementOptions}
  required={true}
/>
```

## Different Sizes

Radio components in different sizes:

```svelte
<script>
  import { Radio, RadioGroup } from '@goobits/ui';

  let smallValue = $state();
  let mediumValue = $state();
  let largeValue = $state();

  const options = [
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' }
  ];
</script>

<!-- Small Size -->
<RadioGroup
  bind:value={smallValue}
  name="small-group"
  label="Small Size"
  options={options}
  size="sm"
/>

<!-- Medium Size (Default) -->
<RadioGroup
  bind:value={mediumValue}
  name="medium-group"
  label="Medium Size"
  options={options}
  size="md"
/>

<!-- Large Size -->
<RadioGroup
  bind:value={largeValue}
  name="large-group"
  label="Large Size"
  options={options}
  size="lg"
/>

<!-- Individual Radio Sizes -->
<Radio name="size-test" value="sm" label="Small" size="sm" />
<Radio name="size-test" value="md" label="Medium" size="md" />
<Radio name="size-test" value="lg" label="Large" size="lg" />
```

## Form Integration

Complete form example with radio groups:

```svelte
<script>
  import { RadioGroup, Button } from '@goobits/ui';

  let formData = $state({
    accountType: '',
    newsletter: '',
    contactMethod: ''
  });

  let errors = $state({
    accountType: '',
    newsletter: '',
    contactMethod: ''
  });

  const accountTypes = [
    { value: 'personal', label: 'Personal', description: 'For individual use' },
    { value: 'business', label: 'Business', description: 'For companies and teams' }
  ];

  const newsletterOptions = [
    { value: 'yes', label: 'Yes, send me updates' },
    { value: 'no', label: 'No, thank you' }
  ];

  const contactMethods = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'sms', label: 'SMS' }
  ];

  function validateForm() {
    let isValid = true;
    errors = { accountType: '', newsletter: '', contactMethod: '' };

    if (!formData.accountType) {
      errors.accountType = 'Please select an account type';
      isValid = false;
    }

    if (!formData.newsletter) {
      errors.newsletter = 'Please indicate your newsletter preference';
      isValid = false;
    }

    if (!formData.contactMethod) {
      errors.contactMethod = 'Please select a contact method';
      isValid = false;
    }

    return isValid;
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (validateForm()) {
      console.log('Form submitted:', formData);
      // Submit form data
    }
  }
</script>

<form onsubmit={handleSubmit}>
  <RadioGroup
    bind:value={formData.accountType}
    name="accountType"
    label="Account Type"
    options={accountTypes}
    error={errors.accountType}
    required={true}
  />

  <RadioGroup
    bind:value={formData.newsletter}
    name="newsletter"
    label="Newsletter Subscription"
    options={newsletterOptions}
    error={errors.newsletter}
    required={true}
    orientation="horizontal"
  />

  <RadioGroup
    bind:value={formData.contactMethod}
    name="contactMethod"
    label="Preferred Contact Method"
    options={contactMethods}
    error={errors.contactMethod}
  />

  <Button type="submit">Create Account</Button>
</form>
```

## Advanced: Custom Styling

Radio group with custom CSS classes:

```svelte
<script>
  import { RadioGroup } from '@goobits/ui';

  let theme = $state('light');

  const themeOptions = [
    { value: 'light', label: 'Light Theme' },
    { value: 'dark', label: 'Dark Theme' },
    { value: 'auto', label: 'Auto (System)' }
  ];
</script>

<RadioGroup
  bind:value={theme}
  name="theme"
  label="Choose Theme"
  options={themeOptions}
  class="custom-radio-group"
/>

<style>
  :global(.custom-radio-group) {
    padding: 1rem;
    background: var(--color-background-secondary);
    border-radius: var(--radius-lg);
  }
</style>
```

## Accessibility Features

All Radio and RadioGroup components include:

- **Keyboard Navigation**: Use Arrow keys to move between options in a group
- **Tab Navigation**: Tab moves to the next form element
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Indicators**: Clear visual focus states
- **Error Announcements**: Errors are announced to screen readers via `role="alert"`
- **Required Field Indication**: Both visual (*) and programmatic (aria-required)

### Keyboard Shortcuts

- **Arrow Up/Left**: Select previous option (wraps to last)
- **Arrow Down/Right**: Select next option (wraps to first)
- **Tab**: Move to next focusable element
- **Shift + Tab**: Move to previous focusable element
- **Space**: Toggle selected radio (when focused)

## Best Practices

1. **Always provide a label** for the RadioGroup to describe the group's purpose
2. **Use descriptions** for complex options that need explanation
3. **Mark required fields** with the `required` prop
4. **Provide clear error messages** that help users fix issues
5. **Use horizontal layout** for short lists (2-4 options)
6. **Use vertical layout** for longer lists or options with descriptions
7. **Group related radios** together using RadioGroup instead of individual Radio components
8. **Validate on submit** rather than on every change for better UX

## Common Patterns

### Yes/No Questions

```svelte
<RadioGroup
  bind:value={answer}
  name="confirmation"
  label="Do you want to proceed?"
  options={[
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ]}
  orientation="horizontal"
  required={true}
/>
```

### Product Selection

```svelte
<RadioGroup
  bind:value={selectedProduct}
  name="product"
  label="Choose a product"
  options={products.map(p => ({
    value: p.id,
    label: p.name,
    description: `${p.price} - ${p.description}`
  }))}
/>
```

### Multiple Choice Quiz

```svelte
<RadioGroup
  bind:value={quizAnswer}
  name="quiz-question-1"
  label="What is the capital of France?"
  options={[
    { value: 'london', label: 'London' },
    { value: 'paris', label: 'Paris' },
    { value: 'berlin', label: 'Berlin' },
    { value: 'madrid', label: 'Madrid' }
  ]}
  required={true}
/>
```
