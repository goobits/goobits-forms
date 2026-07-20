const DEFAULT_RESOURCE_TYPES = [ 'document', 'script', 'stylesheet', 'fetch', 'xhr' ]

/**
 * Collect browser/runtime failures for a page without changing navigation.
 * Call before `page.goto`, then assert the returned arrays after the page is
 * settled. Image-heavy route checks can opt images into the same collector.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ resourceTypes?: string[] }} [options]
 */
export function attachIssueCollectors(page, { resourceTypes = DEFAULT_RESOURCE_TYPES } = {}) {
	/** @type {string[]} */
	const consoleErrors = []
	/** @type {string[]} */
	const pageErrors = []
	/** @type {string[]} */
	const failedRequests = []
	/** @type {string[]} */
	const badResponses = []

	page.on('console', (message) => {
		if (message.type() === 'error') {
			consoleErrors.push(message.text())
		}
	})

	page.on('pageerror', (error) => {
		pageErrors.push(error.message)
	})

	page.on('requestfailed', (request) => {
		const type = request.resourceType()
		if (resourceTypes.includes(type)) {
			failedRequests.push(`${ type } ${ request.method() } ${ request.url() } :: ${ request.failure()?.errorText || 'request failed' }`)
		}
	})

	page.on('response', (response) => {
		const request = response.request()
		const type = request.resourceType()
		if (resourceTypes.includes(type) && response.status() >= 400) {
			badResponses.push(`${ type } ${ response.status() } ${ request.method() } ${ request.url() }`)
		}
	})

	return { consoleErrors, pageErrors, failedRequests, badResponses }
}
