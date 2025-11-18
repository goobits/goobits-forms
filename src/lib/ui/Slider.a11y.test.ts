/**
 * Accessibility Tests for Slider Component
 *
 * Tests WCAG 2.1 AA compliance and accessibility features:
 * - No axe violations
 * - Keyboard navigation
 * - ARIA attributes
 * - Focus management
 * - Labels and descriptions
 * - Disabled/error states
 * - Range slider accessibility
 */

import { describe, it, expect } from 'vitest';
import { render, getFocusableElements } from './test-utils';
import {
	testAccessibility,
	testWCAG_AA,
	testKeyboardNavigation,
	assertFocusable
} from '../utils/a11y-test-utils';
import Slider from './Slider.svelte';

describe('Slider Component - Accessibility', () => {
	describe('WCAG Compliance', () => {
		it('should have no accessibility violations with default props', async () => {
			const { container } = render(Slider, {
				props: {
					'aria-label': 'Default slider'
				}
			});

			await testAccessibility(container);
		});

		it('should meet WCAG 2.1 AA standards', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					min: 0,
					max: 100,
					label: 'Volume control'
				}
			});

			const results = await testWCAG_AA(container);
			expect(results).toHaveNoViolations();
		});

		it('should be accessible with label', async () => {
			const { container } = render(Slider, {
				props: {
					value: 75,
					label: 'Brightness',
					min: 0,
					max: 100
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with aria-label', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					'aria-label': 'Temperature control'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Keyboard Navigation', () => {
		it('should be keyboard accessible', () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					'aria-label': 'Keyboard test slider'
				}
			});

			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toBeTruthy();
			testKeyboardNavigation(thumb!);
		});

		it('should be focusable', () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					'aria-label': 'Focusable slider'
				}
			});

			const thumb = container.querySelector('[role="slider"]');
			assertFocusable(thumb!);
		});

		it('should be included in focusable elements', () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					'aria-label': 'Focus list slider'
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBeGreaterThan(0);
			expect(focusableElements[0]).toHaveAttribute('role', 'slider');
		});

		it('should not be focusable when disabled', () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					disabled: true,
					'aria-label': 'Disabled slider'
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBe(0);
		});

		it('both thumbs should be focusable in range mode', () => {
			const { container } = render(Slider, {
				props: {
					value: [25, 75],
					label: 'Price range'
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBe(2);
			expect(focusableElements[0]).toHaveAttribute('role', 'slider');
			expect(focusableElements[1]).toHaveAttribute('role', 'slider');
		});
	});

	describe('ARIA Attributes', () => {
		it('should have role="slider"', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					'aria-label': 'Test slider'
				}
			});

			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toBeInTheDocument();

			await testAccessibility(container);
		});

		it('should have aria-valuemin', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					min: 10,
					max: 90,
					'aria-label': 'Test slider'
				}
			});

			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-valuemin', '10');

			await testAccessibility(container);
		});

		it('should have aria-valuemax', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					min: 10,
					max: 90,
					'aria-label': 'Test slider'
				}
			});

			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-valuemax', '90');

			await testAccessibility(container);
		});

		it('should have aria-valuenow', async () => {
			const { container } = render(Slider, {
				props: {
					value: 65,
					min: 0,
					max: 100,
					'aria-label': 'Test slider'
				}
			});

			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-valuenow', '65');

			await testAccessibility(container);
		});

		it('should have aria-valuetext for formatted values', async () => {
			const { container } = render(Slider, {
				props: {
					value: 75,
					min: 0,
					max: 100,
					formatValue: (v: number) => `${v}%`,
					'aria-label': 'Progress'
				}
			});

			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-valuetext', '75%');

			await testAccessibility(container);
		});

		it('should have aria-label from label prop', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					label: 'Volume control'
				}
			});

			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-label', 'Volume control');

			await testAccessibility(container);
		});

		it('should have explicit aria-label when provided', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					label: 'Volume',
					'aria-label': 'Audio volume control'
				}
			});

			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-label', 'Audio volume control');

			await testAccessibility(container);
		});

		it('should have aria-describedby when provided', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					'aria-label': 'Volume',
					'aria-describedby': 'volume-help'
				}
			});

			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-describedby', 'volume-help');

			await testAccessibility(container);
		});

		it('should have aria-disabled when disabled', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					disabled: true,
					'aria-label': 'Disabled slider'
				}
			});

			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-disabled', 'true');

			await testAccessibility(container);
		});
	});

	describe('Range Slider ARIA', () => {
		it('should have appropriate labels for both thumbs', async () => {
			const { container } = render(Slider, {
				props: {
					value: [25, 75],
					label: 'Price range'
				}
			});

			const thumbs = container.querySelectorAll('[role="slider"]');
			expect(thumbs[0]).toHaveAttribute('aria-label', 'Price range minimum');
			expect(thumbs[1]).toHaveAttribute('aria-label', 'Price range maximum');

			await testAccessibility(container);
		});

		it('should have correct aria-valuenow for both thumbs', async () => {
			const { container } = render(Slider, {
				props: {
					value: [30, 70],
					min: 0,
					max: 100,
					label: 'Range'
				}
			});

			const thumbs = container.querySelectorAll('[role="slider"]');
			expect(thumbs[0]).toHaveAttribute('aria-valuenow', '30');
			expect(thumbs[1]).toHaveAttribute('aria-valuenow', '70');

			await testAccessibility(container);
		});

		it('should have aria-valuetext for both thumbs with formatter', async () => {
			const { container } = render(Slider, {
				props: {
					value: [100, 500],
					min: 0,
					max: 1000,
					formatValue: (v: number) => `$${v}`,
					label: 'Price range'
				}
			});

			const thumbs = container.querySelectorAll('[role="slider"]');
			expect(thumbs[0]).toHaveAttribute('aria-valuetext', '$100');
			expect(thumbs[1]).toHaveAttribute('aria-valuetext', '$500');

			await testAccessibility(container);
		});
	});

	describe('Error State Accessibility', () => {
		it('should be accessible with error message', async () => {
			const { container } = render(Slider, {
				props: {
					value: 5,
					min: 0,
					max: 100,
					error: 'Value must be at least 10',
					label: 'Quantity'
				}
			});

			await testAccessibility(container);
		});

		it('error message should have role="alert"', async () => {
			const { container } = render(Slider, {
				props: {
					value: 5,
					error: 'Invalid value',
					'aria-label': 'Test slider'
				}
			});

			const error = container.querySelector('.slider__error');
			expect(error).toHaveAttribute('role', 'alert');

			await testAccessibility(container);
		});
	});

	describe('Value Display Accessibility', () => {
		it('should be accessible with value display', async () => {
			const { container } = render(Slider, {
				props: {
					value: 75,
					label: 'Volume',
					showValue: true
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with range value display', async () => {
			const { container } = render(Slider, {
				props: {
					value: [25, 75],
					label: 'Price range',
					showValue: true
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Tick Marks Accessibility', () => {
		it('should be accessible with tick marks', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					min: 0,
					max: 100,
					step: 10,
					showTicks: true,
					label: 'Volume'
				}
			});

			await testAccessibility(container);
		});

		it('tick marks should be presentation only', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					showTicks: true,
					'aria-label': 'Test slider'
				}
			});

			// Ticks should not be focusable or interactive
			const ticks = container.querySelectorAll('.slider__tick');
			ticks.forEach((tick) => {
				expect(tick).not.toHaveAttribute('tabindex');
				expect(tick).not.toHaveAttribute('role');
			});

			await testAccessibility(container);
		});
	});

	describe('Custom Marks Accessibility', () => {
		it('should be accessible with custom marks', async () => {
			const { container } = render(Slider, {
				props: {
					value: 3,
					min: 1,
					max: 5,
					marks: [
						{ value: 1, label: 'Poor' },
						{ value: 2, label: 'Fair' },
						{ value: 3, label: 'Good' },
						{ value: 4, label: 'Very Good' },
						{ value: 5, label: 'Excellent' }
					],
					label: 'Rating'
				}
			});

			await testAccessibility(container);
		});

		it('marks should be visible and readable', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					min: 0,
					max: 100,
					marks: [
						{ value: 0, label: 'Min' },
						{ value: 100, label: 'Max' }
					],
					'aria-label': 'Test slider'
				}
			});

			const marks = container.querySelectorAll('.slider__mark-label');
			expect(marks.length).toBe(2);
			expect(marks[0]).toHaveTextContent('Min');
			expect(marks[1]).toHaveTextContent('Max');

			await testAccessibility(container);
		});
	});

	describe('Size Variants Accessibility', () => {
		it('should be accessible with small size', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					size: 'sm',
					'aria-label': 'Small slider'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with medium size', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					size: 'md',
					'aria-label': 'Medium slider'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with large size', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					size: 'lg',
					'aria-label': 'Large slider'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Custom Value Formatter Accessibility', () => {
		it('should be accessible with percentage formatter', async () => {
			const { container } = render(Slider, {
				props: {
					value: 75,
					formatValue: (v: number) => `${v}%`,
					label: 'Progress'
				}
			});

			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-valuetext', '75%');

			await testAccessibility(container);
		});

		it('should be accessible with currency formatter', async () => {
			const { container } = render(Slider, {
				props: {
					value: 500,
					min: 0,
					max: 1000,
					formatValue: (v: number) => `$${v}`,
					label: 'Budget'
				}
			});

			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-valuetext', '$500');

			await testAccessibility(container);
		});

		it('should be accessible with complex formatter', async () => {
			const { container } = render(Slider, {
				props: {
					value: 3,
					min: 1,
					max: 5,
					formatValue: (v: number) => {
						const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
						return labels[v];
					},
					label: 'Rating'
				}
			});

			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-valuetext', 'Good');

			await testAccessibility(container);
		});
	});

	describe('Focus Management', () => {
		it('thumb should receive focus on tab', () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					'aria-label': 'Focus test slider'
				}
			});

			const thumb = container.querySelector('[role="slider"]') as HTMLElement;
			thumb.focus();
			expect(document.activeElement).toBe(thumb);
		});

		it('should show focus indicator', () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					'aria-label': 'Focus indicator test'
				}
			});

			const thumb = container.querySelector('[role="slider"]') as HTMLElement;
			thumb.focus();

			// The component should have focus-visible styles
			// This is tested visually and through CSS, but we can verify focus works
			expect(document.activeElement).toBe(thumb);
		});

		it('both thumbs should be in tab order for range slider', () => {
			const { container } = render(Slider, {
				props: {
					value: [25, 75],
					label: 'Range slider'
				}
			});

			const thumbs = container.querySelectorAll('[role="slider"]');
			expect(thumbs[0]).toHaveAttribute('tabindex', '0');
			expect(thumbs[1]).toHaveAttribute('tabindex', '0');
		});
	});

	describe('Combination States', () => {
		it('should be accessible with multiple features', async () => {
			const { container } = render(Slider, {
				props: {
					value: 60,
					min: 0,
					max: 100,
					step: 5,
					label: 'Volume',
					showValue: true,
					showTicks: true,
					size: 'lg',
					formatValue: (v: number) => `${v}%`
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible as range slider with all features', async () => {
			const { container } = render(Slider, {
				props: {
					value: [200, 800],
					min: 0,
					max: 1000,
					step: 50,
					label: 'Price range',
					showValue: true,
					formatValue: (v: number) => `$${v}`,
					marks: [
						{ value: 0, label: '$0' },
						{ value: 500, label: '$500' },
						{ value: 1000, label: '$1000' }
					]
				}
			});

			await testAccessibility(container);
		});
	});
});
