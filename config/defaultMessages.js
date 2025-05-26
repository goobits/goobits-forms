/**
 * Default messages for @goobits/contactform
 * These are used as fallbacks when no messages are provided
 */

export const defaultMessages = {
	// Form labels and UI
	howCanWeHelp: 'How can we help?',
	sendMessage: 'Send Message',
	sending: 'Sending...',

	// Status messages
	uploadingFiles: 'Uploading files...',
	submittingForm: 'Submitting your form...',
	formSubmitted: 'Your form has been submitted successfully!',
	fileUploadError: 'Could not upload files, continuing without attachments',

	// Error messages
	validationError: 'Please fix the validation errors before submitting.',
	formError: 'Form error:',
	networkError: 'An error occurred. Please try again later.',
	rateLimit: (minutes) => `Too many requests. Please try again in ${ minutes } ${ minutes === 1 ? 'minute' : 'minutes' }.`,

	// Form validation
	required: (field) => `Please provide your ${ field }`,
	invalid: (field) => `Please provide a valid ${ field }`,
	select: (field) => `Please select ${ field }`,
	maxLength: (max) => `Maximum ${ max } characters`,

	// File validation
	fileSize: 'File size must be less than 5MB',
	fileType: 'Only .jpg, .jpeg, .png, .webp and .gif files are accepted',
	maxFiles: 'Maximum 3 images allowed',

	// Privacy
	privacyText: 'By submitting this form, you agree to our',
	privacyLink: 'Privacy Policy',

	// Thank you page
	thankYouTitle: 'Thank You!',
	thankYouMessage: 'Thank you for your message!',
	thankYouSubMessage: 'We\'ll get back to you as soon as possible 🌈',
	returnToHome: 'Return to Home',

	// Field labels (common)
	name: 'Name',
	email: 'Email',
	message: 'Message',
	phone: 'Phone',
	company: 'Company',

	// Form categories
	generalInquiry: 'General Inquiry',
	supportRequest: 'Support Request',
	feedback: 'Feedback',
	booking: 'Book an Appointment',
	businessInquiry: 'Business Inquiry'
}