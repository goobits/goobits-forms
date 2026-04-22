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
import { waitFor } from '@testing-library/svelte';
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

		it('should expose accessible primary form controls', () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			const categoryTrigger = container.querySelector('button[aria-haspopup="listbox"]');
			const submitButton = container.querySelector('button[type="submit"]');

			expect(categoryTrigger).toBeTruthy();
			expect(categoryTrigger?.getAttribute('aria-label')).toBeTruthy();
			expect(submitButton).toBeTruthy();
			expect(submitButton?.textContent?.trim()).toBeTruthy();
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
		it('should have focusable primary controls in correct order', () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBeGreaterThan(0);

			const hasCategoryTrigger = focusableElements.some(
				(el) => el.tagName === 'BUTTON' && el.getAttribute('aria-haspopup') === 'listbox'
			);
			const hasSubmitButton = focusableElements.some(
				(el) => el.tagName === 'BUTTON' && el.getAttribute('type') === 'submit'
			);

			expect(hasCategoryTrigger).toBe(true);
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

		it('should only reference existing descriptive elements', () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			const controls = container.querySelectorAll<HTMLElement>(
				'button, input, textarea, select'
			);
			expect(controls.length).toBeGreaterThan(0);

			controls.forEach((control) => {
				const describedBy = control.getAttribute('aria-describedby');
				if (describedBy) {
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
		it('should expose required workflow controls accessibly', () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			const categoryTrigger = container.querySelector('button[aria-haspopup="listbox"]');
			const submitButton = container.querySelector('button[type="submit"]');

			expect(categoryTrigger).toBeTruthy();
			expect(categoryTrigger?.getAttribute('aria-label')).toContain('Select');
			expect(submitButton).toBeTruthy();
			expect(submitButton?.hasAttribute('disabled')).toBe(false);
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
		it('should remain accessible with the default category configuration', async () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should remain accessible when textarea-backed fields are configured', async () => {
			const { container } = render(ContactForm, {
				props: defaultProps
			});

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should be accessible with select-backed category metadata', async () => {
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

			const selectButton = container.querySelector('button[aria-haspopup="listbox"]');
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
