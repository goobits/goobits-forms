/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		package: {
			// Emit TypeScript type declarations
			emitTypes: true,
			// Export all files except tests
			exports: (filepath) => {
				// Exclude test files (.test.ts, .test.js, .spec.ts, .spec.js)
				if (/\.(test|spec)\.(ts|js|tsx|jsx)$/.test(filepath)) return false;
				// Include everything else
				return true;
			},
			// Include all files (CSS, .svelte, etc.) except tests
			files: (filepath) => {
				// Exclude test files (.test.ts, .test.js, .spec.ts, .spec.js)
				if (/\.(test|spec)\.(ts|js|tsx|jsx)$/.test(filepath)) return false;
				// Include everything else
				return true;
			}
		}
	}
};

export default config;
