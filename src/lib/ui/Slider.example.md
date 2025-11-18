# Slider Component Examples

The Slider component is a versatile, accessible slider control that supports both single-value and range modes, with keyboard navigation, custom formatting, and tick marks.

## Basic Usage

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let volume = $state(50);
</script>

<Slider bind:value={volume} />
```

## Single Value Slider

### With Label and Value Display

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let brightness = $state(75);
</script>

<Slider
  bind:value={brightness}
  label="Brightness"
  showValue={true}
/>
```

### Custom Range

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let temperature = $state(22);
</script>

<Slider
  bind:value={temperature}
  min={16}
  max={30}
  step={0.5}
  label="Temperature (°C)"
  showValue={true}
/>
```

### With Steps

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let rating = $state(3);
</script>

<Slider
  bind:value={rating}
  min={1}
  max={5}
  step={1}
  label="Rating"
/>
```

## Range Slider (Two Thumbs)

### Basic Range

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let priceRange = $state([200, 800]);
</script>

<Slider
  bind:value={priceRange}
  min={0}
  max={1000}
  label="Price Range"
  showValue={true}
/>
```

### Age Range Filter

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let ageRange = $state([25, 45]);
</script>

<Slider
  bind:value={ageRange}
  min={18}
  max={65}
  step={1}
  label="Age Range"
  showValue={true}
/>
```

## Custom Value Formatting

### Percentage

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let progress = $state(75);
</script>

<Slider
  bind:value={progress}
  min={0}
  max={100}
  label="Progress"
  showValue={true}
  formatValue={(v) => `${v}%`}
/>
```

### Currency

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let budget = $state(5000);
</script>

<Slider
  bind:value={budget}
  min={0}
  max={10000}
  step={100}
  label="Budget"
  showValue={true}
  formatValue={(v) => `$${v.toLocaleString()}`}
/>
```

### Currency Range

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let priceRange = $state([1000, 5000]);
</script>

<Slider
  bind:value={priceRange}
  min={0}
  max={10000}
  step={100}
  label="Price Range"
  showValue={true}
  formatValue={(v) => `$${v.toLocaleString()}`}
/>
```

### Time Duration

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let duration = $state(30);

  function formatDuration(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
</script>

<Slider
  bind:value={duration}
  min={5}
  max={180}
  step={5}
  label="Duration"
  showValue={true}
  formatValue={formatDuration}
/>
```

### File Size

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let maxSize = $state(50);

  function formatFileSize(mb) {
    if (mb < 1000) return `${mb}MB`;
    return `${(mb / 1000).toFixed(1)}GB`;
  }
</script>

<Slider
  bind:value={maxSize}
  min={1}
  max={2000}
  step={10}
  label="Max File Size"
  showValue={true}
  formatValue={formatFileSize}
/>
```

## Tick Marks

### With Regular Ticks

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let volume = $state(5);
</script>

<Slider
  bind:value={volume}
  min={0}
  max={10}
  step={1}
  label="Volume"
  showTicks={true}
  showValue={true}
/>
```

### Ticks with Steps

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let opacity = $state(50);
</script>

<Slider
  bind:value={opacity}
  min={0}
  max={100}
  step={10}
  label="Opacity"
  showTicks={true}
  showValue={true}
  formatValue={(v) => `${v}%`}
/>
```

## Custom Marks

### Rating Scale

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let rating = $state(3);
</script>

<Slider
  bind:value={rating}
  min={1}
  max={5}
  step={1}
  label="Rating"
  marks={[
    { value: 1, label: '⭐' },
    { value: 2, label: '⭐⭐' },
    { value: 3, label: '⭐⭐⭐' },
    { value: 4, label: '⭐⭐⭐⭐' },
    { value: 5, label: '⭐⭐⭐⭐⭐' }
  ]}
/>
```

### Experience Level

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let experience = $state(1);
</script>

<Slider
  bind:value={experience}
  min={1}
  max={5}
  step={1}
  label="Experience Level"
  marks={[
    { value: 1, label: 'Beginner' },
    { value: 2, label: 'Novice' },
    { value: 3, label: 'Intermediate' },
    { value: 4, label: 'Advanced' },
    { value: 5, label: 'Expert' }
  ]}
/>
```

### Price Points

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let price = $state(500);
</script>

<Slider
  bind:value={price}
  min={0}
  max={1000}
  step={50}
  label="Price"
  showValue={true}
  formatValue={(v) => `$${v}`}
  marks={[
    { value: 0, label: '$0' },
    { value: 250, label: '$250' },
    { value: 500, label: '$500' },
    { value: 750, label: '$750' },
    { value: 1000, label: '$1000' }
  ]}
/>
```

### Temperature Zones

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let temp = $state(20);
</script>

<Slider
  bind:value={temp}
  min={-10}
  max={40}
  step={1}
  label="Temperature"
  showValue={true}
  formatValue={(v) => `${v}°C`}
  marks={[
    { value: -10, label: 'Freezing' },
    { value: 0, label: 'Cold' },
    { value: 20, label: 'Comfortable' },
    { value: 30, label: 'Hot' },
    { value: 40, label: 'Very Hot' }
  ]}
/>
```

## Size Variants

### Small

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let value = $state(50);
</script>

<Slider
  bind:value={value}
  size="sm"
  label="Small Slider"
/>
```

### Medium (Default)

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let value = $state(50);
</script>

<Slider
  bind:value={value}
  size="md"
  label="Medium Slider"
/>
```

### Large

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let value = $state(50);
</script>

<Slider
  bind:value={value}
  size="lg"
  label="Large Slider"
/>
```

## States

### Disabled

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let value = $state(50);
</script>

<Slider
  bind:value={value}
  disabled={true}
  label="Disabled Slider"
/>
```

### With Error

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let value = $state(5);
</script>

<Slider
  bind:value={value}
  min={0}
  max={100}
  label="Quantity"
  error="Value must be at least 10"
/>
```

### Conditional Error

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let value = $state(5);

  const error = $derived(value < 10 ? 'Minimum value is 10' : undefined);
</script>

<Slider
  bind:value={value}
  min={0}
  max={100}
  label="Quantity"
  error={error}
/>
```

## Real-World Examples

### Volume Control

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let volume = $state(75);

  function handleVolumeChange(newValue) {
    // Update audio element volume
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      audioElement.volume = newValue / 100;
    }
  }

  $effect(() => {
    handleVolumeChange(volume);
  });
</script>

<Slider
  bind:value={volume}
  min={0}
  max={100}
  step={1}
  label="Volume"
  showValue={true}
  formatValue={(v) => `${v}%`}
  aria-label="Audio volume control"
/>
```

### Image Editor Brightness

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let brightness = $state(100);
  let contrast = $state(100);
  let saturation = $state(100);
</script>

<div style="display: flex; flex-direction: column; gap: 1rem;">
  <Slider
    bind:value={brightness}
    min={0}
    max={200}
    step={1}
    label="Brightness"
    showValue={true}
    formatValue={(v) => `${v}%`}
  />

  <Slider
    bind:value={contrast}
    min={0}
    max={200}
    step={1}
    label="Contrast"
    showValue={true}
    formatValue={(v) => `${v}%`}
  />

  <Slider
    bind:value={saturation}
    min={0}
    max={200}
    step={1}
    label="Saturation"
    showValue={true}
    formatValue={(v) => `${v}%`}
  />
</div>
```

### E-commerce Price Filter

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let priceRange = $state([50, 500]);

  function formatPrice(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }
</script>

<Slider
  bind:value={priceRange}
  min={0}
  max={1000}
  step={10}
  label="Price Range"
  showValue={true}
  formatValue={formatPrice}
/>
```

### Date Range Selector (Days)

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let daysRange = $state([7, 30]);

  function formatDays(days) {
    if (days === 1) return '1 day';
    if (days === 7) return '1 week';
    if (days === 30) return '1 month';
    if (days === 90) return '3 months';
    return `${days} days`;
  }
</script>

<Slider
  bind:value={daysRange}
  min={1}
  max={90}
  step={1}
  label="Date Range"
  showValue={true}
  formatValue={formatDays}
/>
```

### Zoom Level

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let zoom = $state(100);
</script>

<Slider
  bind:value={zoom}
  min={25}
  max={400}
  step={25}
  label="Zoom Level"
  showValue={true}
  showTicks={true}
  formatValue={(v) => `${v}%`}
  marks={[
    { value: 25, label: '25%' },
    { value: 100, label: '100%' },
    { value: 200, label: '200%' },
    { value: 400, label: '400%' }
  ]}
/>
```

### Age Range Filter

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let ageRange = $state([18, 65]);
</script>

<Slider
  bind:value={ageRange}
  min={18}
  max={100}
  step={1}
  label="Age Range"
  showValue={true}
  formatValue={(v) => `${v} years`}
/>
```

### Product Rating Filter

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let minRating = $state(3);
</script>

<Slider
  bind:value={minRating}
  min={1}
  max={5}
  step={1}
  label="Minimum Rating"
  showValue={true}
  marks={[
    { value: 1, label: '1★' },
    { value: 2, label: '2★' },
    { value: 3, label: '3★' },
    { value: 4, label: '4★' },
    { value: 5, label: '5★' }
  ]}
/>
```

## Accessibility

The Slider component follows accessibility best practices:

- **Keyboard Navigation**: Full keyboard support
  - Arrow keys: Increase/decrease by step
  - PageUp/PageDown: Increase/decrease by 10x step
  - Home/End: Jump to min/max values
- **ARIA Attributes**: Proper `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`
- **Focus Indicators**: Clear focus-visible styles for keyboard navigation
- **Screen Readers**: Value changes announced with formatted text
- **Touch Support**: Works seamlessly on touch devices
- **High Contrast Mode**: Enhanced borders and outlines
- **Reduced Motion**: Respects `prefers-reduced-motion` user preference

### Accessibility Example

```svelte
<script>
  import { Slider } from '@goobits/ui';

  let volume = $state(50);
</script>

<Slider
  bind:value={volume}
  min={0}
  max={100}
  label="Volume Control"
  aria-label="Audio volume control"
  aria-describedby="volume-help"
  formatValue={(v) => `${v} percent`}
/>
<p id="volume-help" style="font-size: 14px; color: #666;">
  Use arrow keys to adjust, or click and drag
</p>
```

## Custom Styling

You can add custom classes for additional styling:

```svelte
<style>
  :global(.custom-slider) {
    max-width: 400px;
  }

  :global(.custom-slider .slider__range) {
    background: linear-gradient(to right, #f59e0b, #ef4444);
  }

  :global(.custom-slider .slider__thumb) {
    border-color: #f59e0b;
  }
</style>

<Slider
  bind:value={temperature}
  min={0}
  max={100}
  label="Temperature"
  class="custom-slider"
/>
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number \| [number, number]` | `0` | Current value (number for single, tuple for range) |
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `step` | `number` | `1` | Step increment |
| `disabled` | `boolean` | `false` | Whether the slider is disabled |
| `label` | `string \| undefined` | `undefined` | Label text |
| `showValue` | `boolean` | `true` | Show current value display |
| `showTicks` | `boolean` | `false` | Show tick marks |
| `marks` | `Array<{value: number, label: string}>` | `undefined` | Custom marks with labels |
| `error` | `string \| undefined` | `undefined` | Error message |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |
| `formatValue` | `(value: number) => string` | `String` | Custom value formatter |
| `class` | `string` | `''` | Additional CSS classes |
| `aria-label` | `string` | Derived from label | Accessible label |
| `aria-describedby` | `string` | `undefined` | ID of description element |
| `data-testid` | `string` | `undefined` | Test identifier |

### Value Binding

The `value` prop supports two-way binding with `bind:value`.

**Single Value Mode:**
```svelte
let volume = $state(50);
<Slider bind:value={volume} />
```

**Range Mode:**
```svelte
let priceRange = $state([100, 500]);
<Slider bind:value={priceRange} />
```

### Events

The component automatically updates the bound `value` as the user interacts with the slider through:
- Mouse drag
- Touch drag
- Keyboard navigation
- Track clicks

All standard HTML attributes are supported via prop spreading.
