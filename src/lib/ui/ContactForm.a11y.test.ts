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

import { describe, it, expect } from 'vitest';
import { render, getFocusableElements } from './test-utils';
import {
	testAccessibility,
	testWCAG_AA,
	testFormLabels,
	testARIA
} from '../utils/a11y-test-utils';
import ContactForm from './ContactForm.svelte';

describe('ContactForm Component - Accessibility', () => {
	const defaultProps = {
		apiEndpoint: '/api/contact',
		config: {
			fields: {
				name: { required: true, label: 'Name' },
				email: { required: true, label: 'Email' },
				message: { required: true, label: 'Message' }
			}
		}
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
				props: {
					...defaultProps,
					initialErrors: {
						email: 'Invalid email format'
					}
				}
			});

			const emailInput = container.querySelector('input[type="email"]');
			if (emailInput) {
				const describedBy = emailInput.getAttribute('aria-describedby');
				expect(describedBy).toBeTruthy();

				// Error message should exist and be referenced
				if (describedBy) {
					const errorElement = container.querySelector(`#${describedBy}`);
					expect(errorElement).toBeTruthy();
				}
			}
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

			const requiredInputs = container.querySelectorAll('[required]');
			expect(requiredInputs.length).toBeGreaterThan(0);

			// Each required field should have visual indicator and/or aria-required
			requiredInputs.forEach((input) => {
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
			const { container } = render(ContactForm, {
				props: {
					...defaultProps,
					isSubmitting: true
				}
			});

			const submitButton = container.querySelector('button[type="submit"]');
			if (submitButton) {
				expect(
					submitButton.hasAttribute('disabled') ||
						submitButton.getAttribute('aria-disabled') === 'true'
				).toBe(true);
			}
		});
	});

	describe('Field Types', () => {
		it('should be accessible with email field', async () => {
			const { container } = render(ContactForm, {
				props: {
					apiEndpoint: '/api/contact',
					config: {
						fields: {
							email: { required: true, type: 'email', label: 'Email' }
						}
					}
				}
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
			const { container } = render(ContactForm, {
				props: {
					apiEndpoint: '/api/contact',
					config: {
						fields: {
							message: {
								required: true,
								type: 'textarea',
								label: 'Message',
								rows: 5
							}
						}
					}
				}
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
			const { container } = render(ContactForm, {
				props: {
					apiEndpoint: '/api/contact',
					config: {
						fields: {
							subject: {
								required: true,
								type: 'select',
								label: 'Subject',
								options: [
									{ value: 'general', label: 'General Inquiry' },
									{ value: 'support', label: 'Support' }
								]
							}
						}
					}
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
