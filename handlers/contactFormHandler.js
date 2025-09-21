/**
 * Contact form handler module
 * Provides reusable handlers for contact form processing
 */
import { json } from '@sveltejs/kit';
import { createLogger } from '../utils/logger.js';
import { sanitizeFormData } from '../utils/sanitizeInput.js';
import { rateLimitFormSubmission } from '../services/rateLimiterService.js';
import { verifyRecaptchaToken } from '../services/recaptchaVerifierService.js';
import sendEmail from '../services/emailService.js';
const logger = createLogger('ContactFormHandler');
/**
 * Create a contact form POST handler for API endpoints
 *
 * @param options - Handler configuration options
 * @returns SvelteKit POST handler function
 *
 * @example
 * ```typescript
 * // In +server.ts
 * export const POST = createContactApiHandler({
 *   adminEmail: 'admin@example.com',
 *   fromEmail: 'noreply@example.com',
 *   rateLimitMaxRequests: 5,
 *   recaptchaMinScore: 0.7
 * });
 * ```
 */
export function createContactApiHandler(options = {}) {
    const { adminEmail, fromEmail, emailServiceConfig, successMessage = 'Thank you for your message! We\'ll get back to you soon.', errorMessage = 'An error occurred. Please try again later.', rateLimitMessage = 'Too many requests. Please try again later.', recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY, recaptchaMinScore = 0.5, rateLimitMaxRequests = 3, rateLimitWindowMs = 3600000, // 1 hour
    logSubmissions = true, customValidation = null, customSuccessHandler = null, } = options;
    return async ({ request, getClientAddress }) => {
        try {
            // Get client IP address
            const clientAddress = getClientAddress ? getClientAddress() : 'unknown';
            // Apply rate limiting
            const { allowed, retryAfter } = await rateLimitFormSubmission(clientAddress, null, 'contact', {
                maxRequests: rateLimitMaxRequests,
                windowMs: rateLimitWindowMs,
                message: rateLimitMessage,
            });
            if (!allowed) {
                const errorResponse = {
                    success: false,
                    error: rateLimitMessage || 'Too many requests. Please try again later.',
                    retryAfter,
                };
                return json(errorResponse, { status: 429 });
            }
            // Parse request body
            let formData;
            try {
                formData = await request.json();
            }
            catch (error) {
                logger.error('Failed to parse request body:', error);
                const errorResponse = {
                    success: false,
                    error: 'Invalid request format',
                };
                return json(errorResponse, { status: 400 });
            }
            // Sanitize form data
            const sanitizedData = sanitizeFormData(formData);
            // Verify reCAPTCHA if token provided
            if (sanitizedData.recaptchaToken) {
                const isValidRecaptcha = await verifyRecaptchaToken(sanitizedData.recaptchaToken, {
                    secretKey: recaptchaSecretKey,
                    minScore: recaptchaMinScore,
                });
                if (!isValidRecaptcha) {
                    const errorResponse = {
                        success: false,
                        error: 'reCAPTCHA verification failed',
                    };
                    return json(errorResponse, { status: 400 });
                }
            }
            // Validate required fields
            const errors = {};
            if (!sanitizedData.name || sanitizedData.name.trim().length === 0) {
                errors.name = 'Name is required';
            }
            if (!sanitizedData.email || sanitizedData.email.trim().length === 0) {
                errors.email = 'Email is required';
            }
            if (!sanitizedData.message || sanitizedData.message.trim().length === 0) {
                errors.message = 'Message is required';
            }
            // Apply custom validation if provided
            if (customValidation) {
                const customErrors = await customValidation(sanitizedData);
                if (customErrors && Object.keys(customErrors).length > 0) {
                    Object.assign(errors, customErrors);
                }
            }
            if (Object.keys(errors).length > 0) {
                const errorResponse = {
                    success: false,
                    errors,
                };
                return json(errorResponse, { status: 400 });
            }
            // Log submission if enabled
            if (logSubmissions) {
                logger.info('Contact form submission:', {
                    category: sanitizedData.category || 'general',
                    ip: clientAddress,
                    timestamp: new Date().toISOString(),
                });
            }
            // Handle custom success logic if provided
            if (customSuccessHandler) {
                try {
                    const customResult = await customSuccessHandler(sanitizedData, clientAddress);
                    if (customResult) {
                        const successResponse = {
                            success: true,
                            message: successMessage,
                            ...customResult,
                        };
                        return json(successResponse);
                    }
                }
                catch (customError) {
                    logger.error('Custom success handler error:', customError);
                    // Continue with default handling
                }
            }
            // Send email notification
            try {
                const category = sanitizedData.category || 'general';
                const subject = `New Contact Form Submission - ${category}`;
                const bodyText = `
New contact form submission:

Category: ${category}
Name: ${sanitizedData.name}
Email: ${sanitizedData.email}
Phone: ${sanitizedData.phone || 'Not provided'}
Subject: ${sanitizedData.subject || 'Not provided'}
Message: ${sanitizedData.message}

Submitted at: ${new Date().toISOString()}
IP Address: ${clientAddress}
        `.trim();
                const bodyHtml = `
<h2>New Contact Form Submission</h2>
<p><strong>Category:</strong> ${category}</p>
<p><strong>Name:</strong> ${sanitizedData.name}</p>
<p><strong>Email:</strong> ${sanitizedData.email}</p>
<p><strong>Phone:</strong> ${sanitizedData.phone || 'Not provided'}</p>
<p><strong>Subject:</strong> ${sanitizedData.subject || 'Not provided'}</p>
<p><strong>Message:</strong></p>
<blockquote>${sanitizedData.message}</blockquote>
<hr>
<p><small>Submitted at: ${new Date().toISOString()}<br>
IP Address: ${clientAddress}</small></p>
        `.trim();
                // Send email to admin/site owner
                const emailResult = await sendEmail(adminEmail || 'admin@example.com', subject, bodyHtml, bodyText, {
                    fromEmail: fromEmail || 'noreply@example.com',
                    ...emailServiceConfig,
                });
                if (emailResult && emailResult.success) {
                    logger.info('Contact form email sent successfully');
                }
                else {
                    logger.warn('Contact form email may not have been sent properly', {
                        success: emailResult?.success || false,
                        message: emailResult?.message || 'Unknown error',
                        details: emailResult?.details || {},
                    });
                }
            }
            catch (emailError) {
                logger.error('Failed to send contact form email:', {
                    error: emailError.message,
                    stack: emailError.stack,
                    code: emailError.code,
                    details: emailError.details || {},
                    adminEmail,
                    fromEmail,
                    provider: emailServiceConfig?.provider || 'unknown',
                });
                // Don't fail the API response if email fails
            }
            const successResponse = {
                success: true,
                message: successMessage,
            };
            return json(successResponse);
        }
        catch (error) {
            logger.error('Contact form API error:', error);
            const errorResponse = {
                success: false,
                error: errorMessage,
            };
            return json(errorResponse, { status: 500 });
        }
    };
}
/**
 * Create complete contact form handlers with GET and POST
 *
 * @param options - Handler configuration options
 * @returns Object with POST handler for contact form processing
 *
 * @example
 * ```typescript
 * // In +server.ts
 * const handlers = createContactFormHandlers({
 *   adminEmail: 'contact@company.com',
 *   successMessage: 'Thanks for reaching out!',
 *   rateLimitMaxRequests: 10
 * });
 *
 * export const { POST } = handlers;
 * ```
 */
export function createContactFormHandlers(options = {}) {
    return {
        POST: createContactApiHandler(options),
    };
}
