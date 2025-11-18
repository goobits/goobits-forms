/**
 * Accessibility Tests for Textarea Component
 *
 * Tests WCAG 2.1 AA compliance and accessibility features:
 * - No axe violations
 * - Keyboard navigation
 * - ARIA attributes
 * - Focus management
 * - Form labels
 * - Character limits
 */

import { describe, it, expect } from 'vitest';
import { render, getFocusableElements } from './test-utils';
import {
	testAccessibility,
	testWCAG_AA,
	testKeyboardNavigation,
	testFormLabels,
	assertFocusable
} from '../utils/a11y-test-utils';
import Textarea from './Textarea.svelte';

describe('Textarea Component - Accessibility', () => {
	describe('WCAG Compliance', () => {
		it('should have no accessibility violations with default props', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'default-textarea',
					name: 'message',
					'aria-label': 'Message textarea'
				}
			});

			await testAccessibility(container);
		});

		it('should meet WCAG 2.1 AA standards', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'wcag-textarea',
					name: 'description',
					placeholder: 'Enter description',
					'aria-label': 'Description field'
				}
			});

			const results = await testWCAG_AA(container);
			expect(results).toHaveNoViolations();
		});

		it('should have proper form labels', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'labeled-textarea',
					name: 'comment',
					'aria-label': 'Comment'
				}
			});

			const results = await testFormLabels(container);
			expect(results).toHaveNoViolations();
		});
	});

	describe('Keyboard Navigation', () => {
		it('should be keyboard accessible', () => {
			const { container } = render(Textarea, {
				props: {
					id: 'keyboard-textarea',
					'aria-label': 'Keyboard test'
				}
			});

			const textarea = container.querySelector('textarea');
			expect(textarea).toBeTruthy();
			testKeyboardNavigation(textarea!);
		});

		it('should be focusable', () => {
			const { container } = render(Textarea, {
				props: {
					id: 'focusable-textarea',
					'aria-label': 'Focusable test'
				}
			});

			const textarea = container.querySelector('textarea');
			assertFocusable(textarea!);
		});

		it('should be included in focusable elements', () => {
			const { container } = render(Textarea, {
				props: {
					id: 'focus-list-textarea',
					'aria-label': 'Focus list test'
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBeGreaterThan(0);
			expect(focusableElements[0].tagName).toBe('TEXTAREA');
		});

		it('should not be focusable when disabled', () => {
			const { container } = render(Textarea, {
				props: {
					id: 'disabled-textarea',
					disabled: true,
					'aria-label': 'Disabled textarea'
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBe(0);
		});
	});

	describe('ARIA Attributes', () => {
		it('should have proper ARIA label', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'aria-label-textarea',
					'aria-label': 'Enter your feedback'
				}
			});

			const textarea = container.querySelector('textarea');
			expect(textarea).toHaveAttribute('aria-label', 'Enter your feedback');

			await testAccessibility(container);
		});

		it('should support aria-describedby', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'described-textarea',
					describedBy: 'help-text',
					'aria-label': 'Textarea with description'
				}
			});

			const textarea = container.querySelector('textarea');
			expect(textarea).toHaveAttribute('aria-describedby', 'help-text');

			await testAccessibility(container);
		});

		it('should handle error state with ARIA', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'error-textarea',
					variant: 'error',
					hasError: true,
					describedBy: 'error-message',
					'aria-label': 'Textarea with error'
				}
			});

			const textarea = container.querySelector('textarea');
			expect(textarea).toHaveAttribute('aria-describedby', 'error-message');

			await testAccessibility(container);
		});

		it('should indicate required fields', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'required-textarea',
					required: true,
					'aria-label': 'Required field'
				}
			});

			const textarea = container.querySelector('textarea');
			expect(textarea).toHaveAttribute('required');

			await testAccessibility(container);
		});
	});

	describe('States', () => {
		it('should be accessible when disabled', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'disabled-state',
					disabled: true,
					'aria-label': 'Disabled textarea'
				}
			});

			const textarea = container.querySelector('textarea');
			expect(textarea).toHaveAttribute('disabled');

			await testAccessibility(container);
		});

		it('should be accessible when readonly', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'readonly-state',
					readonly: true,
					'aria-label': 'Readonly textarea'
				}
			});

			const textarea = container.querySelector('textarea');
			expect(textarea).toHaveAttribute('readonly');

			await testAccessibility(container);
		});

		it('should be accessible in success state', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'success-state',
					variant: 'success',
					'aria-label': 'Success textarea'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Sizes', () => {
		it('should be accessible with small size', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'small-textarea',
					size: 'sm',
					'aria-label': 'Small textarea'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with medium size (default)', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'medium-textarea',
					size: 'md',
					'aria-label': 'Medium textarea'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with large size', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'large-textarea',
					size: 'lg',
					'aria-label': 'Large textarea'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Character Limits', () => {
		it('should be accessible with maxlength', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'maxlength-textarea',
					maxlength: 500,
					'aria-label': 'Limited textarea'
				}
			});

			const textarea = container.querySelector('textarea');
			expect(textarea).toHaveAttribute('maxlength', '500');

			await testAccessibility(container);
		});

		it('should show character counter accessibly', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'counter-textarea',
					maxlength: 100,
					showCounter: true,
					'aria-label': 'Textarea with counter'
				}
			});

			// The counter should be accessible
			await testAccessibility(container);
		});
	});

	describe('Resize', () => {
		it('should be accessible with resize enabled', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'resize-textarea',
					resize: true,
					'aria-label': 'Resizable textarea'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with resize disabled', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'no-resize-textarea',
					resize: false,
					'aria-label': 'Non-resizable textarea'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Rows', () => {
		it('should be accessible with custom rows', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'custom-rows-textarea',
					rows: 5,
					'aria-label': 'Textarea with 5 rows'
				}
			});

			const textarea = container.querySelector('textarea');
			expect(textarea).toHaveAttribute('rows', '5');

			await testAccessibility(container);
		});
	});

	describe('Auto-resize', () => {
		it('should be accessible with auto-resize', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'auto-resize-textarea',
					autoResize: true,
					'aria-label': 'Auto-resizing textarea'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Placeholder', () => {
		it('should be accessible with placeholder', async () => {
			const { container } = render(Textarea, {
				props: {
					id: 'placeholder-textarea',
					placeholder: 'Enter your message here...',
					'aria-label': 'Message textarea'
				}
			});

			const textarea = container.querySelector('textarea');
			expect(textarea).toHaveAttribute('placeholder', 'Enter your message here...');

			await testAccessibility(container);
		});
	});
});
