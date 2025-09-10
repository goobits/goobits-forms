# 📝 @goobits/forms
Configurable SvelteKit form library with validation, reCAPTCHA, and file uploads

## ✨ Key Features
- **🎨 Form Types** - Contact, support, feedback, booking, and business forms
- **✅ Schema Validation** - Built-in Zod validation with type safety
- **🔐 Bot Protection** - Optional reCAPTCHA v3 integration
- **📎 File Uploads** - Image uploads with preview and validation
- **🌍 Internationalization** - Built-in i18n support with Paraglide integration
- **♿ Accessibility** - WCAG 2.1 compliant with ARIA support

## 🔒 Security Notice
This package handles user input. Always validate and sanitize data server-side. Never trust client-side validation alone. The included sanitization is basic and should be supplemented with server-side security measures.

## 🚀 Quick Start
```bash
# Install package and peer dependencies
npm install @goobits/forms @sveltejs/kit svelte formsnap lucide-svelte sveltekit-superforms zod

# Alternative with bun
bun add @goobits/forms @sveltejs/kit svelte formsnap lucide-svelte sveltekit-superforms zod
```

```js
// src/lib/contact-config.js - Configure form categories
export const contactConfig = {
  appName: 'My App',
  categories: {
    'general': {
      label: 'General Inquiry',
      fields: ['name', 'email', 'message', 'coppa']
    },
    'support': {
      label: 'Technical Support',  
      fields: ['name', 'email', 'urgency', 'message', 'attachment']
    }
  }
}
```

```js
// src/app.js - Initialize configuration
import { initContactFormConfig } from '@goobits/forms/config'
import { contactConfig } from '$lib/contact-config.js'

initContactFormConfig(contactConfig)
```

```svelte
<!-- src/routes/contact/+page.svelte - Basic usage -->
<script>
  import { ContactForm } from '@goobits/forms'
  export let data
</script>

<h1>Contact Us</h1>
<ContactForm apiEndpoint="/api/contact" />
```

## ⚙️ Configuration

```js
// Complete configuration options
const contactConfig = {
  appName: 'My App',
  
  // UI customization
  ui: {
    submitButtonText: 'Send Message',
    submittingButtonText: 'Sending...',
    resetAfterSubmit: true,
    showSuccessMessage: true
  },
  
  // reCAPTCHA integration
  recaptcha: {
    enabled: true,
    provider: 'google-v3',
    siteKey: 'YOUR_RECAPTCHA_SITE_KEY',
    threshold: 0.5
  },
  
  // File upload settings
  uploads: {
    enabled: true,
    maxSize: '5MB',
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
  }
}
```

## 🌐 Internationalization

### Component-Level Translation
```svelte
<!-- Direct message prop override -->
<script>
  import { ContactForm } from '@goobits/forms'
  
  const messages = {
    howCanWeHelp: 'Comment pouvons-nous vous aider?',
    sendMessage: 'Envoyer le message',
    sending: 'Envoi en cours...'
  }
</script>

<ContactForm {messages} />
```

### Server Integration
```js
// hooks.server.js - Automatic language detection
import { handleFormI18n } from '@goobits/forms/i18n'

export async function handle({ event, resolve }) {
  await handleFormI18n(event) # Adds language info to event.locals
  return await resolve(event)
}
```

### Page Integration
```js
// contact/+page.server.js - Enhanced page loading
import { loadWithFormI18n } from '@goobits/forms/i18n'

export const load = async (event) => {
  return await loadWithFormI18n(event, async () => {
    return { formData, categories } # Your existing data
  })
}
```

### Paraglide Integration
```js
// Seamless Paraglide integration
import { createMessageGetter } from '@goobits/forms/i18n'
import * as m from '$paraglide/messages'

const getMessage = createMessageGetter({
  howCanWeHelp: m.howCanWeHelp,
  sendMessage: m.sendMessage,
  sending: m.sending
})
```

## 🧩 Components

```svelte
<!-- Core components -->
<script>
  import { 
    ContactForm,        // Main form with validation
    ContactFormPage,    // Complete page layout
    FormField,          // Reusable field component
    FormErrors,         // Error display
    FeedbackForm,       // Quick feedback widget
    ThankYou,           // Success message
    UploadImage         // File upload with preview
  } from '@goobits/forms'
</script>
```

## 🎨 Styling

```js
// Import default styles
import '@goobits/forms/ui/ContactForm.css'

// Customize with CSS variables
:root {
  --contact-form-primary: #007bff;
  --contact-form-error: #dc3545;
  --contact-form-success: #28a745;
  --contact-form-border-radius: 8px;
}
```

```css
/* Override component styles */
.contact-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-field {
  margin-bottom: 1rem;
}
```

## ♿ Accessibility

WCAG 2.1 AA compliant with:
- Semantic HTML structure and proper heading hierarchy
- ARIA labels, descriptions, and live regions
- Full keyboard navigation and focus management
- Screen reader announcements for errors and state changes
- High contrast mode support and color contrast compliance

## 📝 License

MIT - see [LICENSE](LICENSE) for details