# Contact Form API Template

This template demonstrates how to create a contact form API endpoint using the `@goobits/forms` package.

## Usage

1. Create a SvelteKit API route at `/api/contact/+server.js` (or your preferred location)
2. Use the `createContactApiHandler` function to create the POST handler
3. Configure the handler with your application-specific options
4. Connect the API endpoint to your form component

## Example

```javascript
// /api/contact/+server.js
import { createContactApiHandler } from '@goobits/forms/handlers/contactFormHandler'

export const POST = createContactApiHandler({
  // Email configuration
  adminEmail: process.env.ADMIN_EMAIL,
  fromEmail: process.env.FROM_EMAIL,
  
  // Security configuration
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,
  
  // Custom handlers
  customSuccessHandler: async (data) => {
    // Store in database, send notifications, etc.
    return {
      message: 'Thank you for your message!',
      reference: `REF-${Date.now().toString(36)}`
    }
  }
})
```

## Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `adminEmail` | string | Email address to send notifications to |
| `fromEmail` | string | From email address for notifications |
| `emailServiceConfig` | object | Configuration for the email service |
| `successMessage` | string | Default success message |
| `errorMessage` | string | Default error message |
| `rateLimitMessage` | string | Message shown when rate limited |
| `recaptchaSecretKey` | string | reCAPTCHA secret key |
| `recaptchaMinScore` | number | Minimum score for reCAPTCHA v3 (0.0-1.0) |
| `rateLimitMaxRequests` | number | Maximum requests in the time window |
| `rateLimitWindowMs` | number | Time window for rate limiting in milliseconds |
| `logSubmissions` | boolean | Whether to log submissions |
| `customValidation` | function | Custom validation function |
| `customSuccessHandler` | function | Custom success handler function |

## Email Service Configuration

The `emailServiceConfig` object supports different email providers:

### AWS SES

```javascript
emailServiceConfig: {
  provider: 'aws-ses',
  region: 'us-east-1',
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  apiVersion: 'latest'
}
```

### Mock Provider (for development)

```javascript
emailServiceConfig: {
  provider: 'mock'
}
```

## Custom Handlers

### Custom Validation

```javascript
customValidation: data => {
  const errors = {}
  
  if (data.phone && !/^\+?[\d\s()-]{7,}$/.test(data.phone)) {
    errors.phone = 'Please enter a valid phone number'
  }
  
  return errors
}
```

### Custom Success Handler

```javascript
customSuccessHandler: async (data, clientAddress) => {
  // Store in database
  const id = await db.insertContactSubmission({
    ...data,
    ip: clientAddress,
    timestamp: new Date()
  })
  
  // Return custom response
  return {
    message: 'Thank you for your message!',
    reference: `REF-${id}`
  }
}
```