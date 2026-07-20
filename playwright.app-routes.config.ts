import { defineConfig, devices } from '@playwright/test'

delete process.env.NO_COLOR
delete process.env.FORCE_COLOR

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
	],
	webServer: {
		command: 'pnpm --dir ../.. run dev:svelte',
		env: { ...process.env, NODE_ENV: 'development' },
		reuseExistingServer: !process.env.CI,
		stderr: 'pipe',
		stdout: 'ignore',
		timeout: 120_000,
		url: 'http://127.0.0.1:3630/classroom'
	}
})
