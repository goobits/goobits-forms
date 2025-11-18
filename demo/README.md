# @goobits/ui Demo

This demo application showcases `@goobits/ui` with `@goobits/docs-engine` integration.

## Features

- **Live Form Demo**: Working contact form with mock email provider
- **Enhanced Documentation**: Markdown docs with syntax highlighting, callouts, diagrams, and more
- **Interactive Examples**: See the forms in action

## Running the Demo

From the root of the repository:

```bash
# Run the demo app
pnpm demo

# Build the demo
pnpm demo:build

# Preview production build
pnpm demo:preview
```

Or from this directory:

```bash
pnpm dev
pnpm build
pnpm preview
```

## What's Included

### Form Features
- Contact form with validation
- Mock email provider (logs to console)
- Rate limiting
- CSRF protection ready
- Responsive design

### Docs Engine Features
- **Syntax Highlighting**: Code blocks with Shiki (Dracula theme)
- **Callouts**: Note, warning, and tip boxes
- **Code Tabs**: Multiple language examples in tabs
- **File Trees**: Interactive file structure displays
- **Mermaid Diagrams**: Sequence diagrams, flowcharts, etc.
- **Math Rendering**: LaTeX equations with KaTeX
- **Table of Contents**: Auto-generated from headings

## Project Structure

```
demo/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte      # Layout with docs-engine hydrators
│   │   ├── +page.svelte         # Homepage with form demo
│   │   ├── docs/
│   │   │   └── +page.md         # Markdown docs demo
│   │   └── api/
│   │       └── contact/
│   │           └── +server.ts   # Form API handler
│   ├── hooks.server.ts          # Form configuration
│   └── app.html                 # HTML template
├── svelte.config.js             # MDsveX + docs-engine plugins
├── vite.config.ts
└── package.json
```

## Configuration

The demo is configured to use:
- **@goobits/ui**: Form components and handlers
- **@goobits/docs-engine**: Documentation rendering with plugins
- **MDsveX**: Markdown in Svelte
- **Svelte 5**: Latest Svelte version

## Development

The demo links to the local `@goobits/ui` package using `file:..` in package.json. Changes to the main package are automatically reflected in the demo.

## Links

- [Forms Documentation](../docs/)
- [Cookbook](../docs/cookbook.md)
- [API Reference](../docs/api-reference.md)
