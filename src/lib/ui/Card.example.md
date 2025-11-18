# Card Component System

A versatile container component with multiple variants and sub-components for building structured content layouts.

## Components

- **Card** - Main container component
- **CardHeader** - Header section with title, subtitle, and actions
- **CardBody** - Main content area
- **CardFooter** - Footer section for actions

## Basic Usage

### Simple Card

```svelte
<script>
  import { Card } from '@goobits/ui';
</script>

<Card>
  <p>Simple card content</p>
</Card>
```

### Card with Composition

```svelte
<script>
  import { Card, CardHeader, CardBody, CardFooter, Button } from '@goobits/ui';
</script>

<Card>
  <CardHeader title="User Profile" subtitle="Manage your account settings" />
  <CardBody>
    <p>Card content goes here...</p>
  </CardBody>
  <CardFooter align="right">
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Save Changes</Button>
  </CardFooter>
</Card>
```

## Card Variants

### Elevated (Default)

Elevated cards have a shadow effect that lifts them from the background.

```svelte
<Card variant="elevated">
  <CardBody>
    <h3>Elevated Card</h3>
    <p>This card appears to float above the page.</p>
  </CardBody>
</Card>
```

### Outlined

Outlined cards have a border without shadow.

```svelte
<Card variant="outlined">
  <CardBody>
    <h3>Outlined Card</h3>
    <p>This card has a subtle border.</p>
  </CardBody>
</Card>
```

### Filled

Filled cards have a background color.

```svelte
<Card variant="filled">
  <CardBody>
    <h3>Filled Card</h3>
    <p>This card has a subtle background color.</p>
  </CardBody>
</Card>
```

## Padding Options

### Card Padding

Control padding on the entire card:

```svelte
<!-- No padding -->
<Card padding="none">
  <img src="/image.jpg" alt="Full bleed image" />
</Card>

<!-- Small padding -->
<Card padding="sm">
  <p>Compact card</p>
</Card>

<!-- Medium padding (default) -->
<Card padding="md">
  <p>Standard spacing</p>
</Card>

<!-- Large padding -->
<Card padding="lg">
  <p>Spacious card</p>
</Card>
```

### CardBody Padding

Control padding on the body independently:

```svelte
<Card padding="none">
  <CardHeader title="Image Gallery" />
  <CardBody padding="none">
    <img src="/hero.jpg" alt="Hero image" />
  </CardBody>
  <CardFooter>
    <Button>View Gallery</Button>
  </CardFooter>
</Card>
```

## Interactive Cards

### Clickable Card

Make a card interactive with hover effects:

```svelte
<script>
  function handleClick() {
    console.log('Card clicked!');
  }
</script>

<Card clickable on:click={handleClick}>
  <CardHeader title="Click Me" />
  <CardBody>
    <p>This card responds to clicks</p>
  </CardBody>
</Card>
```

### Card as Link

Cards can function as links:

```svelte
<Card href="/user/profile">
  <CardHeader title="View Profile" subtitle="See your complete profile" />
  <CardBody>
    <p>Click anywhere on this card to navigate</p>
  </CardBody>
</Card>

<!-- External link -->
<Card href="https://example.com" target="_blank" rel="noopener noreferrer">
  <CardBody>
    <p>Visit external site</p>
  </CardBody>
</Card>
```

## CardHeader Examples

### Header with Actions

```svelte
<Card>
  <CardHeader title="Settings" subtitle="Configure your preferences">
    {#snippet actions()}
      <button aria-label="Edit">✏️</button>
      <button aria-label="Delete">🗑️</button>
    {/snippet}
  </CardHeader>
  <CardBody>
    <p>Settings content...</p>
  </CardBody>
</Card>
```

### Custom Header Content

```svelte
<Card>
  <CardHeader>
    <div class="custom-header">
      <img src="/avatar.jpg" alt="User avatar" />
      <div>
        <h2>Custom Header</h2>
        <p>Completely custom layout</p>
      </div>
    </div>
  </CardHeader>
  <CardBody>
    <p>Card content...</p>
  </CardBody>
</Card>
```

## CardFooter Examples

### Footer Alignment

```svelte
<!-- Left aligned (default) -->
<Card>
  <CardBody>Content</CardBody>
  <CardFooter align="left">
    <Button>Left Button</Button>
  </CardFooter>
</Card>

<!-- Center aligned -->
<Card>
  <CardBody>Content</CardBody>
  <CardFooter align="center">
    <Button>Centered Button</Button>
  </CardFooter>
</Card>

<!-- Right aligned -->
<Card>
  <CardBody>Content</CardBody>
  <CardFooter align="right">
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </CardFooter>
</Card>
```

## Real-World Examples

### User Profile Card

```svelte
<Card variant="elevated">
  <CardHeader title="John Doe" subtitle="Software Engineer">
    {#snippet actions()}
      <Button size="sm" variant="ghost">Edit</Button>
    {/snippet}
  </CardHeader>
  <CardBody>
    <div class="profile-stats">
      <div>
        <strong>124</strong>
        <span>Posts</span>
      </div>
      <div>
        <strong>1.2k</strong>
        <span>Followers</span>
      </div>
      <div>
        <strong>342</strong>
        <span>Following</span>
      </div>
    </div>
  </CardBody>
  <CardFooter align="right">
    <Button variant="primary">Follow</Button>
  </CardFooter>
</Card>
```

### Article Preview Card

```svelte
<Card variant="outlined" clickable on:click={() => navigate('/article/123')}>
  <CardBody padding="none">
    <img src="/article-image.jpg" alt="Article preview" class="card-image" />
  </CardBody>
  <CardBody>
    <h3>Understanding Design Systems</h3>
    <p>Learn how to build and maintain effective design systems...</p>
    <div class="meta">
      <span>5 min read</span>
      <span>•</span>
      <span>March 15, 2024</span>
    </div>
  </CardBody>
</Card>
```

### Product Card

```svelte
<Card variant="filled">
  <CardBody padding="none">
    <img src="/product.jpg" alt="Product" class="product-image" />
  </CardBody>
  <CardHeader title="Premium Headphones" subtitle="$299.99" />
  <CardBody>
    <p>High-quality wireless headphones with active noise cancellation.</p>
    <div class="rating">★★★★★ (128 reviews)</div>
  </CardBody>
  <CardFooter>
    <Button variant="secondary">Add to Wishlist</Button>
    <Button variant="primary">Add to Cart</Button>
  </CardFooter>
</Card>
```

### Notification Card

```svelte
<Card variant="outlined" padding="sm">
  <CardBody padding="none">
    <div class="notification">
      <div class="notification-icon">🔔</div>
      <div class="notification-content">
        <strong>New message received</strong>
        <p>You have 3 unread messages from Alice.</p>
        <small>2 minutes ago</small>
      </div>
      <button class="notification-close" aria-label="Dismiss">×</button>
    </div>
  </CardBody>
</Card>
```

### Dashboard Stat Card

```svelte
<Card variant="elevated" clickable href="/analytics/revenue">
  <CardBody>
    <div class="stat-card">
      <div class="stat-icon">💰</div>
      <div class="stat-content">
        <p class="stat-label">Total Revenue</p>
        <h2 class="stat-value">$124,567</h2>
        <p class="stat-change positive">+12.5% from last month</p>
      </div>
    </div>
  </CardBody>
</Card>
```

### Settings Card

```svelte
<Card variant="outlined">
  <CardHeader title="Privacy Settings" subtitle="Control who can see your information" />
  <CardBody>
    <div class="settings-list">
      <div class="setting-item">
        <div>
          <strong>Profile Visibility</strong>
          <p>Choose who can view your profile</p>
        </div>
        <ToggleSwitch />
      </div>
      <div class="setting-item">
        <div>
          <strong>Email Notifications</strong>
          <p>Receive updates via email</p>
        </div>
        <ToggleSwitch checked />
      </div>
    </div>
  </CardBody>
  <CardFooter align="right">
    <Button variant="primary">Save Settings</Button>
  </CardFooter>
</Card>
```

## Accessibility

### Semantic Structure

```svelte
<!-- Use appropriate ARIA attributes -->
<Card role="article" aria-labelledby="card-title">
  <CardHeader>
    <h3 id="card-title">Accessible Card</h3>
  </CardHeader>
  <CardBody>
    <p>This card follows accessibility best practices.</p>
  </CardBody>
</Card>
```

### Keyboard Navigation

```svelte
<!-- Clickable cards are keyboard accessible -->
<Card
  clickable
  tabindex="0"
  role="button"
  aria-label="View user profile"
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
>
  <CardBody>
    <p>Press Enter to activate</p>
  </CardBody>
</Card>
```

## Props Reference

### Card

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'elevated' \| 'outlined' \| 'filled'` | `'elevated'` | Visual style variant |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Padding inside the card |
| `clickable` | `boolean` | `false` | Adds hover effects and cursor pointer |
| `href` | `string` | `undefined` | Makes card a link wrapper |
| `class` | `string` | `''` | Additional CSS classes |

### CardHeader

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `undefined` | Header title text |
| `subtitle` | `string` | `undefined` | Optional subtitle text |
| `class` | `string` | `''` | Additional CSS classes |

### CardBody

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Padding inside the body |
| `class` | `string` | `''` | Additional CSS classes |

### CardFooter

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Horizontal alignment |
| `class` | `string` | `''` | Additional CSS classes |

## Design Tokens

The Card components use the following CSS variables from the design system:

- `--color-surface` - Card background
- `--color-surface-variant` - Filled variant background
- `--color-border` - Border color
- `--shadow-md`, `--shadow-lg` - Elevation shadows
- `--radius-lg` - Border radius
- `--space-*` - Spacing scale
- `--font-size-*` - Typography scale
- `--transition-base` - Transitions

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Supports dark theme via CSS variables
- Respects user motion preferences
- High contrast mode support
