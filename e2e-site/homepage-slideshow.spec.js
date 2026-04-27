import { test, expect } from '@playwright/test'

test('homepage slideshow prioritizes and loads the first slide image', async ({ page }) => {
	await page.goto('/', { waitUntil: 'domcontentloaded' })

	const slideshow = page.locator('#slideshow')
	await expect(slideshow).toBeVisible()

	const slideImages = slideshow.locator('img')
	await expect(slideImages).toHaveCount(1)

	const firstImage = slideImages.first()
	await expect(firstImage).toHaveAttribute('loading', 'eager')
	await expect(firstImage).toHaveAttribute('fetchpriority', 'high')

	await expect.poll(async () =>
		firstImage.evaluate((img) => Number(img.complete && img.naturalWidth > 0))
	).toBe(1)
})
