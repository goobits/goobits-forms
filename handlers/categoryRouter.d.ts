/**
 * Category-based contact form router
 *
 * Handles routing and processing for categorized contact forms.
 * Supports category-specific validation, redirection, and form submission.
 */
import type { RequestEvent } from '@sveltejs/kit';
import type { ActionResult } from '@sveltejs/kit';
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
export type FormDataParser = (formData: FormData, category: string) => Promise<{
    data?: Record<string, any>;
    errors?: Record<string, string>;
}>;
/**
 * Submission handler function type
 */
export type SubmissionHandlerCreator = (locals: any) => Promise<(data: Record<string, any>, category: string) => Promise<void>>;
/**
 * Error handler function type
 */
export type ErrorHandler = (error: Error, context: {
    data: Record<string, any>;
    slug: string;
}) => Promise<ActionResult | null>;
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
export declare function createCategoryRouter(config: CategoryRouterConfig): {
    load: ({ params, url, error, redirect }: any) => Promise<LoadResult>;
    handleSubmission: ({ request, url, params, redirect, locals, }: RequestEvent) => Promise<SubmissionResult>;
    categories: CategoriesMap;
};
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
export declare function createContactRouteHandlers(config: CategoryRouterConfig): ContactRouteHandlers;
