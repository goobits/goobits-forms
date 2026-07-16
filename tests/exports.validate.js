/**
 * Export Validation Tests
 *
 * Validates that all documented import paths work correctly.
 * Run with: node tests/exports.test.js
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_ROOT = path.join(__dirname, '..');
const errors = [];
const warnings = [];

console.log('🧪 Validating @goobits/ui exports...\n');

// Helper to check if file exists
function fileExists(filePath) {
	return fs.existsSync(path.join(PACKAGE_ROOT, filePath));
}

// Helper to check if directory exists
function dirExists(dirPath) {
	return fs.existsSync(path.join(PACKAGE_ROOT, dirPath)) &&
		fs.statSync(path.join(PACKAGE_ROOT, dirPath)).isDirectory();
}

// Test 1: Check main entry points exist
console.log('1️⃣  Checking main entry points...');

const mainEntries = [
	{ path: 'index.ts', description: 'Main entry point' },
	{ path: 'ui/index.ts', description: 'UI components entry' },
	{ path: 'config/index.ts', description: 'Configuration entry' },
	{ path: 'handlers/index.ts', description: 'Handlers entry' },
	{ path: 'validation/index.ts', description: 'Validation entry' },
	{ path: 'i18n/index.ts', description: 'i18n entry' },
	{ path: 'services/index.ts', description: 'Services entry' },
	{ path: 'utils/index.ts', description: 'Utils entry' }
];

mainEntries.forEach(entry => {
	if (fileExists(entry.path)) {
		console.log(`  ✅ ${entry.description}: ${entry.path}`);
	} else {
		errors.push(`❌ Missing ${entry.description}: ${entry.path}`);
	}
});

// Test 2: Check UI components exist
console.log('\n2️⃣  Checking UI components...');

const uiComponents = [
	'ContactForm.svelte',
	'CategoryContactForm.svelte',
	'ContactFormPage.svelte',
	'FeedbackForm.svelte',
	'FormField.svelte',
	'FormErrors.svelte',
	'ThankYou.svelte',
	'UploadImage.svelte',
	'DemoPlayground.svelte',
	'Input.svelte',
	'Textarea.svelte',
	'SelectMenu.svelte',
	'ToggleSwitch.svelte',
	'Portal.svelte'
];

uiComponents.forEach(component => {
	const componentPath = `ui/${component}`;
	if (fileExists(componentPath)) {
		console.log(`  ✅ ${component}`);
	} else {
		errors.push(`❌ Missing UI component: ${componentPath}`);
	}
});

// Test 3: Check menu system
console.log('\n3️⃣  Checking menu system...');

const menuFiles = [
	'ui/menu/index.ts',
	'ui/menu/Menu.svelte',
	'ui/menu/ContextMenu.svelte',
	'ui/menu/MenuItem.svelte',
	'ui/menu/MenuSeparator.svelte'
];

menuFiles.forEach(file => {
	if (fileExists(file)) {
		console.log(`  ✅ ${path.basename(file)}`);
	} else {
		errors.push(`❌ Missing menu file: ${file}`);
	}
});

// Test 4: Check modals system
console.log('\n4️⃣  Checking modals system...');

if (dirExists('ui/modals')) {
	console.log('  ✅ ui/modals/ directory exists');

	const modalsIndex = 'ui/modals/index.ts';
	if (fileExists(modalsIndex)) {
		console.log('  ✅ ui/modals/index.ts exists');
	} else {
		warnings.push(`⚠️  Missing modals index: ${modalsIndex}`);
	}
} else {
	errors.push('❌ Missing ui/modals/ directory');
}

// Test 5: Check tooltip system
console.log('\n5️⃣  Checking tooltip system...');

const tooltipFiles = [
	'ui/tooltip/index.ts',
	'ui/tooltip/tooltip-actions.ts',
	'ui/tooltip/tooltip-manager.ts'
];

tooltipFiles.forEach(file => {
	if (fileExists(file)) {
		console.log(`  ✅ ${path.basename(file)}`);
	} else {
		errors.push(`❌ Missing tooltip file: ${file}`);
	}
});

// Test 6: Check handlers
console.log('\n6️⃣  Checking handlers...');

const handlerFiles = [
	'handlers/contactFormHandler.ts',
	'handlers/categoryRouter.ts'
];

handlerFiles.forEach(file => {
	if (fileExists(file)) {
		console.log(`  ✅ ${path.basename(file)}`);
	} else {
		errors.push(`❌ Missing handler: ${file}`);
	}
});

// Test 7: Check documentation
console.log('\n7️⃣  Checking documentation...');

const docFiles = [
	'README.md',
	'CHANGELOG.md',
	'STYLE_GUIDE.md',
	'docs/api-reference.md',
	'docs/troubleshooting.md',
	'docs/getting-started.md',
	'docs/configuration.md',
	'docs/typescript.md',
	'docs/migration.md',
	'docs/testing.md'
];

docFiles.forEach(file => {
	if (fileExists(file)) {
		console.log(`  ✅ ${file}`);
	} else {
		errors.push(`❌ Missing documentation: ${file}`);
	}
});

// Test 8: Check examples
console.log('\n8️⃣  Checking examples...');

const exampleDirs = [
	'examples/contact-api'
];

exampleDirs.forEach(dir => {
	if (dirExists(dir)) {
		console.log(`  ✅ ${dir}/`);

		const readmePath = `${dir}/README.md`;
		if (fileExists(readmePath)) {
			console.log(`    ✅ ${readmePath}`);
		} else {
			warnings.push(`⚠️  Missing example README: ${readmePath}`);
		}
	} else {
		warnings.push(`⚠️  Missing example directory: ${dir}/`);
	}
});

// Test 9: Verify package.json exports match files
console.log('\n9️⃣  Verifying package.json exports...');

try {
	const packageJson = JSON.parse(
		fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8')
	);

	const exports = packageJson.exports || {};
	let exportsChecked = 0;

	for (const [exportPath, filePath] of Object.entries(exports)) {
		if (typeof filePath === 'string' && filePath.endsWith('.ts')) {
			const exists = fileExists(filePath);
			if (exists) {
				console.log(`  ✅ "${exportPath}" → ${filePath}`);
				exportsChecked++;
			} else {
				errors.push(`❌ Export "${exportPath}" points to missing file: ${filePath}`);
			}
		}
	}

	console.log(`  ℹ️  Checked ${exportsChecked} TypeScript exports`);
} catch (e) {
	errors.push(`❌ Failed to read package.json: ${e.message}`);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Summary\n');

if (errors.length === 0 && warnings.length === 0) {
	console.log('✅ All validation checks passed!');
	process.exit(0);
} else {
	if (errors.length > 0) {
		console.log(`❌ ${errors.length} error(s):\n`);
		errors.forEach(error => console.log(error));
		console.log();
	}

	if (warnings.length > 0) {
		console.log(`⚠️  ${warnings.length} warning(s):\n`);
		warnings.forEach(warning => console.log(warning));
		console.log();
	}

	if (errors.length > 0) {
		console.log('❌ Validation failed');
		process.exit(1);
	} else {
		console.log('✅ Validation passed with warnings');
		process.exit(0);
	}
}
