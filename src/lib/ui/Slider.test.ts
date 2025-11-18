/**
 * Comprehensive tests for Slider component
 *
 * Tests focus on single/range modes, keyboard navigation, mouse/touch interactions,
 * step increments, tick marks, custom marks, value formatting, and accessibility.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Slider from './Slider.svelte';

describe('Slider Component', () => {
	describe('Basic Rendering', () => {
		test('renders slider with default props', () => {
			const { container } = render(Slider);
			const slider = container.querySelector('.slider');
			expect(slider).toBeInTheDocument();
		});

		test('renders with label', () => {
			const { container } = render(Slider, { props: { label: 'Volume' } });
			expect(container.querySelector('.slider__label')).toHaveTextContent('Volume');
		});

		test('applies custom className', () => {
			const { container } = render(Slider, { props: { class: 'custom-slider' } });
			expect(container.querySelector('.slider')).toHaveClass('custom-slider');
		});

		test('applies data-testid attribute', () => {
			render(Slider, { props: { 'data-testid': 'volume-slider' } });
			expect(screen.getByTestId('volume-slider')).toBeInTheDocument();
		});
	});

	describe('Single Value Slider', () => {
		test('renders single thumb by default', () => {
			const { container } = render(Slider, { props: { value: 50 } });
			const thumbs = container.querySelectorAll('.slider__thumb');
			expect(thumbs).toHaveLength(1);
		});

		test('positions thumb correctly', () => {
			const { container } = render(Slider, {
				props: { value: 50, min: 0, max: 100 }
			});
			const thumb = container.querySelector('.slider__thumb');
			expect(thumb).toHaveStyle({ left: '50%' });
		});

		test('displays current value when showValue is true', () => {
			const { container } = render(Slider, {
				props: { value: 75, label: 'Volume', showValue: true }
			});
			expect(container.querySelector('.slider__value-display')).toHaveTextContent('75');
		});

		test('does not display value when showValue is false', () => {
			const { container } = render(Slider, {
				props: { value: 75, label: 'Volume', showValue: false }
			});
			expect(container.querySelector('.slider__value-display')).not.toBeInTheDocument();
		});
	});

	describe('Range Slider', () => {
		test('renders two thumbs for range mode', () => {
			const { container } = render(Slider, { props: { value: [25, 75] } });
			const thumbs = container.querySelectorAll('.slider__thumb');
			expect(thumbs).toHaveLength(2);
		});

		test('positions both thumbs correctly', () => {
			const { container } = render(Slider, {
				props: { value: [25, 75], min: 0, max: 100 }
			});
			const thumbs = container.querySelectorAll('.slider__thumb');
			expect(thumbs[0]).toHaveStyle({ left: '25%' });
			expect(thumbs[1]).toHaveStyle({ left: '75%' });
		});

		test('displays range values when showValue is true', () => {
			const { container } = render(Slider, {
				props: { value: [25, 75], label: 'Price Range', showValue: true }
			});
			expect(container.querySelector('.slider__value-display')).toHaveTextContent('25 - 75');
		});

		test('applies range slider class', () => {
			const { container } = render(Slider, { props: { value: [25, 75] } });
			expect(container.querySelector('.slider')).toHaveClass('slider--range');
		});
	});

	describe('Min/Max Constraints', () => {
		test('respects min value', () => {
			const { container } = render(Slider, {
				props: { value: 10, min: 20, max: 100 }
			});
			const thumb = container.querySelector('.slider__thumb');
			// Thumb should be at min position (0%)
			expect(thumb).toHaveStyle({ left: '0%' });
		});

		test('respects max value', () => {
			const { container } = render(Slider, {
				props: { value: 150, min: 0, max: 100 }
			});
			const thumb = container.querySelector('.slider__thumb');
			// Thumb should be at max position (100%)
			expect(thumb).toHaveStyle({ left: '100%' });
		});

		test('works with custom min/max range', () => {
			const { container } = render(Slider, {
				props: { value: 50, min: 20, max: 80 }
			});
			const thumb = container.querySelector('.slider__thumb');
			// 50 is halfway between 20 and 80, so should be at 50%
			expect(thumb).toHaveStyle({ left: '50%' });
		});
	});

	describe('Step Increments', () => {
		test('renders with default step of 1', () => {
			const { container } = render(Slider);
			const slider = container.querySelector('[role="slider"]');
			expect(slider).toBeInTheDocument();
		});

		test('accepts custom step value', () => {
			const { container } = render(Slider, {
				props: { value: 50, min: 0, max: 100, step: 10 }
			});
			const slider = container.querySelector('[role="slider"]');
			expect(slider).toBeInTheDocument();
		});
	});

	describe('Keyboard Navigation', () => {
		test('increases value with ArrowRight key', async () => {
			const { container, component } = render(Slider, {
				props: {
					value: 50,
					min: 0,
					max: 100,
					step: 1
				}
			});

			const thumb = container.querySelector('[role="slider"]') as HTMLElement;
			thumb.focus();
			await userEvent.keyboard('{ArrowRight}');
			// Check that aria-valuenow increased
			expect(thumb.getAttribute('aria-valuenow')).toBe('51');
		});

		test('increases value with ArrowUp key', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					min: 0,
					max: 100,
					step: 1
				}
			});

			const thumb = container.querySelector('[role="slider"]') as HTMLElement;
			thumb.focus();
			await userEvent.keyboard('{ArrowUp}');
			// Check that aria-valuenow increased
			expect(thumb.getAttribute('aria-valuenow')).toBe('51');
		});

		test('decreases value with ArrowLeft key', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					min: 0,
					max: 100,
					step: 1
				}
			});

			const thumb = container.querySelector('[role="slider"]') as HTMLElement;
			thumb.focus();
			await userEvent.keyboard('{ArrowLeft}');
			// Check that aria-valuenow decreased
			expect(thumb.getAttribute('aria-valuenow')).toBe('49');
		});

		test('decreases value with ArrowDown key', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					min: 0,
					max: 100,
					step: 1
				}
			});

			const thumb = container.querySelector('[role="slider"]') as HTMLElement;
			thumb.focus();
			await userEvent.keyboard('{ArrowDown}');
			// Check that aria-valuenow decreased
			expect(thumb.getAttribute('aria-valuenow')).toBe('49');
		});

		test('jumps to min with Home key', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					min: 0,
					max: 100
				}
			});

			const thumb = container.querySelector('[role="slider"]') as HTMLElement;
			thumb.focus();
			await userEvent.keyboard('{Home}');
			// Check that aria-valuenow is now min
			expect(thumb.getAttribute('aria-valuenow')).toBe('0');
		});

		test('jumps to max with End key', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					min: 0,
					max: 100
				}
			});

			const thumb = container.querySelector('[role="slider"]') as HTMLElement;
			thumb.focus();
			await userEvent.keyboard('{End}');
			// Check that aria-valuenow is now max
			expect(thumb.getAttribute('aria-valuenow')).toBe('100');
		});

		test('increases by 10x step with PageUp key', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					min: 0,
					max: 100,
					step: 1
				}
			});

			const thumb = container.querySelector('[role="slider"]') as HTMLElement;
			thumb.focus();
			await userEvent.keyboard('{PageUp}');
			// Check that aria-valuenow increased by 10
			expect(thumb.getAttribute('aria-valuenow')).toBe('60');
		});

		test('decreases by 10x step with PageDown key', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					min: 0,
					max: 100,
					step: 1
				}
			});

			const thumb = container.querySelector('[role="slider"]') as HTMLElement;
			thumb.focus();
			await userEvent.keyboard('{PageDown}');
			// Check that aria-valuenow decreased by 10
			expect(thumb.getAttribute('aria-valuenow')).toBe('40');
		});
	});

	describe('Disabled State', () => {
		test('applies disabled class', () => {
			const { container } = render(Slider, { props: { disabled: true } });
			expect(container.querySelector('.slider')).toHaveClass('slider--disabled');
		});

		test('thumb has tabindex -1 when disabled', () => {
			const { container } = render(Slider, { props: { disabled: true } });
			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('tabindex', '-1');
		});

		test('thumb has aria-disabled when disabled', () => {
			const { container } = render(Slider, { props: { disabled: true } });
			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-disabled', 'true');
		});

		test('does not respond to keyboard when disabled', async () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					disabled: true,
					min: 0,
					max: 100
				}
			});

			const thumb = container.querySelector('[role="slider"]') as HTMLElement;
			thumb.focus();
			await userEvent.keyboard('{ArrowRight}');
			// Value should not change when disabled
			expect(thumb.getAttribute('aria-valuenow')).toBe('50');
		});
	});

	describe('Tick Marks', () => {
		test('does not show ticks by default', () => {
			const { container } = render(Slider);
			expect(container.querySelector('.slider__ticks')).not.toBeInTheDocument();
		});

		test('shows ticks when showTicks is true', () => {
			const { container } = render(Slider, {
				props: { showTicks: true, min: 0, max: 10, step: 1 }
			});
			expect(container.querySelector('.slider__ticks')).toBeInTheDocument();
		});

		test('renders correct number of ticks', () => {
			const { container } = render(Slider, {
				props: { showTicks: true, min: 0, max: 10, step: 2 }
			});
			const ticks = container.querySelectorAll('.slider__tick');
			// 0, 2, 4, 6, 8, 10 = 6 ticks
			expect(ticks).toHaveLength(6);
		});
	});

	describe('Custom Marks', () => {
		test('does not show marks by default', () => {
			const { container } = render(Slider);
			expect(container.querySelector('.slider__marks')).not.toBeInTheDocument();
		});

		test('shows marks when provided', () => {
			const { container } = render(Slider, {
				props: {
					marks: [
						{ value: 0, label: 'Min' },
						{ value: 50, label: 'Mid' },
						{ value: 100, label: 'Max' }
					],
					min: 0,
					max: 100
				}
			});
			expect(container.querySelector('.slider__marks')).toBeInTheDocument();
		});

		test('renders correct number of marks', () => {
			const { container } = render(Slider, {
				props: {
					marks: [
						{ value: 0, label: 'Low' },
						{ value: 50, label: 'Medium' },
						{ value: 100, label: 'High' }
					],
					min: 0,
					max: 100
				}
			});
			const marks = container.querySelectorAll('.slider__mark');
			expect(marks).toHaveLength(3);
		});

		test('displays mark labels', () => {
			const { container } = render(Slider, {
				props: {
					marks: [
						{ value: 1, label: '⭐' },
						{ value: 5, label: '⭐⭐⭐⭐⭐' }
					],
					min: 1,
					max: 5
				}
			});
			expect(container.textContent).toContain('⭐');
			expect(container.textContent).toContain('⭐⭐⭐⭐⭐');
		});
	});

	describe('Value Formatting', () => {
		test('uses default formatter', () => {
			const { container } = render(Slider, {
				props: { value: 50, label: 'Value', showValue: true }
			});
			expect(container.querySelector('.slider__value-display')).toHaveTextContent('50');
		});

		test('uses custom formatter for percentage', () => {
			const { container } = render(Slider, {
				props: {
					value: 75,
					label: 'Progress',
					showValue: true,
					formatValue: (v: number) => `${v}%`
				}
			});
			expect(container.querySelector('.slider__value-display')).toHaveTextContent('75%');
		});

		test('uses custom formatter for currency', () => {
			const { container } = render(Slider, {
				props: {
					value: 500,
					min: 0,
					max: 1000,
					label: 'Price',
					showValue: true,
					formatValue: (v: number) => `$${v}`
				}
			});
			expect(container.querySelector('.slider__value-display')).toHaveTextContent('$500');
		});
	});

	describe('Error State', () => {
		test('does not show error by default', () => {
			const { container } = render(Slider);
			expect(container.querySelector('.slider__error')).not.toBeInTheDocument();
		});

		test('shows error message when provided', () => {
			const { container } = render(Slider, {
				props: { error: 'Value must be greater than 10' }
			});
			const errorEl = container.querySelector('.slider__error');
			expect(errorEl).toBeInTheDocument();
			expect(errorEl).toHaveTextContent('Value must be greater than 10');
		});

		test('applies error class', () => {
			const { container } = render(Slider, {
				props: { error: 'Invalid value' }
			});
			expect(container.querySelector('.slider')).toHaveClass('slider--error');
		});

		test('error has role="alert"', () => {
			const { container } = render(Slider, {
				props: { error: 'Invalid value' }
			});
			const errorEl = container.querySelector('.slider__error');
			expect(errorEl).toHaveAttribute('role', 'alert');
		});
	});

	describe('Size Variants', () => {
		test.each(['sm', 'md', 'lg'] as const)('renders %s size', (size) => {
			const { container } = render(Slider, { props: { size } });
			expect(container.querySelector('.slider')).toHaveClass(`slider--${size}`);
		});
	});

	describe('ARIA Attributes', () => {
		test('has role="slider" on thumb', () => {
			const { container } = render(Slider);
			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toBeInTheDocument();
		});

		test('has aria-valuemin', () => {
			const { container } = render(Slider, { props: { min: 10 } });
			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-valuemin', '10');
		});

		test('has aria-valuemax', () => {
			const { container } = render(Slider, { props: { max: 90 } });
			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-valuemax', '90');
		});

		test('has aria-valuenow', () => {
			const { container } = render(Slider, { props: { value: 45 } });
			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-valuenow', '45');
		});

		test('has aria-valuetext with formatted value', () => {
			const { container } = render(Slider, {
				props: {
					value: 50,
					formatValue: (v: number) => `${v}%`
				}
			});
			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-valuetext', '50%');
		});

		test('has aria-label', () => {
			const { container } = render(Slider, {
				props: { 'aria-label': 'Volume control' }
			});
			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-label', 'Volume control');
		});

		test('uses label for aria-label if aria-label not provided', () => {
			const { container } = render(Slider, {
				props: { label: 'Brightness' }
			});
			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-label', 'Brightness');
		});

		test('has aria-describedby when provided', () => {
			const { container } = render(Slider, {
				props: { 'aria-describedby': 'volume-help' }
			});
			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-describedby', 'volume-help');
		});
	});

	describe('Range Slider Keyboard Navigation', () => {
		test('both thumbs can be focused independently', () => {
			const { container } = render(Slider, { props: { value: [25, 75] } });
			const thumbs = container.querySelectorAll('[role="slider"]');
			expect(thumbs).toHaveLength(2);
			expect(thumbs[0]).toHaveAttribute('tabindex', '0');
			expect(thumbs[1]).toHaveAttribute('tabindex', '0');
		});

		test('start thumb can be controlled with keyboard', async () => {
			const { container } = render(Slider, {
				props: {
					value: [25, 75],
					min: 0,
					max: 100,
					step: 1
				}
			});

			const thumbs = container.querySelectorAll('[role="slider"]');
			const startThumb = thumbs[0] as HTMLElement;
			startThumb.focus();
			await userEvent.keyboard('{ArrowRight}');
			// Check that start thumb value increased
			expect(startThumb.getAttribute('aria-valuenow')).toBe('26');
			// End thumb should be unchanged
			expect(thumbs[1].getAttribute('aria-valuenow')).toBe('75');
		});

		test('end thumb can be controlled with keyboard', async () => {
			const { container } = render(Slider, {
				props: {
					value: [25, 75],
					min: 0,
					max: 100,
					step: 1
				}
			});

			const thumbs = container.querySelectorAll('[role="slider"]');
			const endThumb = thumbs[1] as HTMLElement;
			endThumb.focus();
			await userEvent.keyboard('{ArrowRight}');
			// Start thumb should be unchanged
			expect(thumbs[0].getAttribute('aria-valuenow')).toBe('25');
			// Check that end thumb value increased
			expect(endThumb.getAttribute('aria-valuenow')).toBe('76');
		});
	});

	describe('Edge Cases', () => {
		test('handles negative min/max values', () => {
			const { container } = render(Slider, {
				props: { value: 0, min: -50, max: 50 }
			});
			const thumb = container.querySelector('.slider__thumb');
			expect(thumb).toHaveStyle({ left: '50%' });
		});

		test('handles fractional step values', () => {
			const { container } = render(Slider, {
				props: { value: 5.5, min: 0, max: 10, step: 0.5 }
			});
			const thumb = container.querySelector('[role="slider"]');
			expect(thumb).toHaveAttribute('aria-valuenow', '5.5');
		});

		test('handles very small ranges', () => {
			const { container } = render(Slider, {
				props: { value: 0.5, min: 0, max: 1, step: 0.1 }
			});
			const thumb = container.querySelector('.slider__thumb');
			expect(thumb).toHaveStyle({ left: '50%' });
		});
	});
});
