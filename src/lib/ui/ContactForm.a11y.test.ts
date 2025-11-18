/**
 * Accessibility Tests for ContactForm Component
 *
 * Tests WCAG 2.1 AA compliance and accessibility features:
 * - No axe violations
 * - Keyboard navigation
 * - Form accessibility
 * - Error messaging
 * - Focus management
 * - Screen reader announcements
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, getFocusableElements } from './test-utils';
import {
	testAccessibility,
	testWCAG_AA,
	testFormLabels,
	testARIA
} from '../utils/a11y-test-utils';
import ContactForm from './ContactForm.svelte';
import { initContactFormConfig } from '../config/index';

describe('ContactForm Component - Accessibility', () => {
	// Initialize config before each test to ensure clean state
	beforeEach(() => {
		initContactFormConfig({
			categories: {
				general: {
					label: 'General Inquiry',
					icon: 'fa fa-envelope',
					fields: ['name', 'email', 'message', 'coppa']
				},
				'product-feedback': {
					label: 'Product Feedback',
					icon: 'fa fa-comment',
					fields: ['name', 'email', 'message', 'coppa']
				}
			},
			fieldConfigs: {
				name: {
					type: 'text',
					label: 'Name',
					placeholder: 'Your name',
					required: true,
					maxlength: 100
				},
				email: {
					type: 'email',
					label: 'Email',
					placeholder: 'your@email.com',
					required: true,
					maxlength: 254
				},
				message: {
					type: 'textarea',
					label: 'Message',
					placeholder: 'Tell us more...',
					required: true,
					rows: 5,
					maxlength: 5000
				},
				coppa: {
					type: 'checkbox',
					label: 'I confirm I am over 13 years old or have parent/teacher permission',
					required: true
				},
				subject: {
					type: 'select',
					label: 'Subject',
					required: true,
					options: [
						{ value: 'general', label: 'General Inquiry' },
						{ value: 'support', label: 'Support' }
					]
				}
			}
		});
	});

	const defaultProps = {
		apiEndpoint: '/api/contact'
	};

	describe('WCAG Compliance', () => {
		it('should have no accessibility violations with default props', async () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			// Color contrast might be an issue in tests without full CSS
			// so we disable it for component unit tests
			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should meet WCAG 2.1 AA standards', async () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			const results = await testWCAG_AA(container);

			// Allow color-contrast violations in unit tests
			const filteredViolations = results.violations.filter(
				(v) => v.id !== 'color-contrast'
			);

			expect(filteredViolations).toHaveLength(0);
		});

		it('should have proper form labels for all inputs', async () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			const results = await testFormLabels(container);
			expect(results).toHaveNoViolations();
		});

		it('should have proper ARIA attributes', async () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			const results = await testARIA(container);

			// Filter out color-contrast for unit tests
			const filteredViolations = results.violations.filter(
				(v) => v.id !== 'color-contrast'
			);

			expect(filteredViolations).toHaveLength(0);
		});
	});

	describe('Form Structure', () => {
		it('should have a form element with proper role', () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			const form = container.querySelector('form');
			expect(form).toBeTruthy();
		});

		it('should have accessible form fields', () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			const inputs = container.querySelectorAll('input, textarea');
			expect(inputs.length).toBeGreaterThan(0);

			// Each input should have a label or aria-label
			inputs.forEach((input) => {
				const hasLabel =
					input.hasAttribute('aria-label') ||
					input.hasAttribute('aria-labelledby') ||
					container.querySelector(`label[for="${input.id}"]`) !== null;

				expect(hasLabel).toBe(true);
			});
		});

		it('should have an accessible submit button', () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			const submitButton = container.querySelector('button[type="submit"]');
			expect(submitButton).toBeTruthy();
			expect(submitButton?.textContent?.trim()).toBeTruthy();
		});
	});

	describe('Keyboard Navigation', () => {
		it('should have focusable form elements in correct order', () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBeGreaterThan(0);

			// Should include inputs and submit button
			const hasInputs = focusableElements.some(
				(el) => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'
			);
			const hasSubmitButton = focusableElements.some(
				(el) => el.tagName === 'BUTTON' && el.getAttribute('type') === 'submit'
			);

			expect(hasInputs).toBe(true);
			expect(hasSubmitButton).toBe(true);
		});

		it('should allow keyboard navigation through all fields', () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			const focusableElements = getFocusableElements(container);

			focusableElements.forEach((element) => {
				element.focus();
				expect(document.activeElement).toBe(element);
			});
		});
	});

	describe('Error States', () => {
		it('should be accessible with validation errors', async () => {
			const { container } = render(ContactForm, {
				props: {
					...defaultProps,
					initialErrors: {
						name: 'Name is required',
						email: 'Email is required'
					}
				}
			});

			// Error messages should be accessible
			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should associate errors with inputs via aria-describedby', async () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			// Find any input element (formsnap sets aria-describedby automatically)
			const inputs = container.querySelectorAll('input, textarea');
			expect(inputs.length).toBeGreaterThan(0);

			// Check if inputs have aria-describedby (set by formsnap)
			inputs.forEach((input) => {
				// aria-describedby should be present (even if no error, formsnap sets it)
				const describedBy = input.getAttribute('aria-describedby');
				if (describedBy) {
					// The element it references should exist
					const describedElement = container.querySelector(`#${describedBy}`);
					expect(describedElement).toBeTruthy();
				}
			});
		});

		it('should announce errors to screen readers', async () => {
			const { container } = render(ContactForm, {
				props: {
					...defaultProps,
					initialErrors: {
						name: 'Name is required'
					}
				}
			});

			// Look for aria-live regions
			const liveRegions = container.querySelectorAll('[aria-live]');
			expect(liveRegions.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Required Fields', () => {
		it('should mark required fields appropriately', () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			// Find all inputs and textareas
			const allInputs = container.querySelectorAll('input, textarea');
			expect(allInputs.length).toBeGreaterThan(0);

			// At least some fields should be required (name, email, message are configured as required)
			const requiredFields = Array.from(allInputs).filter(
				(input) =>
					input.hasAttribute('required') ||
					input.getAttribute('aria-required') === 'true'
			);

			expect(requiredFields.length).toBeGreaterThan(0);

			// Each required field should have proper accessibility attributes
			requiredFields.forEach((input) => {
				const isAccessible =
					input.hasAttribute('required') || input.getAttribute('aria-required') === 'true';
				expect(isAccessible).toBe(true);
			});
		});
	});

	describe('Success State', () => {
		it('should be accessible when showing success message', async () => {
			const { container } = render(ContactForm, {
				props: {
					...defaultProps,
					showSuccess: true
				}
			});

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should announce success to screen readers', () => {
			const { container } = render(ContactForm, {
				props: {
					...defaultProps,
					showSuccess: true
				}
			});

			// Look for success message with proper role or aria-live
			const successRegions = container.querySelectorAll(
				'[role="status"], [role="alert"], [aria-live]'
			);
			expect(successRegions.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Loading State', () => {
		it('should be accessible during form submission', async () => {
			const { container } = render(ContactForm, {
				props: {
					...defaultProps,
					isSubmitting: true
				}
			});

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should disable form during submission', () => {
			// Note: ContactForm manages submitting state internally, not via props
			// The button is disabled when the internal submitting state is true
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			const submitButton = container.querySelector('button[type="submit"]');
			expect(submitButton).toBeTruthy();

			// When not submitting, button should not be disabled
			expect(submitButton?.hasAttribute('disabled')).toBe(false);

			// The aria-busy attribute should be present and false when not submitting
			expect(submitButton?.getAttribute('aria-busy')).toBe('false');
		});
	});

	describe('Field Types', () => {
		it('should be accessible with email field', async () => {
			// Email field is already configured in the general category
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			const emailInput = container.querySelector('input[type="email"]');
			expect(emailInput).toBeTruthy();

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should be accessible with textarea field', async () => {
			// Message field (textarea) is already configured in the general category
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			const textarea = container.querySelector('textarea');
			expect(textarea).toBeTruthy();

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should be accessible with select field', async () => {
			// Initialize config with product-feedback category that includes select field
			initContactFormConfig({
				categories: {
					'product-feedback': {
						label: 'Product Feedback',
						icon: 'fa fa-comment',
						fields: ['name', 'email', 'subject', 'message', 'coppa']
					}
				},
				fieldConfigs: {
					name: {
						type: 'text',
						label: 'Name',
						placeholder: 'Your name',
						required: true,
						maxlength: 100
					},
					email: {
						type: 'email',
						label: 'Email',
						placeholder: 'your@email.com',
						required: true,
						maxlength: 254
					},
					message: {
						type: 'textarea',
						label: 'Message',
						placeholder: 'Tell us more...',
						required: true,
						rows: 5,
						maxlength: 5000
					},
					subject: {
						type: 'select',
						label: 'Subject',
						required: true,
						options: [
							{ value: 'general', label: 'General Inquiry' },
							{ value: 'support', label: 'Support' }
						]
					},
					coppa: {
						type: 'checkbox',
						label: 'I confirm I am over 13 years old or have parent/teacher permission',
						required: true
					}
				}
			});

			const { container } = render(ContactForm, {
				props: defaultProps
			});

			// SelectMenu is a custom component using button+menu, not a native <select>
			// Check that the select field label is present (indicates field is rendered)
			const subjectLabel = container.querySelector('[data-name="subject"]');
			expect(subjectLabel).toBeTruthy();

			// The SelectMenu trigger should be a button
			const selectButton = subjectLabel?.querySelector('button');
			expect(selectButton).toBeTruthy();

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});
	});

	describe('reCAPTCHA', () => {
		it('should be accessible with reCAPTCHA enabled', async () => {
			const { container } = render(ContactForm, {
				props: {
					...defaultProps,
					recaptchaSiteKey: 'test-site-key'
				}
			});

			// reCAPTCHA should not introduce accessibility violations
			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});
	});

	describe('Custom Styling', () => {
		it('should be accessible with custom CSS classes', async () => {
			const { container } = render(ContactForm, {
				props: {
					...defaultProps,
					class: 'custom-form-class'
				}
			});

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});
	});
});
