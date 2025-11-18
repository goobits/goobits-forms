# Migration Guide: @goobits/forms → @goobits/ui

## v2.0.0 - Package Rename

Starting with version 2.0.0, this package has been renamed from `@goobits/forms` to `@goobits/ui` to better reflect its expanded scope beyond forms to include modals, menus, tooltips, and other UI components.

### What Changed

**Package Name Only** - This is purely a package rename. All exports, component names, APIs, and functionality remain exactly the same.

- ✅ Package name: `@goobits/forms` → `@goobits/ui`
- ✅ Version: `1.x.x` → `2.0.0`
- ❌ No API changes
- ❌ No component name changes
- ❌ No breaking functional changes

### Why the Rename?

The package originally focused on form components, but has evolved to include:
- **Form Components** - ContactForm, FeedbackForm, CategoryContactForm
- **Modal Components** - Modal, Alert, Confirm, AppleModal
- **Menu Components** - Menu, ContextMenu, MenuItem
- **Tooltip Components** - tooltip directive, TooltipPortal
- **Input Components** - Input, Textarea, SelectMenu, ToggleSwitch

The new name `@goobits/ui` better represents this comprehensive UI component library.

---

## Migration Steps

### 1. Update package.json

Replace the old package with the new one:

```bash
npm uninstall @goobits/forms
npm install @goobits/ui
```

Or with pnpm:

```bash
pnpm remove @goobits/forms
pnpm add @goobits/ui
```

Or with yarn:

```bash
yarn remove @goobits/forms
yarn add @goobits/ui
```

### 2. Update Import Statements

**Option A: Find and Replace (Recommended)**

Use your editor's find-and-replace feature to update all import statements:

1. **Search for:** `@goobits/forms`
2. **Replace with:** `@goobits/ui`
3. **Where:** All `.js`, `.ts`, `.svelte`, and `.md` files in your project

**Option B: Manual Update**

Update each import statement manually:

```diff
// Before
- import { ContactForm } from '@goobits/forms/ui';
- import { initContactFormConfig } from '@goobits/forms/config';
- import { createContactApiHandler } from '@goobits/forms/handlers/contactFormHandler';
- import '@goobits/forms/ui/variables.css';
- import '@goobits/forms/ui/ContactForm.css';

// After
+ import { ContactForm } from '@goobits/ui/ui';
+ import { initContactFormConfig } from '@goobits/ui/config';
+ import { createContactApiHandler } from '@goobits/ui/handlers/contactFormHandler';
+ import '@goobits/ui/ui/variables.css';
+ import '@goobits/ui/ui/ContactForm.css';
```

### 3. Update CSS Imports

```diff
// Before
- import '@goobits/forms/ui/variables.css';
- import '@goobits/forms/ui/ContactForm.css';
- import '@goobits/forms/ui/index.css';

// After
+ import '@goobits/ui/ui/variables.css';
+ import '@goobits/ui/ui/ContactForm.css';
+ import '@goobits/ui/ui/index.css';
```

### 4. Update Configuration Files

#### SvelteKit Configuration

If you reference the package in `svelte.config.js` or `vite.config.js`:

```diff
// vite.config.js or svelte.config.js
export default {
  optimizeDeps: {
    include: [
-     '@goobits/forms',
+     '@goobits/ui',
    ]
  }
}
```

#### TypeScript Configuration

If you reference the package in `tsconfig.json`:

```diff
{
  "compilerOptions": {
    "paths": {
-     "@goobits/forms/*": ["./node_modules/@goobits/forms/*"]
+     "@goobits/ui/*": ["./node_modules/@goobits/ui/*"]
    }
  }
}
```

### 5. Verify Migration

After updating all references, verify your migration:

```bash
# 1. Remove old package from node_modules
rm -rf node_modules package-lock.json pnpm-lock.yaml

# 2. Fresh install
npm install  # or pnpm install / yarn install

# 3. Run tests
npm test

# 4. Build project
npm run build

# 5. Start dev server and test functionality
npm run dev
```

---

## Common Issues

### Issue: Module Not Found

**Error:** `Cannot find module '@goobits/forms'`

**Solution:** You missed updating some imports. Search your entire codebase for `@goobits/forms` and replace with `@goobits/ui`.

```bash
# Find remaining references (Unix/Linux/Mac):
grep -r "@goobits/forms" src/

# Find remaining references (Windows PowerShell):
Select-String -Path "src\*" -Pattern "@goobits/forms" -Recurse
```

### Issue: CSS Not Loading

**Error:** Styles are missing or broken

**Solution:** Verify all CSS import paths were updated:

```javascript
// Check these are updated:
import '@goobits/ui/ui/variables.css';
import '@goobits/ui/ui/ContactForm.css';
import '@goobits/ui/ui/index.css';
```

### Issue: Build Errors

**Error:** Build fails after migration

**Solution:**
1. Clear build cache: `rm -rf .svelte-kit` or `rm -rf build`
2. Clear node_modules: `rm -rf node_modules`
3. Reinstall: `npm install` (or pnpm/yarn)
4. Rebuild: `npm run build`

---

## Deprecation Notice

### @goobits/forms (v1.x.x)

The `@goobits/forms` package will be maintained for security fixes only until **June 1, 2026**. After this date, it will be deprecated and no longer receive updates.

**Timeline:**
- **Now - June 1, 2026:** Security fixes only for `@goobits/forms@1.x`
- **After June 1, 2026:** Package deprecated, no further updates

**Recommendation:** Migrate to `@goobits/ui@2.x` as soon as possible to receive:
- New features and components
- Performance improvements
- Bug fixes
- Security updates
- Community support

---

## Need Help?

If you encounter issues during migration:

1. **Check the documentation:** [https://github.com/goobits/forms/tree/main/docs](https://github.com/goobits/forms/tree/main/docs)
2. **Search existing issues:** [https://github.com/goobits/forms/issues](https://github.com/goobits/forms/issues)
3. **Open a new issue:** [https://github.com/goobits/forms/issues/new](https://github.com/goobits/forms/issues/new)

Include the following in your issue:
- Migration steps you've completed
- Error messages (full stack trace)
- Package versions (`npm list @goobits/ui`)
- SvelteKit version
- Node.js version

---

## Summary Checklist

Use this checklist to ensure a complete migration:

- [ ] Uninstalled `@goobits/forms`
- [ ] Installed `@goobits/ui@2.0.0`
- [ ] Updated all JavaScript/TypeScript imports
- [ ] Updated all CSS imports
- [ ] Updated configuration files (vite.config, tsconfig, etc.)
- [ ] Cleared node_modules and reinstalled dependencies
- [ ] Cleared build cache
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Application runs correctly in development
- [ ] Application runs correctly in production

**Estimated Migration Time:** 5-15 minutes for most projects

---

**Questions?** Open an issue on [GitHub](https://github.com/goobits/forms/issues) or check the [documentation](./docs/).
