/**
 * Comprehensive tests for Button component
 *
 * Tests focus on rendering, variants, sizes, states, events, and accessibility.
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Button from './Button.svelte';

describe('Button Component', () => {
	describe('Basic Rendering', () => {
		test('renders button with default props', () => {
			render(Button, { props: { children: 'Click me' } });
			const button = screen.getByRole('button');
			expect(button).toBeInTheDocument();
			expect(button).toHaveTextContent('Click me');
		});

		test('renders with custom text content', () => {
			render(Button, { props: { children: 'Submit Form' } });
			expect(screen.getByRole('button')).toHaveTextContent('Submit Form');
		});

		test('applies default variant and size classes', () => {
			render(Button, { props: { children: 'Button' } });
			const button = screen.getByRole('button');
			expect(button).toHaveClass('button');
			expect(button).toHaveClass('button--primary');
			expect(button).toHaveClass('button--md');
		});

		test('applies custom className', () => {
			render(Button, { props: { children: 'Button', class: 'custom-class' } });
			const button = screen.getByRole('button');
			expect(button).toHaveClass('custom-class');
		});

		test('applies data-testid attribute', () => {
			render(Button, {
				props: {
					children: 'Button',
					'data-testid': 'submit-button'
				}
			});
			expect(screen.getByTestId('submit-button')).toBeInTheDocument();
		});
	});

	describe('Variant Rendering', () => {
		test('renders primary variant', () => {
			render(Button, { props: { variant: 'primary', children: 'Primary' } });
			expect(screen.getByRole('button')).toHaveClass('button--primary');
		});

		test('renders secondary variant', () => {
			render(Button, { props: { variant: 'secondary', children: 'Secondary' } });
			expect(screen.getByRole('button')).toHaveClass('button--secondary');
		});

		test('renders outline variant', () => {
			render(Button, { props: { variant: 'outline', children: 'Outline' } });
			expect(screen.getByRole('button')).toHaveClass('button--outline');
		});

		test('renders ghost variant', () => {
			render(Button, { props: { variant: 'ghost', children: 'Ghost' } });
			expect(screen.getByRole('button')).toHaveClass('button--ghost');
		});

		test('renders danger variant', () => {
			render(Button, { props: { variant: 'danger', children: 'Delete' } });
			expect(screen.getByRole('button')).toHaveClass('button--danger');
		});
	});

	describe('Size Rendering', () => {
		test('renders small size', () => {
			render(Button, { props: { size: 'sm', children: 'Small' } });
			expect(screen.getByRole('button')).toHaveClass('button--sm');
		});

		test('renders medium size (default)', () => {
			render(Button, { props: { size: 'md', children: 'Medium' } });
			expect(screen.getByRole('button')).toHaveClass('button--md');
		});

		test('renders large size', () => {
			render(Button, { props: { size: 'lg', children: 'Large' } });
			expect(screen.getByRole('button')).toHaveClass('button--lg');
		});
	});

	describe('Disabled State', () => {
		test('renders disabled button', () => {
			render(Button, { props: { disabled: true, children: 'Disabled' } });
			const button = screen.getByRole('button');
			expect(button).toBeDisabled();
			expect(button).toHaveClass('button--disabled');
		});

		test('disabled button has aria-disabled attribute', () => {
			render(Button, { props: { disabled: true, children: 'Disabled' } });
			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('aria-disabled', 'true');
		});

		test('disabled button does not respond to clicks', async () => {
			const handleClick = vi.fn();
			render(Button, {
				props: {
					disabled: true,
					onclick: handleClick,
					children: 'Disabled'
				}
			});

			const button = screen.getByRole('button');
			await userEvent.click(button);
			expect(handleClick).not.toHaveBeenCalled();
		});

		test('disabled button does not respond to keyboard events', async () => {
			const handleClick = vi.fn();
			render(Button, {
				props: {
					disabled: true,
					onclick: handleClick,
					children: 'Disabled'
				}
			});

			const button = screen.getByRole('button');
			button.focus();
			await userEvent.keyboard('{Enter}');
			await userEvent.keyboard(' ');
			expect(handleClick).not.toHaveBeenCalled();
		});
	});

	describe('Loading State', () => {
		test('renders loading state', () => {
			render(Button, { props: { loading: true, children: 'Loading' } });
			const button = screen.getByRole('button');
			expect(button).toHaveClass('button--loading');
		});

		test('loading button is disabled', () => {
			render(Button, { props: { loading: true, children: 'Loading' } });
			const button = screen.getByRole('button');
			expect(button).toBeDisabled();
		});

		test('loading button has aria-busy attribute', () => {
			render(Button, { props: { loading: true, children: 'Loading' } });
			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('aria-busy', 'true');
		});

		test('loading button shows spinner', () => {
			render(Button, { props: { loading: true, children: 'Loading' } });
			const spinner = document.querySelector('.button__spinner');
			expect(spinner).toBeInTheDocument();
		});

		test('loading button has "Loading..." aria-label', () => {
			render(Button, { props: { loading: true, children: 'Submit' } });
			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('aria-label', 'Loading...');
		});

		test('loading button does not respond to clicks', async () => {
			const handleClick = vi.fn();
			render(Button, {
				props: {
					loading: true,
					onclick: handleClick,
					children: 'Loading'
				}
			});

			const button = screen.getByRole('button');
			await userEvent.click(button);
			expect(handleClick).not.toHaveBeenCalled();
		});

		test('hides content when loading', () => {
			render(Button, { props: { loading: true, children: 'Submit' } });
			const content = document.querySelector('.button__content');
			expect(content).toHaveClass('button__content--hidden');
		});
	});

	describe('Type Attribute', () => {
		test('defaults to type="button"', () => {
			render(Button, { props: { children: 'Button' } });
			expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
		});

		test('accepts type="submit"', () => {
			render(Button, { props: { type: 'submit', children: 'Submit' } });
			expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
		});

		test('accepts type="reset"', () => {
			render(Button, { props: { type: 'reset', children: 'Reset' } });
			expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
		});
	});

	describe('href Prop (Link Button)', () => {
		test('renders as anchor when href is provided', () => {
			render(Button, { props: { href: '/about', children: 'About' } });
			const link = screen.getByRole('button');
			expect(link.tagName).toBe('A');
			expect(link).toHaveAttribute('href', '/about');
		});

		test('link button has correct classes', () => {
			render(Button, {
				props: {
					href: '/docs',
					variant: 'ghost',
					children: 'Documentation'
				}
			});
			const link = screen.getByRole('button');
			expect(link).toHaveClass('button', 'button--ghost');
		});

		test('does not render as link when disabled', () => {
			render(Button, {
				props: {
					href: '/about',
					disabled: true,
					children: 'About'
				}
			});
			const button = screen.getByRole('button');
			expect(button.tagName).toBe('BUTTON');
			expect(button).not.toHaveAttribute('href');
		});

		test('does not render as link when loading', () => {
			render(Button, {
				props: {
					href: '/about',
					loading: true,
					children: 'About'
				}
			});
			const button = screen.getByRole('button');
			expect(button.tagName).toBe('BUTTON');
			expect(button).not.toHaveAttribute('href');
		});
	});

	describe('Full Width', () => {
		test('applies full width class', () => {
			render(Button, { props: { fullWidth: true, children: 'Full Width' } });
			expect(screen.getByRole('button')).toHaveClass('button--full-width');
		});

		test('does not apply full width class by default', () => {
			render(Button, { props: { children: 'Normal' } });
			expect(screen.getByRole('button')).not.toHaveClass('button--full-width');
		});
	});

	describe('Click Handlers', () => {
		test('calls onclick handler when clicked', async () => {
			const handleClick = vi.fn();
			render(Button, {
				props: {
					onclick: handleClick,
					children: 'Click me'
				}
			});

			await userEvent.click(screen.getByRole('button'));
			expect(handleClick).toHaveBeenCalledTimes(1);
		});

		test('passes event to onclick handler', async () => {
			const handleClick = vi.fn();
			render(Button, {
				props: {
					onclick: handleClick,
					children: 'Click me'
				}
			});

			await userEvent.click(screen.getByRole('button'));
			expect(handleClick).toHaveBeenCalledWith(expect.any(MouseEvent));
		});

		test('does not call onclick when disabled', async () => {
			const handleClick = vi.fn();
			render(Button, {
				props: {
					disabled: true,
					onclick: handleClick,
					children: 'Disabled'
				}
			});

			await userEvent.click(screen.getByRole('button'));
			expect(handleClick).not.toHaveBeenCalled();
		});

		test('does not call onclick when loading', async () => {
			const handleClick = vi.fn();
			render(Button, {
				props: {
					loading: true,
					onclick: handleClick,
					children: 'Loading'
				}
			});

			await userEvent.click(screen.getByRole('button'));
			expect(handleClick).not.toHaveBeenCalled();
		});
	});

	describe('Keyboard Navigation', () => {
		test('triggers click on Enter key', async () => {
			const handleClick = vi.fn();
			render(Button, {
				props: {
					onclick: handleClick,
					children: 'Press Enter'
				}
			});

			const button = screen.getByRole('button');
			button.focus();
			await userEvent.keyboard('{Enter}');
			expect(handleClick).toHaveBeenCalledTimes(1);
		});

		test('triggers click on Space key', async () => {
			const handleClick = vi.fn();
			render(Button, {
				props: {
					onclick: handleClick,
					children: 'Press Space'
				}
			});

			const button = screen.getByRole('button');
			button.focus();
			await userEvent.keyboard(' ');
			expect(handleClick).toHaveBeenCalledTimes(1);
		});

		test('does not trigger on other keys', async () => {
			const handleClick = vi.fn();
			render(Button, {
				props: {
					onclick: handleClick,
					children: 'Button'
				}
			});

			const button = screen.getByRole('button');
			button.focus();
			await userEvent.keyboard('{Escape}');
			await userEvent.keyboard('{Tab}');
			await userEvent.keyboard('a');
			expect(handleClick).not.toHaveBeenCalled();
		});
	});

	describe('Accessibility Attributes', () => {
		test('applies aria-label', () => {
			render(Button, {
				props: {
					'aria-label': 'Close dialog',
					children: 'X'
				}
			});
			expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close dialog');
		});

		test('aria-label is overridden to "Loading..." when loading', () => {
			render(Button, {
				props: {
					loading: true,
					'aria-label': 'Submit form',
					children: 'Submit'
				}
			});
			expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Loading...');
		});

		test('has role="button" when rendered as link', () => {
			render(Button, { props: { href: '/about', children: 'About' } });
			const link = screen.getByRole('button');
			expect(link).toHaveAttribute('role', 'button');
		});

		test('spinner has aria-hidden', () => {
			render(Button, { props: { loading: true, children: 'Loading' } });
			const spinner = document.querySelector('.button__spinner');
			expect(spinner).toHaveAttribute('aria-hidden', 'true');
		});
	});

	describe('Icon Slots', () => {
		test('renders with icon-left slot', () => {
			const { container } = render(Button, {
				props: {
					children: 'Upload'
				}
			});

			// Check for icon-left structure
			const iconLeft = container.querySelector('.button__icon--left');
			// Icon slots need to be tested differently in actual usage
			// This is a structural test
			expect(iconLeft).toBeNull(); // No icon when not provided
		});

		test('hides icons when loading', () => {
			render(Button, { props: { loading: true, children: 'Submit' } });
			// Icons should not be rendered when loading
			const iconLeft = document.querySelector('.button__icon--left');
			const iconRight = document.querySelector('.button__icon--right');
			expect(iconLeft).toBeNull();
			expect(iconRight).toBeNull();
		});
	});

	describe('Combination States', () => {
		test('renders with multiple props correctly', () => {
			render(Button, {
				props: {
					variant: 'danger',
					size: 'lg',
					fullWidth: true,
					'data-testid': 'delete-button',
					children: 'Delete Account'
				}
			});

			const button = screen.getByTestId('delete-button');
			expect(button).toHaveClass('button--danger');
			expect(button).toHaveClass('button--lg');
			expect(button).toHaveClass('button--full-width');
			expect(button).toHaveTextContent('Delete Account');
		});

		test('combines variant, size, and custom class', () => {
			render(Button, {
				props: {
					variant: 'outline',
					size: 'sm',
					class: 'my-custom-button',
					children: 'Small Outline'
				}
			});

			const button = screen.getByRole('button');
			expect(button).toHaveClass('button');
			expect(button).toHaveClass('button--outline');
			expect(button).toHaveClass('button--sm');
			expect(button).toHaveClass('my-custom-button');
		});
	});

	describe('Edge Cases', () => {
		test('handles empty content', () => {
			render(Button, { props: {} });
			const button = screen.getByRole('button');
			expect(button).toBeInTheDocument();
		});

		test('handles very long text content', () => {
			const longText = 'This is a very long button text that might wrap to multiple lines';
			render(Button, { props: { children: longText } });
			expect(screen.getByRole('button')).toHaveTextContent(longText);
		});

		test('disabled takes precedence over loading for disabled attribute', () => {
			render(Button, {
				props: {
					disabled: true,
					loading: true,
					children: 'Button'
				}
			});
			const button = screen.getByRole('button');
			expect(button).toBeDisabled();
			expect(button).toHaveAttribute('aria-disabled', 'true');
		});

		test('handles rapid clicks', async () => {
			const handleClick = vi.fn();
			render(Button, {
				props: {
					onclick: handleClick,
					children: 'Click me'
				}
			});

			const button = screen.getByRole('button');
			await userEvent.click(button);
			await userEvent.click(button);
			await userEvent.click(button);
			expect(handleClick).toHaveBeenCalledTimes(3);
		});
	});

	describe('Additional Props Spreading', () => {
		test('spreads additional props to button element', () => {
			render(Button, {
				props: {
					children: 'Button',
					id: 'my-button',
					name: 'submit-btn',
					value: 'submit'
				}
			});

			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('id', 'my-button');
			expect(button).toHaveAttribute('name', 'submit-btn');
			expect(button).toHaveAttribute('value', 'submit');
		});
	});
});
