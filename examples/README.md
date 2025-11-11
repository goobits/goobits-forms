# Examples

Real-world implementations of @goobits/forms.

## Available Examples

### Contact API Handler
**Location:** `./contact-api/`

Full-featured server-side contact form handler with:
- Email delivery (Nodemailer, AWS SES)
- CSRF protection
- reCAPTCHA verification
- Rate limiting
- Field validation
- Custom success handlers

**Topics Covered:**
- API endpoint setup
- Email service configuration
- Security implementation
- Error handling

**Usage:**
```bash
cd contact-api
npm install
npm run dev
```

See `contact-api/README.md` for complete setup instructions.

---

## Roadmap

Additional examples planned:
- Multi-category form with dynamic fields
- File upload handling with S3
- Custom field validation
- Internationalization (i18n) setup

---

**Related:**
- [Getting Started Guide](../docs/getting-started.md) - Basic setup
- [API Reference](../docs/api-reference.md) - Component documentation
- [Configuration Guide](../docs/configuration.md) - Customization options
