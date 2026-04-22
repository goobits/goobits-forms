import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './e2e-site',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: 0,
	timeout: 120_000,
	workers: 1,
	reporter: 'line',
	use: {
		baseURL: process.env.ROOT_APP_BASE_URL || 'http://localhost:3630',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
})
