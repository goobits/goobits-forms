# Toast Notification System

A production-ready Toast notification system for @goobits/ui with full accessibility support, animations, and flexible positioning.

## Features

- **Multiple Variants**: Info, Success, Warning, Error
- **Auto-dismiss**: Configurable duration with progress bar
- **Manual Dismiss**: Close button with Escape key support
- **Action Buttons**: Optional action with custom handlers
- **Flexible Positioning**: 6 position options (top/bottom × left/center/right)
- **Queue Management**: Stack multiple toasts with max limit
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA attributes
- **Animations**: Smooth slide-in/out animations
- **Responsive**: Mobile-optimized

## Installation

The toast system is included in `@goobits/ui`. Import components and the `toast` API:

```typescript
import { ToastProvider, toast } from '@goobits/ui';
```

## Basic Usage

### 1. Add ToastProvider to your app layout

Wrap your application with `ToastProvider` to enable toast notifications:

```svelte
<!-- +layout.svelte -->
<script>
  import { ToastProvider } from '@goobits/ui';
</script>

<ToastProvider position="top-right" maxToasts={5}>
  <slot />
</ToastProvider>
```

### 2. Show toasts using the imperative API

```svelte
<script>
  import { toast } from '@goobits/ui';

  function handleSuccess() {
    toast.success('Success!', 'Your changes have been saved.');
  }

  function handleError() {
    toast.error('Error!', 'Something went wrong.');
  }
</script>

<button onclick={handleSuccess}>Save</button>
<button onclick={handleError}>Trigger Error</button>
```

## API Reference

### ToastProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `ToastPosition` | `'top-right'` | Default position for toasts |
| `maxToasts` | `number` | `5` | Maximum number of visible toasts |

### toast API Methods

#### `toast.success(title, message?, options?)`

Show a success toast (auto-dismisses after 5 seconds).

```typescript
toast.success('Saved!', 'Your changes have been saved.');
```

#### `toast.error(title, message?, options?)`

Show an error toast (persistent by default).

```typescript
toast.error('Error!', 'Could not save changes.', {
  action: {
    label: 'Retry',
    onClick: () => handleRetry()
  }
});
```

#### `toast.warning(title, message?, options?)`

Show a warning toast.

```typescript
toast.warning('Warning!', 'Please review before continuing.');
```

#### `toast.info(title, message?, options?)`

Show an info toast.

```typescript
toast.info('FYI', 'New features are available!');
```

#### `toast.show(config)`

Show a toast with custom configuration.

```typescript
toast.show({
  variant: 'info',
  title: 'Custom Toast',
  message: 'With custom options',
  duration: 10000,
  position: 'bottom-center',
  icon: '🎉'
});
```

#### `toast.dismiss(id)`

Dismiss a specific toast by ID.

```typescript
const id = toast.success('Saving...');
// Later...
toast.dismiss(id);
```

#### `toast.dismissAll()`

Dismiss all active toasts.

```typescript
toast.dismissAll();
```

## Examples

### All Variants

```svelte
<script>
  import { toast } from '@goobits/ui';
</script>

<button onclick={() => toast.info('Info', 'This is an informational message')}>
  Info
</button>

<button onclick={() => toast.success('Success', 'Operation completed successfully')}>
  Success
</button>

<button onclick={() => toast.warning('Warning', 'Please be careful')}>
  Warning
</button>

<button onclick={() => toast.error('Error', 'Something went wrong')}>
  Error
</button>
```

### With Action Buttons

```svelte
<script>
  import { toast } from '@goobits/ui';

  function deleteItem() {
    // Delete logic here
    const deletedItem = { name: 'Important File' };

    toast.info('Deleted', `${deletedItem.name} was deleted`, {
      duration: 10000,
      action: {
        label: 'Undo',
        onClick: () => restoreItem(deletedItem)
      }
    });
  }

  function restoreItem(item) {
    // Restore logic
    toast.success('Restored', `${item.name} was restored`);
  }
</script>

<button onclick={deleteItem}>Delete Item</button>
```

### Custom Duration

```svelte
<script>
  import { toast } from '@goobits/ui';
</script>

<!-- Quick notification (2 seconds) -->
<button onclick={() => toast.success('Quick!', undefined, { duration: 2000 })}>
  Quick Toast
</button>

<!-- Long notification (15 seconds) -->
<button onclick={() => toast.info('Read this!', 'This is important', { duration: 15000 })}>
  Long Toast
</button>
```

### Persistent Toasts

```svelte
<script>
  import { toast } from '@goobits/ui';

  function showPersistentError() {
    toast.error(
      'Connection Lost',
      'Unable to connect to server. Please check your connection.',
      {
        duration: 0, // Never auto-dismiss
        action: {
          label: 'Retry',
          onClick: () => reconnect()
        }
      }
    );
  }
</script>

<button onclick={showPersistentError}>Show Persistent Error</button>
```

### Different Positions

```svelte
<script>
  import { toast } from '@goobits/ui';
</script>

<button onclick={() => toast.info('Top Left', undefined, { position: 'top-left' })}>
  Top Left
</button>

<button onclick={() => toast.info('Top Center', undefined, { position: 'top-center' })}>
  Top Center
</button>

<button onclick={() => toast.info('Top Right', undefined, { position: 'top-right' })}>
  Top Right
</button>

<button onclick={() => toast.info('Bottom Left', undefined, { position: 'bottom-left' })}>
  Bottom Left
</button>

<button onclick={() => toast.info('Bottom Center', undefined, { position: 'bottom-center' })}>
  Bottom Center
</button>

<button onclick={() => toast.info('Bottom Right', undefined, { position: 'bottom-right' })}>
  Bottom Right
</button>
```

### Custom Icons

```svelte
<script>
  import { toast } from '@goobits/ui';
</script>

<button onclick={() => toast.success('Party Time!', 'Celebration', { icon: '🎉' })}>
  Custom Icon
</button>
```

### Integration with Forms

```svelte
<script>
  import { toast } from '@goobits/ui';

  async function handleSubmit(event) {
    const formData = new FormData(event.target);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast.success('Submitted!', 'Your form has been submitted successfully.');
        event.target.reset();
      } else {
        const error = await response.json();
        toast.error('Submission Failed', error.message, {
          duration: 0,
          action: {
            label: 'Retry',
            onClick: () => event.target.requestSubmit()
          }
        });
      }
    } catch (err) {
      toast.error('Network Error', 'Please check your connection and try again.', {
        duration: 0,
        action: {
          label: 'Retry',
          onClick: () => event.target.requestSubmit()
        }
      });
    }
  }
</script>

<form onsubmit|preventDefault={handleSubmit}>
  <input type="text" name="name" placeholder="Name" required />
  <input type="email" name="email" placeholder="Email" required />
  <button type="submit">Submit</button>
</form>
```

### Loading States

```svelte
<script>
  import { toast } from '@goobits/ui';

  async function saveData() {
    const toastId = toast.info('Saving...', 'Please wait', {
      duration: 0,
      dismissible: false
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      toast.dismiss(toastId);
      toast.success('Saved!', 'Your data has been saved.');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Save Failed', err.message);
    }
  }
</script>

<button onclick={saveData}>Save Data</button>
```

### Promise-based Workflow

```svelte
<script>
  import { toast } from '@goobits/ui';

  async function processWithToast() {
    const loadingId = toast.info('Processing...', undefined, {
      duration: 0,
      dismissible: false
    });

    try {
      await someAsyncOperation();
      toast.dismiss(loadingId);
      toast.success('Complete!', 'Processing finished successfully.');
    } catch (error) {
      toast.dismiss(loadingId);
      toast.error('Processing Failed', error.message, {
        action: {
          label: 'Try Again',
          onClick: processWithToast
        }
      });
    }
  }
</script>
```

### Queue Management

```svelte
<script>
  import { toast } from '@goobits/ui';

  function showMultiple() {
    toast.info('First notification');
    toast.success('Second notification');
    toast.warning('Third notification');
    toast.error('Fourth notification');
  }

  function clearAll() {
    toast.dismissAll();
  }
</script>

<button onclick={showMultiple}>Show Multiple Toasts</button>
<button onclick={clearAll}>Clear All</button>
```

## TypeScript

All types are exported for TypeScript users:

```typescript
import type { ToastVariant, ToastPosition, ToastAction, ToastConfig } from '@goobits/ui';

const config: ToastConfig = {
  variant: 'success',
  title: 'Typed Toast',
  message: 'With full type safety',
  duration: 5000,
  position: 'top-right'
};

toast.show(config);
```

## Accessibility

The toast system is fully accessible:

- **ARIA Roles**: `role="status"` for info/success, `role="alert"` for warning/error
- **ARIA Live**: `aria-live="polite"` for info/success, `aria-live="assertive"` for warning/error
- **ARIA Atomic**: `aria-atomic="true"` for complete announcements
- **Keyboard Navigation**: Escape key to dismiss, Tab to navigate actions
- **Focus Management**: Proper focus handling for action buttons
- **Screen Reader Support**: Descriptive labels and announcements

## Best Practices

1. **Keep messages concise**: Use short, clear titles and messages
2. **Use appropriate variants**: Match the variant to the message importance
3. **Persistent errors**: Set `duration: 0` for critical errors
4. **Provide actions**: Offer undo or retry actions when appropriate
5. **Limit toasts**: Don't overwhelm users with too many simultaneous toasts
6. **Position wisely**: Choose positions that don't obscure important content
7. **Test accessibility**: Ensure screen readers can announce your toasts

## Browser Support

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

The toast system uses CSS custom properties (design tokens) for easy theming:

```css
:root {
  --color-info-500: #3b82f6;
  --color-success-500: #10b981;
  --color-warning-500: #f59e0b;
  --color-error-500: #ef4444;
  --radius-lg: 0.5rem;
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

See `/src/lib/ui/variables.css` for all available design tokens.
