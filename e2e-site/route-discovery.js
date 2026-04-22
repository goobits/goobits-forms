import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { generateSlugFromPath } from '../../../src/lib/utils/slugs.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '../../..')
const contentRoot = path.join(workspaceRoot, 'src/content')

function scanMarkdownRoutes(directory, baseRoute) {
	if (!fs.existsSync(directory)) {
		return []
	}

	const routes = []
	const stack = [ '' ]

	while (stack.length > 0) {
		const relativeDir = stack.pop()
		const fullDir = path.join(directory, relativeDir)

		for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
			if (entry.isDirectory()) {
				stack.push(path.join(relativeDir, entry.name))
				continue
			}

			if (!entry.name.endsWith('.md')) {
				continue
			}

			const relativePath = path.join(relativeDir, entry.name).replace(/\\/g, '/')
			const slug = generateSlugFromPath(relativePath.replace(/\.md$/, ''))
			routes.push(`${baseRoute}/${slug}`.replace(/\/+/g, '/'))
		}
	}

	return routes
}

function readFrontmatterValue(filePath, fieldName) {
	const source = fs.readFileSync(filePath, 'utf8')
	const match = source.match(new RegExp(`^${fieldName}:\\s*"?(.*?)"?\\s*$`, 'm'))
	return match ? match[1].trim() : null
}

function getBlogRoutes() {
	const blogDir = path.join(contentRoot, 'Blog')
	if (!fs.existsSync(blogDir)) {
		return []
	}

	const routes = []
	const stack = [ '' ]

	while (stack.length > 0) {
		const relativeDir = stack.pop()
		const fullDir = path.join(blogDir, relativeDir)

		for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
			if (entry.isDirectory()) {
				stack.push(path.join(relativeDir, entry.name))
				continue
			}

			if (!entry.name.endsWith('.md')) {
				continue
			}

			const filePath = path.join(fullDir, entry.name)
			const slug = readFrontmatterValue(filePath, 'slug')
			const date = readFrontmatterValue(filePath, 'date')

			if (!slug || !date) {
				continue
			}

			const [ year, month ] = date.split('-')
			if (!year || !month) {
				continue
			}

			routes.push(`/blog/${year}/${month}/${slug}`)
		}
	}

	return routes
}

export function getPublicRoutes() {
	const routes = new Set([
		'/',
		'/about',
		'/blog',
		'/challenges',
		'/changelog',
		'/classroom',
		'/community',
		'/contact',
		'/contact/bug-report',
		'/contact/business-inquiry',
		'/contact/education-support',
		'/contact/product-feedback',
		'/contact/technical-support',
		'/domain-validation',
		'/gallery',
		'/help',
		'/help/faq',
		'/legal',
		'/login',
		'/store'
	])

	for (const route of getBlogRoutes()) {
		routes.add(route)
	}

	for (const route of scanMarkdownRoutes(path.join(contentRoot, 'classroom'), '/classroom')) {
		routes.add(route)
	}

	for (const route of scanMarkdownRoutes(path.join(contentRoot, 'legal'), '/legal')) {
		routes.add(route)
	}

	return Array.from(routes).sort()
}

export function getProtectedRoutes() {
	return [ '/account', '/admin' ]
}
