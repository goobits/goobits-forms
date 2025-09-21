/**
 * Contact API Server Route Example
 *
 * @fileoverview Example SvelteKit API route demonstrating how to use the contact form handler
 * with comprehensive configuration options including email delivery, security, rate limiting,
 * and custom validation/success handling.
 *
 * @module examples/contact-api
 * @author @goobits
 * @version 1.0.0
 * @since 1.0.0
 */

import type { RequestHandler } from '@sveltejs/kit';
import { createContactApiHandler } from "../../handlers/contactFormHandler.ts";

/**
 * Interface for custom validation errors
 */
interface ValidationErrors {
  [key: string]: string;
}

/**
 * Interface for form data being validated
 */
interface FormData {
  phone?: string;
  email?: string;
  name?: string;
  message?: string;
  [key: string]: any;
}

/**
 * Interface for custom success response
 */
interface CustomSuccessResponse {
  message: string;
  reference: string;
}

/**
 * POST handler for contact form submissions
 *
 * @description Creates a fully configured contact form API handler with:
 * - AWS SES email delivery
 * - reCAPTCHA verification
 * - Rate limiting protection
 * - Custom validation logic
 * - Custom success handling
 *
 * @example
 * ```typescript
 * // To use this endpoint in your SvelteKit app:
 * // 1. Copy this file to src/routes/api/contact/+server.ts
 * // 2. Set the required environment variables:
 * //    - ADMIN_EMAIL
 * //    - FROM_EMAIL
 * //    - AWS_REGION
 * //    - AWS_ACCESS_KEY_ID
 * //    - AWS_SECRET_ACCESS_KEY
 * //    - RECAPTCHA_SECRET_KEY
 * // 3. Submit POST requests to /api/contact
 * ```
 */
export const POST: RequestHandler = createContactApiHandler({
  // Email configuration
  /** Admin email address where contact form submissions will be sent */
  adminEmail: process.env.ADMIN_EMAIL || "admin@example.com",

  /** From email address for outgoing notifications */
  fromEmail: process.env.FROM_EMAIL || "noreply@example.com",

  /** Email service configuration for AWS SES */
  emailServiceConfig: {
    provider: "aws-ses" as const, // Use AWS SES provider for production
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

  // Security configuration
  /** reCAPTCHA secret key for bot protection */
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,

  /** Minimum reCAPTCHA score required (0.0-1.0, higher = more restrictive) */
  recaptchaMinScore: 0.5,

  // Rate limiting configuration
  /** Maximum number of requests allowed per time window */
  rateLimitMaxRequests: 3,

  /** Time window for rate limiting in milliseconds (1 hour) */
  rateLimitWindowMs: 3600000, // 1 hour

  /**
   * Custom validation function for additional form field validation
   *
   * @param data - The form data to validate
   * @returns Object containing validation errors, empty if no errors
   *
   * @example
   * ```typescript
   * // This function runs after basic validation
   * // Add your custom business logic here
   * const errors = customValidation({
   *   phone: "+1-555-123-4567",
   *   email: "user@example.com"
   * });
   * // Returns: {} if valid, { phone: "error message" } if invalid
   * ```
   */
  customValidation: (data: FormData): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Example: Validate phone number format if provided
    if (data.phone && !/^\+?[\d\s()-]{7,}$/.test(data.phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    // Example: Additional email validation beyond basic format
    if (data.email && data.email.includes('tempmail')) {
      errors.email = "Temporary email addresses are not allowed";
    }

    // Example: Message length validation
    if (data.message && data.message.length < 10) {
      errors.message = "Message must be at least 10 characters long";
    }

    return errors;
  },

  /**
   * Custom success handler for post-submission processing
   *
   * @param data - The validated form data
   * @param clientAddress - The client's IP address
   * @returns Promise resolving to custom success response
   *
   * @example
   * ```typescript
   * // This function runs after successful validation and email sending
   * // Use it for database storage, analytics, etc.
   * const response = await customSuccessHandler({
   *   name: "John Doe",
   *   email: "john@example.com",
   *   message: "Hello world"
   * }, "192.168.1.1");
   * // Returns: { message: "...", reference: "REF-abc123" }
   * ```
   */
  customSuccessHandler: async (
    data: FormData,
    clientAddress: string
  ): Promise<CustomSuccessResponse> => {
    // Example: Store submission in database
    // await db.insertContactSubmission({
    //     ...data,
    //     ip: clientAddress,
    //     timestamp: new Date()
    // })

    // Example: Send notification to admin dashboard
    // await notifyAdminDashboard(data);

    // Example: Add to CRM system
    // await crmIntegration.addLead(data);

    // Return custom response with reference number
    return {
      message: "Thank you for your message! We'll get back to you soon.",
      reference: `REF-${Date.now().toString(36)}`,
    };
  },
});