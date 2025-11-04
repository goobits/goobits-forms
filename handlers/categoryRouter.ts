/**
 * Category-based contact form router
 *
 * Handles routing and processing for categorized contact forms.
 * Supports category-specific validation, redirection, and form submission.
 */

import type { RequestEvent } from '@sveltejs/kit';
import type { ActionResult } from '@sveltejs/kit';
import { createLogger } from '../utils/logger.ts';
import { validateCsrfToken } from '@goobits/security/csrf';

const logger = createLogger('CategoryRouter');

/**
 * Category configuration interface
 */
export interface CategoryConfig {
	/** Display label for the category */
	label: string;
	/** Optional description of the category */
	description?: string;
	/** Category-specific validation rules */
	validation?: Record<string, any>;
	/** Custom fields for this category */
	fields?: string[];
}

/**
 * Categories mapping interface
 */
export interface CategoriesMap {
	[key: string]: CategoryConfig;
}

/**
 * Form validation function type
 */
export type ValidatorFunction = (category: string) => any;

/**
 * Form data parser function type
 */
export type FormDataParser = (
	formData: FormData,
	category: string
) => Promise<{
	data?: Record<string, any>;
	errors?: Record<string, string>;
}>;

/**
 * Submission handler function type
 */
export type SubmissionHandlerCreator = (
	locals: any
) => Promise<(data: Record<string, any>, category: string) => Promise<void>>;

/**
 * Error handler function type
 */
export type ErrorHandler = (
	error: Error,
	context: { data: Record<string, any>; slug: string }
) => Promise<ActionResult | null>;

/**
 * Configuration object for the category router
 */
export interface CategoryRouterConfig {
	/** Map of category slugs to category configurations */
	categories?: CategoriesMap;
	/** Base path for contact routes */
	basePath?: string;
	/** Default category to use when none specified */
	defaultCategory?: string;
	/** Path to redirect to on successful submission */
	successPath?: string;
	/** Custom error handler function */
	errorHandler?: ErrorHandler | null;
	/** Function to get validator for a specific category */
	getValidatorForCategory?: ValidatorFunction | null;
	/** Custom form data parser function */
	formDataParser?: FormDataParser | null;
	/** Function to create submission handler */
	createSubmissionHandler?: SubmissionHandlerCreator | null;
}

/**
 * Form state interface
 */
export interface FormState {
	/** Current form data */
	data: Record<string, any>;
	/** Validation errors */
	errors: Record<string, string>;
	/** Whether form has been submitted */
	isSubmitted: boolean;
	/** Form validator instance */
	validator?: any;
}

/**
 * Load function return type
 */
export interface LoadResult {
	/** Form state object */
	form: FormState;
	/** Whether to show thank you message */
	showThankYou?: boolean;
	/** Current category slug */
	categorySlug: string;
	/** Category configuration */
	category?: CategoryConfig;
}

/**
 * Action result for form submissions
 */
export interface SubmissionResult {
	/** Form state after submission */
	form: FormState;
}

/**
 * Creates a category router for contact forms
 *
 * @param config - Configuration object for the router
 * @returns Object containing load and handleSubmission functions for SvelteKit routes
 *
 * @example
 * ```typescript
 * const router = createCategoryRouter({
 *   categories: {
 *     sales: { label: 'Sales Inquiry' },
 *     support: { label: 'Technical Support' }
 *   },
 *   basePath: '/contact',
 *   defaultCategory: 'general'
 * });
 *
 * export const load = router.load;
 * export const actions = { default: router.handleSubmission };
 * ```
 */
export function createCategoryRouter(config: CategoryRouterConfig) {
	const {
		categories = {},
		basePath = '/contact',
		defaultCategory = 'general',
		successPath = '/contact/success',
		errorHandler = null,
		getValidatorForCategory = null,
		formDataParser = null,
		createSubmissionHandler = null
	} = config;

	/**
	 * Load handler for SvelteKit routes
	 * Handles category detection, validation, and initial form setup
	 *
	 * @param routeParams - SvelteKit load event parameters
	 * @returns Data for the route including form state and category info
	 * @throws {Error} 404 error if category is not found
	 * @throws {Redirect} 301 redirect to canonical category URL
	 *
	 * @example
	 * ```typescript
	 * // In +page.server.ts
	 * export const load = router.load;
	 * ```
	 */
	async function load({ params, url, error, redirect }: any): Promise<LoadResult> {
		const slug = params.slug as string;
		const lang = (params.lang as string) || 'en';

		// Handle success page
		if (slug === 'success') {
			return {
				form: {
					data: {},
					errors: {},
					isSubmitted: false
				},
				showThankYou: true,
				categorySlug: url.searchParams.get('category') || defaultCategory
			};
		}

		// Check if the slug corresponds to a valid category
		const category = categories[slug];
		if (!category) {
			// If not a direct match, try to find a matching category by label
			const categoryEntry = Object.entries(categories).find(
				([, cat]) => cat.label.toLowerCase().replace(/\s+/g, '-') === slug
			);

			if (!categoryEntry) {
				throw error(404, `Category not found: ${slug}`);
			}

			// Redirect to the canonical slug
			throw redirect(301, `/${lang}${basePath}/${categoryEntry[0]}`);
		}

		// Initialize the form with validator if provided
		const initialFormData: Record<string, any> = {};
		let validator: any = null;

		if (typeof getValidatorForCategory === 'function') {
			validator = getValidatorForCategory(slug);
		}

		return {
			form: {
				data: initialFormData,
				errors: {},
				isSubmitted: false,
				validator
			},
			categorySlug: slug,
			category
		};
	}

	/**
	 * Form action handler for SvelteKit routes
	 * Processes form submissions with CSRF validation and category-specific logic
	 *
	 * @param actionParams - SvelteKit action event parameters
	 * @returns Form submission result with updated form state
	 * @throws {Redirect} 303 redirect to success page on successful submission
	 *
	 * @example
	 * ```typescript
	 * // In +page.server.ts
	 * export const actions = {
	 *   default: router.handleSubmission
	 * };
	 * ```
	 */
	async function handleSubmission({
		request,
		url,
		params,
		redirect,
		locals = {}
	}: RequestEvent): Promise<SubmissionResult> {
		try {
			const formData = await request.formData();
			const slug = params.slug as string;
			const lang = (params.lang as string) || 'en';

			logger.info('Contact form submission received', {
				category: slug,
				lang,
				origin: url.origin
			});

			// CSRF validation - validateCsrfToken expects Request object
			if (!validateCsrfToken(request)) {
				logger.error('CSRF validation failed');
				return {
					form: {
						data: Object.fromEntries(formData.entries()),
						errors: { _form: 'Invalid security token. Please try again.' },
						isSubmitted: false
					}
				};
			}

			// Parse and validate form data
			let data: Record<string, any> = Object.fromEntries(formData.entries());
			let errors: Record<string, string> = {};

			// Use custom form data parser if provided
			if (typeof formDataParser === 'function') {
				const result = await formDataParser(formData, slug);
				if (result) {
					data = result.data || data;
					errors = result.errors || {};
				}
			}

			// Return early if validation errors
			if (Object.keys(errors).length > 0) {
				return {
					form: { data, errors, isSubmitted: false }
				};
			}

			try {
				// Create a submission handler if provided
				let submissionHandler:
					| ((data: Record<string, any>, category: string) => Promise<void>)
					| undefined;
				if (typeof createSubmissionHandler === 'function') {
					submissionHandler = await createSubmissionHandler(locals);
				}

				// Process the submission
				const fullData = { ...data, category: slug };
				if (submissionHandler) {
					await submissionHandler(fullData, slug);
				}

				logger.info('Form submission processed successfully', {
					category: slug
				});

				// Redirect to success page
				throw redirect(303, `/${lang}${successPath}?category=${slug}`);
			} catch (error) {
				logger.error('Form submission error', { error });

				// Check if reCAPTCHA validation failed
				if (error instanceof Error && error.message && error.message.includes('reCAPTCHA')) {
					return {
						form: {
							data,
							errors: {
								_form: 'reCAPTCHA validation failed. Please try again.'
							},
							isSubmitted: false
						}
					};
				}

				// Use custom error handler if provided
				if (typeof errorHandler === 'function') {
					const customError = await errorHandler(error as Error, { data, slug });
					if (customError) {
						return customError;
					}
				}

				return {
					form: {
						data,
						errors: { _form: 'An error occurred. Please try again.' },
						isSubmitted: false
					}
				};
			}
		} catch (error) {
			// Don't catch redirects
			if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
				throw error;
			}

			logger.error('Unexpected form submission error', { error });

			return {
				form: {
					data: {},
					errors: { _form: 'An unexpected error occurred. Please try again.' },
					isSubmitted: false
				}
			};
		}
	}

	return {
		load,
		handleSubmission,
		categories
	};
}

/**
 * Route handlers return type
 */
export interface ContactRouteHandlers {
	/** Load function for the route */
	load: (params: any) => Promise<LoadResult>;
	/** Actions object with default form handler */
	actions: {
		default: (params: RequestEvent) => Promise<SubmissionResult>;
	};
}

/**
 * Creates SvelteKit route handlers for categorized contact forms
 *
 * @param config - Configuration for the category router
 * @returns SvelteKit route handlers with load function and form actions
 *
 * @example
 * ```typescript
 * // In +page.server.ts
 * const { load, actions } = createContactRouteHandlers({
 *   categories: {
 *     sales: { label: 'Sales Inquiry' },
 *     support: { label: 'Technical Support' }
 *   }
 * });
 *
 * export { load, actions };
 * ```
 */
export function createContactRouteHandlers(config: CategoryRouterConfig): ContactRouteHandlers {
	const router = createCategoryRouter(config);

	return {
		load: (params: any) => router.load(params),
		actions: {
			default: (params: RequestEvent) => router.handleSubmission(params)
		}
	};
}
