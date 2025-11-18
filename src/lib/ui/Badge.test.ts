/**
 * Comprehensive tests for Badge component
 *
 * Tests focus on rendering, variants, sizes, events, slots, and accessibility.
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Badge from './Badge.svelte';

describe('Badge', () => {
	describe('basic rendering', () => {
		test('renders with default props', () => {
			render(Badge, { props: { children: 'Test Badge' } });
			const badge = screen.getByText('Test Badge');
			expect(badge).toBeInTheDocument();
		});

		test('renders with custom text content', () => {
			render(Badge, { props: { children: 'Custom Badge' } });
			expect(screen.getByText('Custom Badge')).toBeInTheDocument();
		});

		test('applies default classes', () => {
			render(Badge, { props: { children: 'Test' } });
			const badge = screen.getByRole('status');
			expect(badge).toHaveClass('badge');
			expect(badge).toHaveClass('badge--primary');
			expect(badge).toHaveClass('badge--md');
		});

		test('renders with data-testid', () => {
			render(Badge, { props: { children: 'Test', 'data-testid': 'my-badge' } });
			expect(screen.getByTestId('my-badge')).toBeInTheDocument();
		});
	});

	describe('variant prop', () => {
		test.each(['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const)(
			'renders %s variant',
			(variant) => {
				render(Badge, { props: { children: variant, variant } });
				const badge = screen.getByRole('status');
				expect(badge).toHaveClass(`badge--${variant}`);
			}
		);
	});

	describe('size prop', () => {
		test.each(['sm', 'md', 'lg'] as const)('renders %s size', (size) => {
			render(Badge, { props: { children: size, size } });
			const badge = screen.getByRole('status');
			expect(badge).toHaveClass(`badge--${size}`);
		});
	});

	describe('outlined prop', () => {
		test('renders outlined badge', () => {
			render(Badge, { props: { children: 'Outlined', outlined: true } });
			const badge = screen.getByRole('status');
			expect(badge).toHaveClass('badge--outlined');
		});

		test('renders filled badge by default', () => {
			render(Badge, { props: { children: 'Filled' } });
			const badge = screen.getByRole('status');
			expect(badge).not.toHaveClass('badge--outlined');
		});

		test('outlined works with different variants', () => {
			render(Badge, {
				props: { children: 'Success Outlined', variant: 'success', outlined: true }
			});
			const badge = screen.getByRole('status');
			expect(badge).toHaveClass('badge--success');
			expect(badge).toHaveClass('badge--outlined');
		});
	});

	describe('pill prop', () => {
		test('renders pill shape', () => {
			render(Badge, { props: { children: 'Pill', pill: true } });
			const badge = screen.getByRole('status');
			expect(badge).toHaveClass('badge--pill');
		});

		test('renders default rounded shape', () => {
			render(Badge, { props: { children: 'Default' } });
			const badge = screen.getByRole('status');
			expect(badge).not.toHaveClass('badge--pill');
		});

		test('pill shape works with all sizes', () => {
			const { rerender } = render(Badge, {
				props: { children: 'Pill Small', pill: true, size: 'sm' }
			});
			let badge = screen.getByRole('status');
			expect(badge).toHaveClass('badge--pill');
			expect(badge).toHaveClass('badge--sm');

			rerender({ children: 'Pill Large', pill: true, size: 'lg' });
			badge = screen.getByRole('status');
			expect(badge).toHaveClass('badge--pill');
			expect(badge).toHaveClass('badge--lg');
		});
	});

	describe('dot prop', () => {
		test('renders status dot indicator', () => {
			render(Badge, { props: { children: 'With Dot', dot: true } });
			const badge = screen.getByRole('status');
			expect(badge).toHaveClass('badge--with-dot');
			const dot = badge.querySelector('.badge__dot');
			expect(dot).toBeInTheDocument();
		});

		test('does not render dot by default', () => {
			render(Badge, { props: { children: 'Without Dot' } });
			const badge = screen.getByRole('status');
			expect(badge).not.toHaveClass('badge--with-dot');
			const dot = badge.querySelector('.badge__dot');
			expect(dot).not.toBeInTheDocument();
		});

		test('dot has aria-hidden attribute', () => {
			render(Badge, { props: { children: 'Dot', dot: true } });
			const badge = screen.getByRole('status');
			const dot = badge.querySelector('.badge__dot');
			expect(dot).toHaveAttribute('aria-hidden', 'true');
		});
	});

	describe('dismissible prop', () => {
		test('renders dismiss button when dismissible', () => {
			render(Badge, { props: { children: 'Dismissible', dismissible: true } });
			const badge = screen.getByRole('status');
			expect(badge).toHaveClass('badge--dismissible');
			const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
			expect(dismissButton).toBeInTheDocument();
		});

		test('does not render dismiss button by default', () => {
			render(Badge, { props: { children: 'Not Dismissible' } });
			const badge = screen.getByRole('status');
			expect(badge).not.toHaveClass('badge--dismissible');
			expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
		});

		test('dismiss button has correct ARIA attributes', () => {
			render(Badge, { props: { children: 'Dismissible', dismissible: true } });
			const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
			expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss');
			expect(dismissButton).toHaveAttribute('type', 'button');
		});

		test('dismiss button is keyboard accessible', () => {
			render(Badge, { props: { children: 'Dismissible', dismissible: true } });
			const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
			expect(dismissButton).toHaveAttribute('tabindex', '0');
		});
	});

	describe('custom className', () => {
		test('applies custom class names', () => {
			render(Badge, { props: { children: 'Custom', class: 'custom-class' } });
			const badge = screen.getByRole('status');
			expect(badge).toHaveClass('custom-class');
			expect(badge).toHaveClass('badge');
		});

		test('applies multiple custom classes', () => {
			render(Badge, { props: { children: 'Custom', class: 'class-one class-two' } });
			const badge = screen.getByRole('status');
			expect(badge).toHaveClass('class-one');
			expect(badge).toHaveClass('class-two');
		});
	});

	describe('events', () => {
		test('fires dismiss event when dismiss button clicked', async () => {
			const user = userEvent.setup();
			const handleDismiss = vi.fn();

			render(Badge, {
				props: { children: 'Dismissible', dismissible: true, ondismiss: handleDismiss }
			});

			const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
			await user.click(dismissButton);

			expect(handleDismiss).toHaveBeenCalledTimes(1);
		});

		test('fires click event when non-dismissible badge clicked', async () => {
			const user = userEvent.setup();
			const handleClick = vi.fn();

			render(Badge, {
				props: { children: 'Clickable', onclick: handleClick }
			});

			const badge = screen.getByRole('status');
			await user.click(badge);

			expect(handleClick).toHaveBeenCalledTimes(1);
		});

		test('does not fire click event when dismissible badge clicked', async () => {
			const user = userEvent.setup();
			const handleClick = vi.fn();

			render(Badge, {
				props: { children: 'Dismissible', dismissible: true, onclick: handleClick }
			});

			const badge = screen.getByRole('status');
			await user.click(badge);

			expect(handleClick).not.toHaveBeenCalled();
		});

		test('dismiss event does not propagate to parent', async () => {
			const user = userEvent.setup();
			const handleDismiss = vi.fn();
			const handleBadgeClick = vi.fn();

			render(Badge, {
				props: {
					children: 'Dismissible',
					dismissible: true,
					ondismiss: handleDismiss,
					onclick: handleBadgeClick
				}
			});

			const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
			await user.click(dismissButton);

			expect(handleDismiss).toHaveBeenCalledTimes(1);
			expect(handleBadgeClick).not.toHaveBeenCalled();
		});
	});

	describe('accessibility', () => {
		test('has role="status"', () => {
			render(Badge, { props: { children: 'Status' } });
			expect(screen.getByRole('status')).toBeInTheDocument();
		});

		test('dismiss button has accessible label', () => {
			render(Badge, { props: { children: 'Dismissible', dismissible: true } });
			const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
			expect(dismissButton).toHaveAccessibleName('Dismiss');
		});

		test('dot indicator is hidden from screen readers', () => {
			render(Badge, { props: { children: 'With Dot', dot: true } });
			const badge = screen.getByRole('status');
			const dot = badge.querySelector('.badge__dot');
			expect(dot).toHaveAttribute('aria-hidden', 'true');
		});

		test('dismiss button SVG is hidden from screen readers', () => {
			render(Badge, { props: { children: 'Dismissible', dismissible: true } });
			const badge = screen.getByRole('status');
			const svg = badge.querySelector('svg');
			expect(svg).toHaveAttribute('aria-hidden', 'true');
		});
	});

	describe('combination of props', () => {
		test('renders all props combined', () => {
			render(Badge, {
				props: {
					children: 'Complete',
					variant: 'success',
					size: 'lg',
					outlined: true,
					pill: true,
					dot: true,
					dismissible: true,
					class: 'custom-badge'
				}
			});

			const badge = screen.getByRole('status');
			expect(badge).toHaveClass('badge');
			expect(badge).toHaveClass('badge--success');
			expect(badge).toHaveClass('badge--lg');
			expect(badge).toHaveClass('badge--outlined');
			expect(badge).toHaveClass('badge--pill');
			expect(badge).toHaveClass('badge--with-dot');
			expect(badge).toHaveClass('badge--dismissible');
			expect(badge).toHaveClass('custom-badge');
			expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
		});

		test('renders outlined pill with dot', () => {
			render(Badge, {
				props: {
					children: 'Combo',
					variant: 'warning',
					outlined: true,
					pill: true,
					dot: true
				}
			});

			const badge = screen.getByRole('status');
			expect(badge).toHaveClass('badge--warning');
			expect(badge).toHaveClass('badge--outlined');
			expect(badge).toHaveClass('badge--pill');
			expect(badge).toHaveClass('badge--with-dot');
		});

		test('renders small dismissible badge', () => {
			render(Badge, {
				props: {
					children: 'Small Dismiss',
					size: 'sm',
					dismissible: true,
					variant: 'error'
				}
			});

			const badge = screen.getByRole('status');
			expect(badge).toHaveClass('badge--sm');
			expect(badge).toHaveClass('badge--error');
			expect(badge).toHaveClass('badge--dismissible');
			expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
		});
	});

	describe('content rendering', () => {
		test('renders text content', () => {
			render(Badge, { props: { children: 'Text Content' } });
			expect(screen.getByText('Text Content')).toBeInTheDocument();
		});

		test('renders with numeric content', () => {
			render(Badge, { props: { children: '42' } });
			expect(screen.getByText('42')).toBeInTheDocument();
		});

		test('renders with long text content', () => {
			const longText = 'This is a very long badge text that might wrap';
			render(Badge, { props: { children: longText } });
			expect(screen.getByText(longText)).toBeInTheDocument();
		});
	});

	describe('edge cases', () => {
		test('handles empty content', () => {
			render(Badge, { props: { children: '' } });
			const badge = screen.getByRole('status');
			expect(badge).toBeInTheDocument();
		});

		test('handles whitespace-only content', () => {
			render(Badge, { props: { children: '   ' } });
			const badge = screen.getByRole('status');
			expect(badge).toBeInTheDocument();
		});

		test('handles special characters in content', () => {
			render(Badge, { props: { children: '<>&"\'test' } });
			expect(screen.getByText('<>&"\'test')).toBeInTheDocument();
		});
	});


	describe('dismiss button interactions', () => {
		test('dismiss button can be focused', async () => {
			const user = userEvent.setup();
			render(Badge, { props: { children: 'Focus Test', dismissible: true } });

			const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
			await user.tab();

			// The button should be focusable
			expect(dismissButton).toHaveAttribute('tabindex', '0');
		});

		test('multiple dismiss button clicks fire multiple events', async () => {
			const user = userEvent.setup();
			const handleDismiss = vi.fn();

			render(Badge, {
				props: { children: 'Multiple', dismissible: true, ondismiss: handleDismiss }
			});

			const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
			await user.click(dismissButton);
			await user.click(dismissButton);
			await user.click(dismissButton);

			expect(handleDismiss).toHaveBeenCalledTimes(3);
		});
	});

	describe('structural elements', () => {
		test('badge content is wrapped in badge__content', () => {
			render(Badge, { props: { children: 'Content' } });
			const badge = screen.getByRole('status');
			const contentWrapper = badge.querySelector('.badge__content');
			expect(contentWrapper).toBeInTheDocument();
			expect(contentWrapper).toHaveTextContent('Content');
		});

		test('dismiss button has correct class', () => {
			render(Badge, { props: { children: 'Test', dismissible: true } });
			const badge = screen.getByRole('status');
			const dismissButton = badge.querySelector('.badge__dismiss');
			expect(dismissButton).toBeInTheDocument();
		});

		test('dot has correct class', () => {
			render(Badge, { props: { children: 'Test', dot: true } });
			const badge = screen.getByRole('status');
			const dot = badge.querySelector('.badge__dot');
			expect(dot).toBeInTheDocument();
			expect(dot).toHaveClass('badge__dot');
		});
	});
});
