import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		globals: true,
		environment: 'jsdom',
		pool: 'vmThreads',
		poolOptions: {
			vmThreads: {
				maxThreads: 2,
				minThreads: 1
			}
		},
		setupFiles: ['./tests/setup.ts'],
		include: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
		exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'demo/**/*', 'docs/**/*', 'examples/**/*'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'json-summary', 'text-summary'],
			reportsDirectory: './coverage',
			include: [
				// Only include files that have tests (focused security testing)
				'security/csrf.ts',
				'config/secureDeepMerge.ts',
				'utils/sanitizeInput.ts',
				'services/rateLimiterService.ts'
			],
			exclude: [
				'**/*.d.ts',
				'**/types.ts',
				'**/index.ts',
				'utils/logger.ts',
				'utils/debounce.ts',
				'utils/constants.ts',
				'utils/messages.ts',
				'config/defaults.ts',
				'config/defaultMessages.ts',
				'config/contactSchemas.ts'
			],
			// Per-file thresholds for security-critical code
			thresholds: {
				'security/csrf.ts': {
					lines: 95,
					functions: 85,
					branches: 95,
					statements: 95
				},
				'config/secureDeepMerge.ts': {
					lines: 100,
					functions: 100,
					branches: 100,
					statements: 100
				},
				'utils/sanitizeInput.ts': {
					lines: 85,
					functions: 100,
					branches: 85,
					statements: 85
				},
				'services/rateLimiterService.ts': {
					lines: 85,
					functions: 85,
					branches: 85,
					statements: 85
				}
			}
		}
	},
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib')
		}
	}
});
