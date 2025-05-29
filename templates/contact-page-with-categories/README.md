# Category-based Contact Form Template

This template provides a complete implementation of a contact form system with multiple categories. It allows users to select different categories of contact (e.g., general inquiries, technical support, feedback) with category-specific form fields.

## Features

- Multiple contact categories with customizable fields per category
- Form validation with field-level error messages
- CSRF protection for security
- Success page with thank-you message
- Easily customizable styling and messages
- Mobile-responsive design

## Installation

1. Copy these template files to your SvelteKit routes directory:
   - `+page.svelte` → your-routes/contact/[...slug]/+page.svelte
   - `+page.server.js` → your-routes/contact/[...slug]/+page.server.js

2. Update the imports in the files to point to your configuration:
   ```javascript
   import { contactConfig } from '$lib/config/contact.js'
   import { initContactFormConfig } from '@goobits/forms/config/contactSchemas.js'
   ```

3. Create your contact configuration file based on the example:
   ```javascript
   // $lib/config/contact.js
   export const contactConfig = {
     appName: 'Your App',
     categories: {
       // Your categories here
     },
     fieldConfigs: {
       // Your field configurations here
     },
     // ...other configuration
   }
   ```

## Customization

### Adding New Categories

Add new categories to your configuration:

```javascript
categories: {
  'general': {
    label: 'General Inquiry',
    icon: 'MessageCircle',
    fields: ['name', 'email', 'subject', 'message']
  },
  'support': {
    label: 'Technical Support',
    icon: 'HelpCircle',
    fields: ['name', 'email', 'operatingSystem', 'browser', 'message']
  },
  // Add your new category
  'partnership': {
    label: 'Partnership Opportunity',
    icon: 'Handshake',
    fields: ['name', 'email', 'company', 'message']
  }
}
```

### Custom Field Validation

Extend the validation logic in your configuration:

```javascript
getValidatorForCategory: (categorySlug) => {
  return (data) => {
    const errors = {}
    
    // Basic required field validation
    // ...
    
    // Custom validation logic
    if (data.email && !data.email.includes('@')) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (categorySlug === 'support' && data.browser) {
      if (data.browser.toLowerCase().includes('internet explorer')) {
        errors.browser = 'We no longer support Internet Explorer'
      }
    }
    
    return errors
  }
}
```

### Styling

The template includes basic styling that you can customize by editing the `<style>` section in `+page.svelte`. You can also integrate your own CSS framework or design system.

## Usage

This contact form system uses SvelteKit's form actions for processing. When a user submits the form:

1. The form data is sent to the server
2. The `actions.default` function in `+page.server.js` validates the submission
3. If validation passes, the submission handler processes the data
4. The user is redirected to the success page or shown error messages

## API

See the `@goobits/forms` documentation for the full API reference for the components and functions used in this template.