# @goobits/forms

⚠️ **EXPERIMENTAL PACKAGE - v0.0.1-alpha**

A configurable, accessible form library for SvelteKit with contact forms, validation, optional reCAPTCHA support, and file uploads.

## 🔒 Security Notice

This package handles user input. Always validate and sanitize data server-side. Never trust client-side validation alone. The included sanitization is basic and should be supplemented with server-side security measures.

## ✨ Features

- 🎨 Multiple form types (general, support, feedback, booking, business)
- ✅ Built-in validation with Zod
- 🔐 Optional reCAPTCHA v3 integration
- 📎 File upload support with preview
- 💾 Form state persistence
- ♿ Accessibility features
- 🎯 JSDoc type annotations
- 🔧 Highly configurable
- 🚀 Easy to integrate
- 🌍 Internationalization (i18n) support

## 📦 Installation

```bash
npm install @goobits/forms

# Required peer dependencies
npm install @sveltejs/kit svelte formsnap lucide-svelte sveltekit-superforms zod
```

## 🚀 Quick Start

```js
// src/lib/contact-config.js
export const contactConfig = {
  appName: 'My App',
  categories: {
    'general': {
      label: 'General Inquiry',
      fields: ['name', 'email', 'message', 'coppa']
    }
  }
}

// src/app.js
import { initContactFormConfig } from '@goobits/forms/config'
import { contactConfig } from '$lib/contact-config.js'

initContactFormConfig(contactConfig)
```

```svelte
<!-- src/routes/contact/+page.svelte -->
<script>
  import { ContactForm } from '@goobits/forms'
  export let data
</script>

<h1>Contact Us</h1>
<ContactForm 
  apiEndpoint="/api/contact"
/>
```

## 🔧 Configuration

```js
const contactConfig = {
  appName: 'My App',
  
  // Form UI settings
  ui: {
    submitButtonText: 'Send Message',
    submittingButtonText: 'Sending...',
    resetAfterSubmit: true
  },
  
  // reCAPTCHA settings
  recaptcha: {
    enabled: false,
    provider: 'google-v3',
    siteKey: 'YOUR_SITE_KEY'
  }
}
```

## 🌐 Internationalization (i18n)

The contactform package supports full internationalization through multiple integration methods:

### 1. Component-level Translation

All components accept a `messages` prop for direct translation override:

```svelte
<script>
  import { ContactForm } from '@goobits/forms'
  
  // Custom translations
  const messages = {
    howCanWeHelp: 'How can we help you?',
    sendMessage: 'Send Message',
    sending: 'Sending...'
  }
</script>

<ContactForm {messages} />
```

### 2. Server Integration

For full i18n with automatic language detection and routing:

```js
// hooks.server.js
import { handleFormI18n } from '@goobits/forms/i18n'

export async function handle({ event, resolve }) {
  // Add language info to event.locals
  await handleFormI18n(event)
  
  // Continue with request handling
  return await resolve(event)
}
```

### 3. Page Integration

Enhance contact form pages with i18n data:

```js
// contact/+page.server.js
import { loadWithFormI18n } from '@goobits/forms/i18n'

export const load = async (event) => {
  return await loadWithFormI18n(event, async () => {
    // Your original contact form data loading
    return { formData, categories }
  })
}
```

### 4. Paraglide Integration

For seamless integration with Paraglide (recommended):

```js
import { createMessageGetter } from '@goobits/forms/i18n'
import * as m from '$paraglide/messages'

// Map form messages to Paraglide translations
const getMessage = createMessageGetter({
  howCanWeHelp: m.howCanWeHelp,
  sendMessage: m.sendMessage,
  sending: m.sending
})
```

## 🧩 Components

- `ContactForm` - Main form component with validation
- `ContactFormPage` - Complete page with form and layout
- `FormField` - Reusable form field with validation
- `FormErrors` - Form error display component
- `FeedbackForm` - Quick feedback form widget
- `ThankYou` - Success message component
- `UploadImage` - File upload component

## 🎨 Styling

```js
// Import SCSS directly
import '@goobits/forms/ui/ContactForm.scss'

// Or customize with CSS variables
:root {
  --contact-form-primary: #007bff;
  --contact-form-error: #dc3545;
  --contact-form-success: #28a745;
}
```

## ♿ Accessibility

The component follows WCAG 2.1 guidelines:
- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Focus management
- Error announcements
- Color contrast compliance

## 📄 License

MIT