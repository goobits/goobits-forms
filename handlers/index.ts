/**
 * Route handlers for contact form endpoints
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler, RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';
import { getContactFormConfig } from '../config/index.js';
import { getValidatorForCategory } from '../validation/index.js';

// Export simplified contact form handler
export * from './contactFormHandler.js';

/**
 * URL category extractor function type
 */
export type CategoryExtractor = (url: URL) => string;

/**
 * Rate limiter function type
 */
export type RateLimiter = (locals: any) => Promise<{ allowed: boolean; retryAfter?: number }>;

/**
 * Data sanitizer function type
 */
export type DataSanitizer = (data: Record<string, any>) => Promise<Record<string, any>> | Record<string, any>;

/**
 * reCAPTCHA verifier function type
 */
export type RecaptchaVerifier = (token: string) => Promise<boolean>;

/**
 * Success handler context interface
 */
export interface SuccessHandlerContext {
  /** Sanitized form data */
  data: Record<string, any>;
  /** Form category */
  category: string;
  /** SvelteKit locals object */
  locals: any;
  /** Original request object */
  request: Request;
}

/**
 * Success handler function type
 */
export type SuccessHandler = (context: SuccessHandlerContext) => Promise<{
  message?: string;
  [key: string]: any;
}>;

/**
 * Error handler function type
 */
export type ErrorHandler = (error: Error) => Promise<{
  status?: number;
  [key: string]: any;
}>;

/**
 * Contact form configuration interface
 */
export interface ContactFormConfig {
  /** Category configurations */
  categories: Record<string, any>;
  /** Validation schemas */
  schemas: {
    categories: Record<string, any>;
  };
  /** reCAPTCHA configuration */
  recaptcha: {
    enabled: boolean;
  };
  /** Error messages */
  errorMessages: {
    recaptchaVerification: string;
  };
}

/**
 * Page handler options interface
 */
export interface ContactPageHandlerOptions {
  /** Function to extract category from URL */
  getCategory?: CategoryExtractor;
  /** Custom form configuration */
  config?: ContactFormConfig | null;
}

/**
 * Page load result interface
 */
export interface ContactPageLoadResult {
  /** Superforms form object */
  form: any;
  /** Selected category */
  category: string;
}

/**
 * GET handler options interface
 */
export interface ContactGetHandlerOptions {
  /** Default category to use */
  defaultCategory?: string;
  /** Custom form configuration */
  config?: ContactFormConfig | null;
}

/**
 * GET handler result interface
 */
export interface ContactGetResult {
  /** Superforms form object */
  form: any;
  /** Selected category */
  category: string;
}

/**
 * POST handler options interface
 */
export interface ContactPostHandlerOptions {
  /** Custom form configuration */
  config?: ContactFormConfig | null;
  /** Rate limiting function */
  rateLimiter?: RateLimiter | null;
  /** Data sanitization function */
  sanitizer?: DataSanitizer | null;
  /** reCAPTCHA verification function */
  recaptchaVerifier?: RecaptchaVerifier | null;
  /** Success handler function */
  successHandler?: SuccessHandler | null;
  /** Error handler function */
  errorHandler?: ErrorHandler | null;
  /** Logger instance */
  logger?: any;
}

/**
 * POST request data interface
 */
export interface ContactPostData {
  /** Form category */
  category?: string;
  /** reCAPTCHA token */
  recaptchaToken?: string;
  /** Additional form fields */
  [key: string]: any;
}

/**
 * Combined handlers interface
 */
export interface ContactHandlers {
  /** GET request handler */
  GET: RequestHandler;
  /** POST request handler */
  POST: RequestHandler;
}

/**
 * Create a page load handler for the contact form
 *
 * @param options - Handler configuration options
 * @returns SvelteKit load function for contact form pages
 *
 * @example
 * ```typescript
 * // In +page.server.ts
 * export const load = createContactPageHandler({
 *   getCategory: (url) => url.searchParams.get('type') || 'general',
 *   config: customFormConfig
 * });
 * ```
 */
export function createContactPageHandler(options: ContactPageHandlerOptions = {}): (event: any) => Promise<ContactPageLoadResult> {
  const {
    getCategory = (url: URL) => url.searchParams.get('type') || 'general',
    config = null,
  } = options;

  return async ({ url }: any): Promise<ContactPageLoadResult> => {
    const finalConfig = config || getContactFormConfig();
    const category = getCategory(url);

    // Validate category exists
    if (!finalConfig.categories[category]) {
      return {
        form: await superValidate(
          {},
          zod4(finalConfig.schemas.categories.general),
        ),
        category: 'general',
      };
    }

    // Use category-specific validator
    const validator = getValidatorForCategory(finalConfig, category);
    const form = await superValidate({ category }, validator);

    return {
      form,
      category,
    };
  };
}

/**
 * Create a GET handler for the contact API
 *
 * @param options - Handler configuration options
 * @returns SvelteKit GET handler for contact API endpoints
 *
 * @example
 * ```typescript
 * // In +server.ts
 * export const GET = createContactGetHandler({
 *   defaultCategory: 'support',
 *   config: customFormConfig
 * });
 * ```
 */
export function createContactGetHandler(options: ContactGetHandlerOptions = {}): RequestHandler {
  const { defaultCategory = 'general', config = null } = options;

  return async (): Promise<Response> => {
    const finalConfig = config || getContactFormConfig();
    const form = await superValidate(
      { category: defaultCategory },
      zod4(finalConfig.schemas.categories[defaultCategory]),
    );

    const result: ContactGetResult = {
      form,
      category: defaultCategory,
    };

    return json(result);
  };
}

/**
 * Create a POST handler for the contact API
 *
 * @param options - Handler configuration options
 * @returns SvelteKit POST handler for contact form submissions
 *
 * @example
 * ```typescript
 * // In +server.ts
 * export const POST = createContactPostHandler({
 *   rateLimiter: customRateLimiter,
 *   successHandler: async (context) => {
 *     await sendNotificationEmail(context.data);
 *     return { message: 'Email sent successfully!' };
 *   }
 * });
 * ```
 */
export function createContactPostHandler(options: ContactPostHandlerOptions = {}): RequestHandler {
  const {
    config = null,
    rateLimiter = null,
    sanitizer = null,
    recaptchaVerifier = null,
    successHandler = null,
    errorHandler = null,
    logger = console,
  } = options;

  return async ({ request, locals }: RequestEvent): Promise<Response> => {
    const finalConfig = config || getContactFormConfig();

    try {
      // Parse request body
      const rawData: ContactPostData = await request.json();
      const { category = 'general', recaptchaToken, ...formData } = rawData;

      // Rate limiting
      if (rateLimiter) {
        const rateLimitResult = await rateLimiter(locals);
        if (!rateLimitResult.allowed) {
          return json(
            {
              success: false,
              error: 'Too many requests. Please try again later.',
            },
            { status: 429 },
          );
        }
      }

      // Verify reCAPTCHA if enabled
      if (finalConfig.recaptcha.enabled && recaptchaVerifier) {
        const recaptchaValid = await recaptchaVerifier(recaptchaToken || '');
        if (!recaptchaValid) {
          return json(
            {
              success: false,
              error: finalConfig.errorMessages.recaptchaVerification,
            },
            { status: 403 },
          );
        }
      }

      // Sanitize data
      const sanitizedData = sanitizer ? await sanitizer(formData) : formData;

      // Validate form data
      const validator = getValidatorForCategory(finalConfig, category);
      const result = await superValidate(sanitizedData, validator);

      if (!result.valid) {
        return json(
          {
            success: false,
            errors: result.errors,
            form: result,
          },
          { status: 400 },
        );
      }

      // Process successful submission
      if (successHandler) {
        try {
          const response = await successHandler({
            data: sanitizedData,
            category,
            locals,
            request,
          });

          return json({
            success: true,
            message: response.message || 'Message sent successfully!',
            ...response,
          });
        } catch (error) {
          logger.error('Success handler error:', error);
          throw error;
        }
      }

      // Default success response
      return json({
        success: true,
        message: 'Thank you for your message! We\'ll get back to you soon.',
      });
    } catch (error) {
      // Handle errors
      if (errorHandler) {
        const errorResponse = await errorHandler(error as Error);
        return json(errorResponse, { status: errorResponse.status || 500 });
      }

      logger.error('Contact form error:', error);
      return json(
        {
          success: false,
          error: 'An error occurred. Please try again later.',
        },
        { status: 500 },
      );
    }
  };
}

/**
 * Combined handlers options interface
 */
export interface ContactHandlersOptions extends ContactGetHandlerOptions, ContactPostHandlerOptions {
  // Inherits all options from both GET and POST handler options
}

/**
 * Create combined handlers for a contact route
 *
 * @param options - Handler configuration options
 * @returns Object with GET and POST handlers for contact endpoints
 *
 * @example
 * ```typescript
 * // In +server.ts
 * const { GET, POST } = createContactHandlers({
 *   defaultCategory: 'inquiry',
 *   rateLimiter: myRateLimiter,
 *   successHandler: mySuccessHandler
 * });
 *
 * export { GET, POST };
 * ```
 */
export function createContactHandlers(options: ContactHandlersOptions = {}): ContactHandlers {
  return {
    GET: createContactGetHandler(options),
    POST: createContactPostHandler(options),
  };
}