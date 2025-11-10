# Publishing Guide for @goobits/forms

## Overview

This package ships TypeScript source files directly (modern approach). Users' bundlers handle the compilation.

## Requirements

- Node.js >= 18.0.0
- npm with access to publish to @goobits scope
- Clean working directory (committed changes)

## Pre-Publish Checklist

1. **Update Version**
   ```bash
   npm version patch|minor|major
   ```

2. **Update CHANGELOG.md**
   - Document all changes since last release
   - Follow existing format

3. **Run Lint**
   ```bash
   npm run lint
   ```
   This runs automatically via `prepublishOnly` hook

4. **Test Package Contents**
   ```bash
   npm pack --dry-run
   ```
   Verify all necessary files are included (89 files, ~132 kB)

5. **Review package.json**
   - Ensure version is correct
   - Check dependencies are up to date
   - Verify exports paths

## Publishing

### To npm Registry

```bash
# Login if needed
npm login

# Publish (public scoped package)
npm publish

# Or for specific tag
npm publish --tag beta
```

### Verification

After publishing:

```bash
# View published package
npm view @goobits/forms

# Test installation
npm install @goobits/forms
```

## Important Notes

- **TypeScript Source**: This package ships `.ts` files directly
- **User Requirements**: Users need TypeScript and a bundler (Vite, SvelteKit, etc.) that can process TypeScript
- **No Build Step**: The package doesn't compile to JavaScript during publishing
- **Svelte Components**: `.svelte` files are included for direct use
- **CSS Files**: Stylesheets are in `ui/index.css` and component-specific CSS

## Package Structure

```
@goobits/forms@1.2.0
├── index.ts (main entry)
├── ui/ (Svelte components & CSS)
├── config/ (configuration utilities)
├── validation/ (validation logic)
├── i18n/ (internationalization)
├── services/ (email, rate limiting, etc.)
├── security/ (CSRF protection)
├── handlers/ (form handlers)
├── utils/ (utility functions)
└── examples/ (usage examples)
```

## Rollback

If issues are found after publishing:

```bash
# Deprecate a version
npm deprecate @goobits/forms@1.2.0 "Issue description"

# Or unpublish (within 72 hours)
npm unpublish @goobits/forms@1.2.0
```

## Support

- Issues: https://github.com/goobits/forms/issues
- Docs: README.md
