# Documentation Style Guide

Maintain consistent voice and formatting across @goobits/forms documentation.

---

## Voice & Tone

### Target Aesthetic

**Apple × Medium × Concise × Comprehensive**

- **Apple aesthetics**: Clean, minimalist, confident, simple
- **Medium-style copywriting**: Engaging, human, conversational but professional
- **Concise vibes**: Dense with information, no fluff, approachable
- **Easy to grok**: Clear structure, scannable, logical flow, respects power users

---

## Writing Rules

### 1. Use Conversational Imperative

Write directly to the user with action verbs.

✅ **Good:**
- "Install the package"
- "Build secure forms by validating data server-side"
- "Configure your form"

❌ **Bad:**
- "You can install the package"
- "This package doesn't provide security" (defensive)
- "The form can be configured" (passive)

---

### 2. Present Tense for Descriptions

Use present tense when describing what the package does.

✅ **Good:**
- "ContactForm handles validation and submission"
- "The package provides client-side checks for better UX"

❌ **Bad:**
- "ContactForm will handle validation" (future)
- "The package provided client-side checks" (past)

---

### 3. Confident, Not Arrogant

Be direct and confident without being dismissive.

✅ **Good:**
- "Production-ready forms for SvelteKit. Secure. Accessible. Done."
- "Build secure forms by validating data server-side"

❌ **Bad:**
- "The best forms library ever created" (arrogant)
- "This might work for some use cases" (timid)
- "We're not sure if this is production-ready" (unconfident)

---

### 4. Second Person ("You")

Address the reader directly.

✅ **Good:**
- "Install the dependencies you need"
- "Test your forms with Vitest"

❌ **Bad:**
- "One should install the dependencies" (formal/distant)
- "We need to install dependencies" (ambiguous "we")

---

### 5. Avoid Passive Voice

Use active voice for clarity and directness.

✅ **Good:**
- "Configure rate limiting in the API handler"
- "The form validates input on blur"

❌ **Bad:**
- "Rate limiting can be configured" (passive)
- "Input is validated on blur" (passive, acceptable for descriptions)

---

### 6. No Emoji in Headers (Except Security)

Keep headers clean. Exception: 🔒 for security sections.

✅ **Good:**
```markdown
## Security

## 🔒 Security
```

❌ **Bad:**
```markdown
## 🚀 Quick Start
## 📚 Documentation
## ⚙️ Configuration
```

---

### 7. Consistent Header Format

Use imperative or noun-based headers consistently within a document.

✅ **Good - Imperative:**
- Get Started
- Configure Forms
- Add Security
- Deploy to Production

✅ **Good - Noun-based:**
- Installation
- Configuration
- Security
- Deployment

❌ **Bad - Mixed:**
- Quick Start (adjective + noun)
- Configuring (gerund)
- Security (noun)
- How to Deploy (question phrase)

---

### 8. Fragment Sentences for Emphasis

Use fragments for headlines and emphasis, complete sentences for explanations.

✅ **Good:**
```markdown
## Quick Start

Ship a contact form in 5 minutes.

Install the package:
\`\`\`bash
npm install @goobits/forms
\`\`\`

Configure your form in `hooks.server.js`. Initialize the configuration before your app starts.
```

❌ **Bad:**
```markdown
## Quick Start

Ship. Form. Minutes. Install. Configure. Done.
(Too many fragments - gimmicky)
```

---

## Formatting Standards

### Code Examples

**Annotate with comments:**
```javascript
// ✅ Good - Clear context
// src/hooks.server.js
import { initContactFormConfig } from '@goobits/forms/config';
```

```javascript
// ❌ Bad - No context
import { initContactFormConfig } from '@goobits/forms/config';
```

**Show correct and incorrect examples:**
```javascript
// ✅ CORRECT
import { ContactForm } from '@goobits/forms/ui';

// ❌ WRONG
import { ContactForm } from '@goobits/forms';
```

---

### Lists

**Use parallel structure:**

✅ **Good:**
- Install package
- Configure form
- Create API endpoint
- Add form component

❌ **Bad:**
- Install the package
- Form configuration
- You need to create an API
- Adding the form

---

### Links

**Use descriptive link text:**

✅ **Good:**
- See [Getting Started Guide](./docs/getting-started.md) for setup instructions
- Learn more in [API Reference](./docs/api-reference.md)

❌ **Bad:**
- See [here](./docs/getting-started.md) for setup
- Click [this link](./docs/api-reference.md) to learn more
- [Link](./docs/api-reference.md)

---

### Tables

**Use tables for structured comparisons:**

✅ **Good:**

| Feature | v1.0.0 | v1.1.0 | v1.2.0 |
|---------|--------|--------|--------|
| Contact Forms | ✅ | ✅ | ✅ |
| reCAPTCHA | ✅ | ✅ (improved) | ✅ |

❌ **Bad:**
Version 1.0.0 has contact forms and reCAPTCHA. Version 1.1.0 has contact forms and improved reCAPTCHA. Version 1.2.0...

---

## Section Structure

### README.md

1. **Hero** - Title, tagline, badges
2. **Choose Your Path** - Quick Start vs Documentation
3. **Key Features** - Bullet list (6-8 items max)
4. **Quick Start** - 3-5 step copy-paste flow
5. **Security Notice** - Brief, confident
6. **Documentation** - Organized links to docs/
7. **Component Overview** - Import examples
8. **Key Topics** - Styling, Email, i18n (brief with links)
9. **Requirements** - Technical prerequisites
10. **License & Links** - Footer navigation

**Length:** ~300 lines maximum

---

### Documentation Files

1. **Title & Summary** - One sentence describing purpose
2. **Navigation** - Quick jump links if > 200 lines
3. **Body** - Progressive disclosure (simple → complex)
4. **Examples** - Practical, working code
5. **Related Links** - Cross-references to other docs

**Length:** No strict limit, but aim for < 500 lines per file

---

## Before/After Examples

### Example 1: Security Notice

❌ **Before (Defensive):**
> ## 🔒 Security Notice
>
> Implement server-side validation and sanitization. This package's client-side checks enhance UX but don't provide security.

✅ **After (Confident):**
> ## 🔒 Security
>
> Build secure forms by validating data server-side. This package provides client-side checks for better UX, but security happens in your API handlers.

---

### Example 2: Installation

❌ **Before (Verbose):**
> You can install the package by running the following command in your terminal:
> ```bash
> npm install @goobits/forms
> ```

✅ **After (Concise):**
> Install the package:
> ```bash
> npm install @goobits/forms
> ```

---

### Example 3: Feature Description

❌ **Before (Marketing fluff):**
> We've built an amazing, enterprise-grade internationalization system that will revolutionize how you think about i18n in SvelteKit applications!

✅ **After (Informative):**
> Internationalization with Paraglide integration and automatic language detection.

---

## Common Mistakes

### 1. Over-explaining

❌ **Bad:**
> When you want to customize the appearance of your form, you have the option to override the default CSS variables that are provided by the package. This can be done by targeting the `.forms-scope` class in your stylesheets and providing new values for the variables you wish to change.

✅ **Good:**
> Customize form appearance by overriding CSS variables in `.forms-scope`:
> ```css
> .forms-scope {
>   --color-primary-500: #3b82f6;
> }
> ```

---

### 2. Apologetic Language

❌ **Bad:**
> Unfortunately, we don't currently support...
> We're sorry, but this feature isn't ready yet...

✅ **Good:**
> This feature is coming soon.
> Not yet supported. See [issue #123] for progress.

---

### 3. Unnecessary Qualifiers

❌ **Bad:**
> This package tries to provide...
> We think this approach might work...
> You can probably use...

✅ **Good:**
> This package provides...
> This approach works for...
> Use this when...

---

## Documentation Checklist

Before publishing documentation:

- [ ] Voice is conversational imperative
- [ ] No passive voice in instructions
- [ ] Headers are consistent format (all imperative or all noun-based)
- [ ] Code examples have file path comments
- [ ] Links use descriptive text (no "click here")
- [ ] No emoji in headers (except 🔒 Security)
- [ ] Fragment sentences only for emphasis
- [ ] Security information is confident, not defensive
- [ ] Examples show both correct and incorrect usage where helpful
- [ ] All import paths are correct and tested
- [ ] Cross-references to related documentation

---

## Updating This Guide

When adding new guidelines:

1. Include before/after examples
2. Explain the "why" behind the rule
3. Show real examples from our documentation
4. Keep rules actionable and specific

---

**Remember:** Good documentation respects the reader's time and intelligence. Be clear, be brief, be confident.
