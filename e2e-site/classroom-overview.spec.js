import { expect, test } from '@playwright/test'

import { attachIssueCollectors } from './site-health.js'

const resourceTypes = [ 'document', 'script', 'stylesheet', 'fetch', 'xhr', 'image' ]
const viewports = [
	{ height: 900, name: 'desktop', width: 1440 },
	{ height: 812, name: 'mobile', width: 375 }
]

for (const viewport of viewports) {
	test(`Classroom overview loads its images and fits the ${ viewport.name } viewport`, async({ page }) => {
		await page.setViewportSize({ height: viewport.height, width: viewport.width })
		const issues = attachIssueCollectors(page, { resourceTypes })
		const response = await page.goto('/classroom', { waitUntil: 'domcontentloaded' })

		expect(response?.ok(), `Classroom document status: ${ response?.status() }`).toBe(true)
		await page.waitForLoadState('load')
		await expect(page.getByRole('heading', { name: /Create Together in the Classroom/ })).toBeVisible()

		const images = page.locator('img:visible')
		const imageCount = await images.count()
		expect(imageCount).toBeGreaterThan(0)
		for (let index = 0; index < imageCount; index++) {
			const image = images.nth(index)
			await image.scrollIntoViewIfNeeded()
			await expect.poll(async() => image.evaluate(node => Number(node.complete && node.naturalWidth > 0)), {
				message: `Image failed to load: ${ await image.getAttribute('src') }`
			}).toBe(1)
		}

		await page.evaluate(() => scrollTo(0, 0))
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
		expect(overflow).toBeLessThanOrEqual(1)

		const headerBox = await page.locator('.header__container').boundingBox()
		expect(headerBox).not.toBeNull()
		expect(headerBox?.x).toBeGreaterThanOrEqual(0)
		expect((headerBox?.x ?? 0) + (headerBox?.width ?? 0)).toBeLessThanOrEqual(viewport.width)

		if (viewport.name === 'mobile') {
			const menuButton = page.getByRole('button', { name: 'Toggle menu', exact: true })
			await expect(menuButton).toBeVisible()
			const buttonBox = await menuButton.boundingBox()
			expect(buttonBox).not.toBeNull()
			expect((buttonBox?.x ?? 0) + (buttonBox?.width ?? 0)).toBeLessThanOrEqual(viewport.width)
			// The universal layout lazily loads its route configs before hydration.
			// Retry the real click until the handler is attached instead of sleeping.
			await expect(async() => {
				if (await menuButton.getAttribute('aria-expanded') !== 'true') {
					await menuButton.click()
				}
				await expect(menuButton).toHaveAttribute('aria-expanded', 'true', { timeout: 1_000 })
			}).toPass({ timeout: 30_000 })
			await expect(page.locator('.mobile-menu')).toBeVisible()
		}

		expect(issues.consoleErrors).toEqual([])
		expect(issues.pageErrors).toEqual([])
		expect(issues.failedRequests).toEqual([])
		expect(issues.badResponses).toEqual([])
	})
}
