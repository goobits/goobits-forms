/**
 * Documentation Link Validator
 *
 * Validates markdown links and file references in documentation.
 * Run with: node tests/docs-validator.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_ROOT = path.join(__dirname, '..');
const errors = [];
const warnings = [];

console.log('📝 Validating documentation links...\n');

// Helper to check if file exists
function fileExists(filePath) {
	return fs.existsSync(path.join(PACKAGE_ROOT, filePath));
}

// Helper to extract markdown links
function extractMarkdownLinks(content) {
	const links = [];

	// Match [text](link) and [text](link "title")
	const linkRegex = /\[([^\]]+)\]\(([^)"]+)(?:\s+"[^"]*")?\)/g;
	let match;

	while ((match = linkRegex.exec(content)) !== null) {
		links.push({
			text: match[1],
			url: match[2],
			raw: match[0]
		});
	}

	return links;
}

// Helper to validate internal file link
function validateInternalLink(linkUrl, sourceFile) {
	// Remove anchor
	const [filePath] = linkUrl.split('#');

	if (!filePath) {
		// Just an anchor (#section)
		return { valid: true };
	}

	// Resolve relative to source file
	const sourceDir = path.dirname(sourceFile);
	const resolvedPath = path.join(sourceDir, filePath);

	// Normalize path (remove ./ and ../)
	const normalizedPath = path.normalize(resolvedPath);

	if (fileExists(normalizedPath)) {
		return { valid: true, resolvedPath: normalizedPath };
	}

	return { valid: false, resolvedPath: normalizedPath };
}

// Get all markdown files
function getMarkdownFiles(dir = '') {
	const files = [];
	const fullDir = path.join(PACKAGE_ROOT, dir);

	if (!fs.existsSync(fullDir)) {
		return files;
	}

	const entries = fs.readdirSync(fullDir, { withFileTypes: true });

	for (const entry of entries) {
		const relativePath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			// Skip node_modules, .git, etc.
			if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
				files.push(...getMarkdownFiles(relativePath));
			}
		} else if (entry.name.endsWith('.md')) {
			files.push(relativePath);
		}
	}

	return files;
}

// Validate all markdown files
const markdownFiles = getMarkdownFiles();
console.log(`Found ${markdownFiles.length} markdown files\n`);

let totalLinks = 0;
let validLinks = 0;
let externalLinks = 0;

markdownFiles.forEach(file => {
	console.log(`📄 ${file}`);

	const content = fs.readFileSync(path.join(PACKAGE_ROOT, file), 'utf8');
	const links = extractMarkdownLinks(content);

	if (links.length === 0) {
		console.log('  ℹ️  No links found\n');
		return;
	}

	links.forEach(link => {
		totalLinks++;

		// Skip external URLs
		if (link.url.startsWith('http://') || link.url.startsWith('https://')) {
			externalLinks++;
			// Don't validate external links (would require network requests)
			return;
		}

		// Skip mailto links
		if (link.url.startsWith('mailto:')) {
			return;
		}

		// Validate internal link
		const result = validateInternalLink(link.url, file);

		if (result.valid) {
			validLinks++;
			console.log(`  ✅ ${link.url}`);
		} else {
			errors.push(`  ❌ Broken link in ${file}: ${link.url} → ${result.resolvedPath}`);
			console.log(`  ❌ ${link.url} → file not found`);
		}
	});

	console.log();
});

// Check for common documentation issues
console.log('🔍 Checking for common issues...\n');

// Check CHANGELOG version links
if (fileExists('CHANGELOG.md')) {
	const changelog = fs.readFileSync(path.join(PACKAGE_ROOT, 'CHANGELOG.md'), 'utf8');

	// Check for version headers
	const versionRegex = /## \[(\d+\.\d+\.\d+)\]/g;
	const versions = [];
	let match;

	while ((match = versionRegex.exec(changelog)) !== null) {
		versions.push(match[1]);
	}

	// Check for version link definitions at bottom
	versions.forEach(version => {
		const linkDef = `[${version}]: https://github.com/goobits/forms/compare/`;
		if (!changelog.includes(linkDef)) {
			warnings.push(`⚠️  CHANGELOG.md: Missing version link definition for ${version}`);
		}
	});

	console.log(`  ✅ Found ${versions.length} version entries in CHANGELOG`);
}

// Check package.json version matches latest CHANGELOG
try {
	const packageJson = JSON.parse(
		fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8')
	);
	const currentVersion = packageJson.version;

	if (fileExists('CHANGELOG.md')) {
		const changelog = fs.readFileSync(path.join(PACKAGE_ROOT, 'CHANGELOG.md'), 'utf8');
		const firstVersion = changelog.match(/## \[(\d+\.\d+\.\d+)\]/);

		if (firstVersion && firstVersion[1] !== currentVersion) {
			warnings.push(
				`⚠️  Version mismatch: package.json (${currentVersion}) vs CHANGELOG (${firstVersion[1]})`
			);
		} else {
			console.log(`  ✅ package.json version (${currentVersion}) matches CHANGELOG`);
		}
	}
} catch (e) {
	errors.push(`❌ Failed to read package.json: ${e.message}`);
}

// Check README links to docs
if (fileExists('README.md')) {
	const readme = fs.readFileSync(path.join(PACKAGE_ROOT, 'README.md'), 'utf8');
	const docsFiles = [
		'getting-started',
		'configuration',
		'typescript',
		'api-reference',
		'testing',
		'migration',
		'troubleshooting'
	];

	docsFiles.forEach(doc => {
		const linkPattern = new RegExp(`./docs/${doc}\\.md`, 'i');
		if (!linkPattern.test(readme)) {
			warnings.push(`⚠️  README.md: No link to docs/${doc}.md found`);
		}
	});

	console.log('  ✅ README.md links to core documentation');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Summary\n');

console.log(`Total links found: ${totalLinks}`);
console.log(`Internal links validated: ${validLinks}`);
console.log(`External links (not validated): ${externalLinks}`);
console.log();

if (errors.length === 0 && warnings.length === 0) {
	console.log('✅ All documentation validation checks passed!');
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
		console.log('❌ Documentation validation failed');
		process.exit(1);
	} else {
		console.log('✅ Documentation validation passed with warnings');
		process.exit(0);
	}
}
