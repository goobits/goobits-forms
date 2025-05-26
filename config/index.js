/**
 * Configuration management for @goobits/contactform
 */

import { z } from 'zod'
import { defaultConfig } from './defaults.js'
export { defaultMessages } from './defaultMessages.js'

// Configuration state
let currentConfig = null

// Deep merge utility
function deepMerge(target, source) {
	const output = { ...target }

	if (isObject(target) && isObject(source)) {
		Object.keys(source).forEach(key => {
			if (isObject(source[key])) {
				if (!(key in target)) {
					output[key] = source[key]
				} else {
					output[key] = deepMerge(target[key], source[key])
				}
			} else {
				output[key] = source[key]
			}
		})
	}

	return output
}

function isObject(item) {
	return item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Initialize the contact form configuration
 * @param {Object} userConfig - User configuration to merge with defaults
 * @returns {Object} The merged configuration
 */
export function initContactFormConfig(userConfig = {}) {
	currentConfig = deepMerge(defaultConfig, userConfig)

	// Build validation schemas based on configuration
	currentConfig.schemas = buildValidationSchemas(currentConfig)

	// Build field mappings
	currentConfig.categoryToFieldMap = buildCategoryFieldMap(currentConfig)

	return currentConfig
}

/**
 * Get the current configuration
 * @returns {Object} Current configuration
 */
export function getContactFormConfig() {
	if (!currentConfig) {
		console.warn('@goobits/contactform: Config not initialized, using defaults. Call initContactFormConfig() at app startup.')
		currentConfig = { ...defaultConfig }
		currentConfig.schemas = buildValidationSchemas(currentConfig)
		currentConfig.categoryToFieldMap = buildCategoryFieldMap(currentConfig)
	}
	return currentConfig
}

/**
 * Build validation schemas from configuration
 * @param {Object} config - Configuration object
 * @returns {Object} Validation schemas
 */
function buildValidationSchemas(config) {
	const { fieldConfigs, errorMessages, fileSettings } = config

	// Map field types to schema builders
	const schemaBuilders = {
		email: () => z.string().email(errorMessages.email),
		tel: () => z.string(),
		checkbox: (fieldName) => z.union([ z.literal('on'), z.literal(true) ])
			.refine(value => value === 'on' || value === true, {
				message: errorMessages[fieldName] || errorMessages.required(fieldName)
			}),
		select: () => z.string(),
		url: () => z.string().url('Please enter a valid URL'),
		textarea: () => z.string(),
		text: () => z.string(),
		date: () => z.string(),
		time: () => z.string()
	}

	// Build field schemas
	const schemas = Object.entries(fieldConfigs).reduce((acc, [ fieldName, fieldConfig ]) => {
		const type = fieldConfig.type || 'text'
		const builder = schemaBuilders[type] || schemaBuilders.text
		let schema = builder(fieldName)

		// Add validation rules
		if (fieldConfig.required && type !== 'checkbox') {
			schema = schema.min(1, errorMessages[fieldName] || errorMessages.required(fieldName))
		}

		if (fieldConfig.maxlength && [ 'email', 'tel', 'text', 'textarea', 'url' ].includes(type)) {
			schema = schema.max(fieldConfig.maxlength, `Maximum ${ fieldConfig.maxlength } characters`)
		}

		acc[fieldName] = schema
		return acc
	}, {})

	// Add file attachment schema
	schemas.attachments = z.array(z.object({
		file: z.instanceof(File)
			.refine(file => file.size <= fileSettings.maxFileSize, errorMessages.fileSize)
			.refine(file => fileSettings.acceptedImageTypes.includes(file.type), errorMessages.fileType),
		preview: z.string()
	})).max(3, errorMessages.maxFiles).optional()

	// Build category schemas
	const categorySchemas = Object.entries(config.categories).reduce((acc, [ categoryName, categoryConfig ]) => {
		const categoryFields = categoryConfig.fields.reduce((fields, fieldName) => {
			if (schemas[fieldName]) {
				fields[fieldName] = schemas[fieldName]
			}
			return fields
		}, { attachments: schemas.attachments })

		acc[categoryName] = z.object(categoryFields)
		return acc
	}, {})

	return {
		fields: schemas,
		categories: categorySchemas,
		complete: z.object(schemas)
	}
}

/**
 * Build category to field mapping
 * @param {Object} config - Configuration object
 * @returns {Object} Category to field mapping
 */
function buildCategoryFieldMap(config) {
	const categoryToFieldMap = {}

	for (const [ categoryName, categoryConfig ] of Object.entries(config.categories)) {
		// No need to add 'attachments' explicitly as it's now included in the fields array
		// for the forms that need it
		categoryToFieldMap[categoryName] = [ ...categoryConfig.fields ]
	}

	return categoryToFieldMap
}