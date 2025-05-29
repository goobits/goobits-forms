import { createContactApiHandler } from '../../handlers/contactFormHandler.js'

// Create the handler with application-specific config
export const POST = createContactApiHandler({
	// Email configuration
	adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
	fromEmail: process.env.FROM_EMAIL || 'noreply@example.com',
	emailServiceConfig: {
		provider: 'aws-ses', // Use AWS SES provider for production
		region: process.env.AWS_REGION,
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
	},
	
	// Security configuration
	recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,
	recaptchaMinScore: 0.5,
	
	// Rate limiting configuration
	rateLimitMaxRequests: 3,
	rateLimitWindowMs: 3600000, // 1 hour
	
	// Custom validation (optional)
	customValidation: data => {
		const errors = {}
		
		// Example: Validate phone number format if provided
		if (data.phone && !/^\+?[\d\s()-]{7,}$/.test(data.phone)) {
			errors.phone = 'Please enter a valid phone number'
		}
		
		return errors
	},
	
	// Custom success handler (optional)
	customSuccessHandler: async (data, clientAddress) => {
		// Example: Store submission in database
		// await db.insertContactSubmission({
		//     ...data,
		//     ip: clientAddress,
		//     timestamp: new Date()
		// })
		
		// Return custom response
		return {
			message: 'Thank you for your message! We\'ll get back to you soon.',
			reference: `REF-${Date.now().toString(36)}`
		}
	}
})