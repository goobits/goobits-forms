/**
 * Configuration management for @goobits/contactform
 */

import { z } from 'zod'
import { defaultConfig } from './defaults.js'
import { createLogger } from '../utils/logger.js'
export { defaultMessages } from './defaultMessages.js'

const logger = createLogger('Config')

// Configuration state
let currentConfig = null

/**
 * Deep merge utility to combine configuration objects
 * @param {Object} target - The target object to merge into
 * @param {Object} source - The source object to merge from
 * @returns {Object} A new object with properties from both target and source
 */
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

/**
 * Check if a value is a plain object (not an array or null)
 * @param {*} item - The value to check
 * @returns {boolean} True if the value is a plain object
 */
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

	/**
	 * Parse and validate form data for a specific category
	 * @param {FormData} formData - The form data to parse
	 * @param {string} category - The form category to validate against
	 * @returns {Promise<Object>} Object containing validated data and any errors
	 */
	currentConfig.formDataParser = async (formData, category) => {
		try {
			// Use the appropriate schema for the given category
			const schema = currentConfig.schemas.categories[category] || currentConfig.schemas.categories.general
			
			// Convert FormData to a plain object
			const formDataObj = {}
			for (const [key, value] of formData.entries()) {
				// Skip the CSRF token and other special fields
				if (key === 'csrf') continue
				
				formDataObj[key] = value
			}
			
			// Parse file attachments if present
			if (formData.getAll('attachments[]')?.length) {
				// Store the file objects but don't create URL objects on the server
				// The client-side will handle preview generation
				formDataObj.attachments = formData.getAll('attachments[]').map(file => ({
					file,
					name: file.name,
					type: file.type,
					size: file.size
				}))
			}
			
			// Validate the data against the schema
			const result = schema.safeParse(formDataObj)
			
			if (result.success) {
				return { data: result.data, errors: {} }
			} else {
				// Format zod errors into a more usable structure
				const errors = {}
				for (const issue of result.error.issues) {
					const path = issue.path.join('.')
					errors[path] = issue.message
				}
				return { data: formDataObj, errors }
			}
		} catch (error) {
			logger.error('Form data parsing error:', error)
			return { data: {}, errors: { _form: 'An error occurred while processing the form data.' } }
		}
	}

	/**
	 * Create a handler for form submissions with appropriate processing
	 * @param {Object} options - Handler options
	 * @param {Object} options.locals - SvelteKit locals object with services
	 * @returns {Promise<Function>} A submission handler function
	 */
	currentConfig.createSubmissionHandler = async ({ locals }) => {
		// Default email subject and recipient based on config
		const defaultRecipient = currentConfig.defaultRecipient || 'contact@example.com'
		const defaultSubject = currentConfig.defaultSubject || 'New Contact Form Submission'
		
		/**
		 * Submission handler function
		 * @param {Object} data - The validated form data
		 * @param {string} category - The form category
		 * @returns {Promise<Object>} Result of the submission
		 */
		return async (data, category) => {
			try {
				// Get category specific configuration
				const categoryConfig = currentConfig.categories[category] || {}
				
				// Determine email recipient and subject based on category
				const recipient = categoryConfig.recipient || defaultRecipient
				const subject = categoryConfig.subject || `${defaultSubject}: ${categoryConfig.label || category}`
				
				// Process the submission - this is a simple implementation
				// In a real implementation, you would send an email or store in database
				logger.info('Form submission handler', { category, recipient, subject })
				
				// Use email service if available in locals
				if (locals && locals.emailService) {
					await locals.emailService.sendEmail({
						to: recipient,
						subject,
						data: {
							formData: data,
							category,
							timestamp: new Date().toISOString()
						},
						template: 'contact-form'
					})
				} else {
					// Log submission if no email service is available
					logger.info('Form submission data (no email service available)', { 
						data, 
						category,
						recipient,
						subject
					})
				}
				
				return {
					success: true,
					message: 'Form submitted successfully'
				}
			} catch (error) {
				logger.error('Error in submission handler:', error)
				throw new Error('Failed to process form submission')
			}
		}
	}

	return currentConfig
}

/**
 * Get the current configuration
 * @returns {Object} Current configuration
 */
export function getContactFormConfig() {
	if (!currentConfig) {
		logger.warn('Config not initialized, using defaults. Call initContactFormConfig() at app startup.')
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
		name: z.string().optional(),
		type: z.string().optional(),
		size: z.number().optional(),
		preview: z.string().optional()
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