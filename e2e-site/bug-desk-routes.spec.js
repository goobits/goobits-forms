import { test, expect } from '@playwright/test'

const BUG_ROUTES = [
	'/playground/bugs',
	'/playground/bugs/inbox',
	'/playground/bugs/ticket/sketch-4821',
	'/playground/bugs/ticket/sketch-4818',
	'/playground/bugs/ticket/sketch-4809',
	'/playground/bugs/ticket/sketch-4797',
	'/playground/bugs/report'
]

const BUG_FILTERED_ROUTES = [
	'/playground/bugs/inbox?filter=All',
	'/playground/bugs/inbox?filter=Mine',
	'/playground/bugs/inbox?filter=Waiting',
	'/playground/bugs/inbox?filter=Snoozed',
	'/playground/bugs/inbox?filter=Closed',
	'/playground/bugs/inbox?q=canvas'
]

function attachIssueCollectors(page) {
	const consoleErrors = []
	const pageErrors = []
	const failedRequests = []
	const badResponses = []

	page.on('console', (message) => {
		if (message.type() === 'error') {consoleErrors.push(message.text())}
	})

	page.on('pageerror', (error) => {
		pageErrors.push(error.message)
	})

	page.on('requestfailed', (request) => {
		const type = request.resourceType()
		if ([ 'document', 'script', 'stylesheet', 'fetch', 'xhr' ].includes(type)) {
			failedRequests.push(`${ type } ${ request.method() } ${ request.url() } :: ${ request.failure()?.errorText || 'request failed' }`)
		}
	})

	page.on('response', (response) => {
		const request = response.request()
		const type = request.resourceType()
		if ([ 'document', 'script', 'stylesheet', 'fetch', 'xhr' ].includes(type) && response.status() >= 500) {
			badResponses.push(`${ type } ${ response.status() } ${ request.method() } ${ response.url() }`)
		}
	})

	return { consoleErrors, pageErrors, failedRequests, badResponses }
}

test.describe('Bug Desk routes never 500', () => {
	for (const route of BUG_ROUTES) {
		test(`GET ${ route }`, async ({ page }) => {
			const issues = attachIssueCollectors(page)
			const response = await page.goto(route, { waitUntil: 'domcontentloaded' })

			expect(response, `No response for ${ route }`).not.toBeNull()
			expect(response.status(), `Status for ${ route }`).toBeLessThan(500)
			expect(response.status(), `Status for ${ route }`).toBeGreaterThanOrEqual(200)

			await page.waitForLoadState('load')
			await page.waitForLoadState('networkidle', { timeout: 2_000 }).catch(() => {})

			expect(issues.badResponses, `5xx network requests on ${ route }`).toEqual([])
			expect(issues.pageErrors, `Uncaught errors on ${ route }`).toEqual([])
		})
	}

	for (const route of BUG_FILTERED_ROUTES) {
		test(`GET ${ route }`, async ({ page }) => {
			const issues = attachIssueCollectors(page)
			const response = await page.goto(route, { waitUntil: 'domcontentloaded' })

			expect(response.status(), `Status for ${ route }`).toBeLessThan(500)
			expect(issues.badResponses, `5xx network requests on ${ route }`).toEqual([])
			expect(issues.pageErrors, `Uncaught errors on ${ route }`).toEqual([])
		})
	}

	test('Unknown ticket ID returns 404, not 500', async ({ page }) => {
		const route = '/playground/bugs/ticket/sketch-99999'
		const issues = attachIssueCollectors(page)
		const response = await page.goto(route, { waitUntil: 'domcontentloaded' })

		expect(response, 'No response').not.toBeNull()
		expect(response.status(), `Status for ${ route }`).toBe(404)
		expect(issues.badResponses, '5xx requests on unknown ticket').toEqual([])
	})

	test('Report submit does not 500', async ({ page }) => {
		const issues = attachIssueCollectors(page)
		await page.goto('/playground/bugs/report', { waitUntil: 'domcontentloaded' })
		await page.fill('textarea#report-what', 'Playwright smoke test — please ignore.')
		await page.fill('input[type=email]', 'playwright@test.example')
		await page.click('button.report__send')
		await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})

		expect(issues.badResponses, 'No 5xx during report submit').toEqual([])
		expect(issues.pageErrors, 'No uncaught errors').toEqual([])
	})

	test('⌘K command palette opens without errors', async ({ page }) => {
		const issues = attachIssueCollectors(page)
		await page.goto('/playground/bugs', { waitUntil: 'load' })
		await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
		const trigger = page.locator('button.bug-desk__cmd')
		await expect(trigger).toBeVisible()
		await trigger.click()
		await expect(page.locator('[role="dialog"][aria-label="Command palette"]')).toBeVisible({ timeout: 5_000 })
		await page.keyboard.press('Escape')

		expect(issues.pageErrors, 'No errors opening palette').toEqual([])
	})
})
