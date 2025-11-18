import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST, compilerOptions: { dev: true } })],
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
				// Security-critical code (high priority for testing)
				'src/lib/security/csrf.ts',
				'src/lib/config/secureDeepMerge.ts',
				'src/lib/utils/sanitizeInput.ts',
				'src/lib/services/rateLimiterService.ts',
				// UI components and utilities
				'src/lib/ui/**/*.{ts,svelte}',
				'src/lib/validation/**/*.ts',
				'src/lib/handlers/**/*.ts'
			],
			exclude: [
				'**/*.d.ts',
				'**/*.test.{ts,js}',
				'**/*.spec.{ts,js}',
				'**/types.ts',
				'**/index.ts',
				'**/test-utils.ts',
				'**/test-setup.ts',
				'src/lib/utils/logger.ts',
				'src/lib/utils/debounce.ts',
				'src/lib/utils/constants.ts',
				'src/lib/utils/messages.ts',
				'src/lib/config/defaults.ts',
				'src/lib/config/defaultMessages.ts',
				'src/lib/config/contactSchemas.ts',
				// Demo and documentation files
				'src/lib/ui/DemoPlayground.svelte',
				'**/demo/**',
				'**/docs/**',
				'**/examples/**'
			],
			// Per-file thresholds for security-critical code
			thresholds: {
				// Security-critical files (high thresholds)
				'src/lib/security/csrf.ts': {
					lines: 95,
					functions: 85,
					branches: 95,
					statements: 95
				},
				'src/lib/config/secureDeepMerge.ts': {
					lines: 100,
					functions: 100,
					branches: 100,
					statements: 100
				},
				'src/lib/utils/sanitizeInput.ts': {
					lines: 85,
					functions: 100,
					branches: 85,
					statements: 85
				},
				'src/lib/services/rateLimiterService.ts': {
					lines: 85,
					functions: 85,
					branches: 85,
					statements: 85
				},
				// Global thresholds for UI components (moderate)
				lines: 80,
				functions: 80,
				branches: 75,
				statements: 80
			}
		}
	},
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib'),
			'$app/environment': path.resolve(__dirname, './tests/mocks/app-environment.ts')
		},
		conditions: ['browser']
	}
});
