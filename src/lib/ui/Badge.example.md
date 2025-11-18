# Badge Component Examples

The Badge component provides a flexible way to display status indicators, labels, tags, and notifications. It supports multiple variants, sizes, styles, and interactive features.

## Basic Usage

```svelte
<script>
  import { Badge } from '@goobits/ui';
</script>

<Badge>Default Badge</Badge>
```

## Color Variants

Display badges in different colors to indicate various states or categories:

```svelte
<Badge variant="primary">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="info">Info</Badge>
```

## Sizes

Choose from three sizes to fit your design:

```svelte
<Badge size="sm">Small Badge</Badge>
<Badge size="md">Medium Badge</Badge>
<Badge size="lg">Large Badge</Badge>
```

## Outlined Style

Use outlined badges for a lighter appearance:

```svelte
<Badge variant="primary" outlined>Outlined Primary</Badge>
<Badge variant="success" outlined>Outlined Success</Badge>
<Badge variant="warning" outlined>Outlined Warning</Badge>
<Badge variant="error" outlined>Outlined Error</Badge>
<Badge variant="info" outlined>Outlined Info</Badge>
```

## Pill Shape

Create fully rounded pill-shaped badges:

```svelte
<Badge pill>Pill Badge</Badge>
<Badge variant="success" pill>Success Pill</Badge>
<Badge variant="error" pill outlined>Error Pill</Badge>
```

## With Status Dot

Add a status dot indicator to show online/offline or active/inactive states:

```svelte
<Badge variant="success" dot>Online</Badge>
<Badge variant="error" dot>Offline</Badge>
<Badge variant="warning" dot>Away</Badge>
<Badge variant="info" dot>Busy</Badge>
```

## Dismissible Badges

Create badges that can be closed by the user:

```svelte
<script>
  import { Badge } from '@goobits/ui';

  function handleDismiss() {
    console.log('Badge dismissed');
    // Remove badge or perform other actions
  }
</script>

<Badge variant="info" dismissible on:dismiss={handleDismiss}>
  Dismissible Badge
</Badge>

<Badge variant="warning" dismissible pill on:dismiss={handleDismiss}>
  Dismiss Me
</Badge>
```

## With Icons

Use the icon slot to add custom icons:

```svelte
<script>
  import { Badge } from '@goobits/ui';
</script>

<Badge variant="primary">
  <span slot="icon">📧</span>
  3 Messages
</Badge>

<Badge variant="success">
  <span slot="icon">✓</span>
  Verified
</Badge>

<Badge variant="warning">
  <span slot="icon">⚠️</span>
  Warning
</Badge>

<Badge variant="error">
  <span slot="icon">✗</span>
  Failed
</Badge>
```

## Custom Dot Indicator

Customize the dot indicator using the dot slot:

```svelte
<Badge variant="success">
  <span slot="dot" style="width: 8px; height: 8px; background: lime;"></span>
  Custom Dot
</Badge>
```

## Clickable Badges

Non-dismissible badges can handle click events:

```svelte
<script>
  import { Badge } from '@goobits/ui';

  function handleClick(event) {
    console.log('Badge clicked', event);
  }
</script>

<Badge variant="primary" on:click={handleClick}>
  Click Me
</Badge>
```

## Combined Features

Combine multiple features for advanced use cases:

```svelte
<script>
  import { Badge } from '@goobits/ui';

  let tags = ['JavaScript', 'TypeScript', 'Svelte'];

  function removeTag(tag) {
    tags = tags.filter(t => t !== tag);
  }
</script>

{#each tags as tag}
  <Badge
    variant="primary"
    pill
    dismissible
    on:dismiss={() => removeTag(tag)}
  >
    {tag}
  </Badge>
{/each}
```

## Notification Badges

Display notification counts or status:

```svelte
<Badge variant="error" size="sm" pill>5</Badge>
<Badge variant="primary" size="sm" pill>99+</Badge>
<Badge variant="success" size="sm" dot pill>New</Badge>
```

## User Status Indicators

Show user online/offline status:

```svelte
<div style="display: flex; align-items: center; gap: 1rem;">
  <Badge variant="success" size="sm" dot pill>Online</Badge>
  <Badge variant="error" size="sm" dot pill>Offline</Badge>
  <Badge variant="warning" size="sm" dot pill>Away</Badge>
  <Badge variant="secondary" size="sm" dot pill>Busy</Badge>
</div>
```

## Category Tags

Use badges as category or topic tags:

```svelte
<div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
  <Badge variant="primary" outlined pill>Design</Badge>
  <Badge variant="success" outlined pill>Development</Badge>
  <Badge variant="info" outlined pill>Marketing</Badge>
  <Badge variant="warning" outlined pill>Sales</Badge>
</div>
```

## Product Labels

Highlight special product features:

```svelte
<Badge variant="success" pill>New</Badge>
<Badge variant="warning" pill>Sale</Badge>
<Badge variant="error" pill>Hot</Badge>
<Badge variant="info" pill>Featured</Badge>
```

## Size Comparison

All sizes with different variants:

```svelte
<!-- Small -->
<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
  <Badge variant="primary" size="sm">Primary SM</Badge>
  <Badge variant="success" size="sm">Success SM</Badge>
  <Badge variant="warning" size="sm">Warning SM</Badge>
</div>

<!-- Medium (Default) -->
<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
  <Badge variant="primary" size="md">Primary MD</Badge>
  <Badge variant="success" size="md">Success MD</Badge>
  <Badge variant="warning" size="md">Warning MD</Badge>
</div>

<!-- Large -->
<div style="display: flex; gap: 0.5rem;">
  <Badge variant="primary" size="lg">Primary LG</Badge>
  <Badge variant="success" size="lg">Success LG</Badge>
  <Badge variant="warning" size="lg">Warning LG</Badge>
</div>
```

## Outlined vs Filled

Comparison of outlined and filled styles:

```svelte
<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
  <Badge variant="primary">Filled</Badge>
  <Badge variant="primary" outlined>Outlined</Badge>
</div>

<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
  <Badge variant="success">Filled</Badge>
  <Badge variant="success" outlined>Outlined</Badge>
</div>

<div style="display: flex; gap: 0.5rem;">
  <Badge variant="error">Filled</Badge>
  <Badge variant="error" outlined>Outlined</Badge>
</div>
```

## Complex Example: Tag Manager

A complete example showing multiple features:

```svelte
<script>
  import { Badge } from '@goobits/ui';

  let skills = [
    { name: 'Svelte', variant: 'primary' },
    { name: 'TypeScript', variant: 'info' },
    { name: 'CSS', variant: 'success' },
    { name: 'Node.js', variant: 'secondary' }
  ];

  function removeSkill(skillName) {
    skills = skills.filter(s => s.name !== skillName);
  }

  function addSkill() {
    const newSkill = prompt('Enter skill name:');
    if (newSkill) {
      skills = [...skills, { name: newSkill, variant: 'primary' }];
    }
  }
</script>

<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 1rem;">
  {#each skills as skill}
    <Badge
      variant={skill.variant}
      pill
      dismissible
      on:dismiss={() => removeSkill(skill.name)}
    >
      {skill.name}
    </Badge>
  {/each}

  <button on:click={addSkill}>+ Add Skill</button>
</div>
```

## Accessibility

The Badge component includes proper accessibility features:

- `role="status"` for screen readers
- `aria-label="Dismiss"` on close buttons
- `aria-hidden="true"` on decorative elements (dots, icons)
- Keyboard accessible dismiss buttons with `tabindex="0"`

```svelte
<!-- Accessible badge with dismiss -->
<Badge variant="info" dismissible on:dismiss={handleDismiss}>
  This badge is accessible
</Badge>

<!-- Badge with status dot -->
<Badge variant="success" dot>
  Online (dot is aria-hidden)
</Badge>
```

## Custom Styling

Add custom CSS classes for additional styling:

```svelte
<style>
  :global(.custom-badge) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>

<Badge variant="primary" class="custom-badge">
  Custom Styled
</Badge>
```

## Best Practices

1. **Use appropriate variants**: Choose colors that match the semantic meaning
   - `success` for positive states (online, completed, verified)
   - `error` for negative states (offline, failed, blocked)
   - `warning` for cautionary states (pending, away, attention needed)
   - `info` for informational states (new, updated, info)

2. **Keep content concise**: Badges work best with short text (1-3 words)

3. **Don't overuse dismissible badges**: Only make badges dismissible when the action makes sense

4. **Consider contrast**: Use outlined badges on colored backgrounds for better visibility

5. **Group related badges**: Use consistent styling for badges that represent the same category

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'primary'` | Color variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the badge |
| `outlined` | `boolean` | `false` | Use outlined style |
| `pill` | `boolean` | `false` | Use pill shape (fully rounded) |
| `dismissible` | `boolean` | `false` | Show dismiss button |
| `dot` | `boolean` | `false` | Show status dot indicator |
| `class` | `string` | `''` | Additional CSS classes |
| `data-testid` | `string` | `undefined` | Test ID for testing |

## Events

| Event | Type | Description |
|-------|------|-------------|
| `on:dismiss` | `void` | Fired when dismiss button is clicked |
| `on:click` | `MouseEvent` | Fired when badge is clicked (non-dismissible only) |

## Slots

| Slot | Description |
|------|-------------|
| default | Badge content (text, numbers, etc.) |
| `icon` | Icon or element before the badge text |
| `dot` | Custom dot indicator (overrides default dot) |
