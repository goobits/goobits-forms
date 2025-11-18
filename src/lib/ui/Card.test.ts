/**
 * Comprehensive tests for Card component system
 *
 * Tests the Card, CardHeader, CardBody, and CardFooter components
 * including variants, props, slots, accessibility, and composition.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Card from './Card.svelte';
import CardHeader from './CardHeader.svelte';
import CardBody from './CardBody.svelte';
import CardFooter from './CardFooter.svelte';
import CardTestWrapper from './CardTestWrapper.svelte';

describe('Card Component', () => {
	describe('rendering', () => {
		test('renders as div by default', () => {
			const { container } = render(Card, {
				props: {
					children: () => 'Card content'
				}
			});

			const card = container.querySelector('.card');
			expect(card).toBeTruthy();
			expect(card?.tagName).toBe('DIV');
		});

		test('renders children content', () => {
			render(Card, {
				props: {
					children: () => 'Test content'
				}
			});

			expect(screen.getByText('Test content')).toBeTruthy();
		});

		test('renders as anchor when href is provided', () => {
			const { container } = render(Card, {
				props: {
					href: '/profile',
					children: () => 'Link card'
				}
			});

			const card = container.querySelector('.card');
			expect(card).toBeTruthy();
			expect(card?.tagName).toBe('A');
			expect(card?.getAttribute('href')).toBe('/profile');
		});
	});

	describe('variant prop', () => {
		test('applies elevated variant by default', () => {
			const { container } = render(Card);
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card--elevated')).toBe(true);
		});

		test('applies outlined variant', () => {
			const { container } = render(Card, {
				props: { variant: 'outlined' }
			});
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card--outlined')).toBe(true);
		});

		test('applies filled variant', () => {
			const { container } = render(Card, {
				props: { variant: 'filled' }
			});
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card--filled')).toBe(true);
		});

		test('only applies one variant at a time', () => {
			const { container } = render(Card, {
				props: { variant: 'outlined' }
			});
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card--outlined')).toBe(true);
			expect(card?.classList.contains('card--elevated')).toBe(false);
			expect(card?.classList.contains('card--filled')).toBe(false);
		});
	});

	describe('padding prop', () => {
		test('applies medium padding by default', () => {
			const { container } = render(Card);
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card--padding-md')).toBe(true);
		});

		test('applies small padding', () => {
			const { container } = render(Card, {
				props: { padding: 'sm' }
			});
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card--padding-sm')).toBe(true);
		});

		test('applies large padding', () => {
			const { container } = render(Card, {
				props: { padding: 'lg' }
			});
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card--padding-lg')).toBe(true);
		});

		test('applies no padding when set to none', () => {
			const { container } = render(Card, {
				props: { padding: 'none' }
			});
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card--padding-sm')).toBe(false);
			expect(card?.classList.contains('card--padding-md')).toBe(false);
			expect(card?.classList.contains('card--padding-lg')).toBe(false);
		});
	});

	describe('clickable prop', () => {
		test('does not apply clickable class by default', () => {
			const { container } = render(Card);
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card--clickable')).toBe(false);
		});

		test('applies clickable class when clickable is true', () => {
			const { container } = render(Card, {
				props: { clickable: true }
			});
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card--clickable')).toBe(true);
		});

		test('applies clickable class when href is provided', () => {
			const { container } = render(Card, {
				props: { href: '/test' }
			});
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card--clickable')).toBe(true);
		});
	});

	describe('custom class prop', () => {
		test('applies custom class names', () => {
			const { container } = render(Card, {
				props: { class: 'custom-class another-class' }
			});
			const card = container.querySelector('.card');
			expect(card?.classList.contains('custom-class')).toBe(true);
			expect(card?.classList.contains('another-class')).toBe(true);
		});

		test('preserves default classes with custom class', () => {
			const { container } = render(Card, {
				props: {
					variant: 'outlined',
					class: 'custom-class'
				}
			});
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card')).toBe(true);
			expect(card?.classList.contains('card--outlined')).toBe(true);
			expect(card?.classList.contains('custom-class')).toBe(true);
		});
	});

	describe('HTML attributes', () => {
		test('passes through additional attributes to div', () => {
			const { container } = render(Card, {
				props: {
					'data-testid': 'test-card',
					'aria-label': 'Test Card'
				} as any
			});
			const card = container.querySelector('.card');
			expect(card?.getAttribute('data-testid')).toBe('test-card');
			expect(card?.getAttribute('aria-label')).toBe('Test Card');
		});

		test('passes through additional attributes to anchor', () => {
			const { container } = render(Card, {
				props: {
					href: '/test',
					target: '_blank',
					rel: 'noopener'
				} as any
			});
			const card = container.querySelector('.card');
			expect(card?.getAttribute('target')).toBe('_blank');
			expect(card?.getAttribute('rel')).toBe('noopener');
		});
	});
});

describe('CardHeader Component', () => {
	describe('rendering', () => {
		test('renders with card__header class', () => {
			const { container } = render(CardHeader);
			const header = container.querySelector('.card__header');
			expect(header).toBeTruthy();
		});

		test('renders title', () => {
			render(CardHeader, {
				props: { title: 'Test Title' }
			});
			expect(screen.getByText('Test Title')).toBeTruthy();
		});

		test('renders subtitle', () => {
			render(CardHeader, {
				props: {
					title: 'Title',
					subtitle: 'Test Subtitle'
				}
			});
			expect(screen.getByText('Test Subtitle')).toBeTruthy();
		});

		test('renders title as h3 element', () => {
			const { container } = render(CardHeader, {
				props: { title: 'Test Title' }
			});
			const title = container.querySelector('.card__title');
			expect(title?.tagName).toBe('H3');
		});

		test('renders subtitle as p element', () => {
			const { container } = render(CardHeader, {
				props: {
					title: 'Title',
					subtitle: 'Subtitle'
				}
			});
			const subtitle = container.querySelector('.card__subtitle');
			expect(subtitle?.tagName).toBe('P');
		});
	});

	describe('title and subtitle props', () => {
		test('renders without subtitle', () => {
			const { container } = render(CardHeader, {
				props: { title: 'Only Title' }
			});
			expect(screen.getByText('Only Title')).toBeTruthy();
			expect(container.querySelector('.card__subtitle')).toBeFalsy();
		});

		test('does not render title/subtitle when children slot is used', () => {
			const { container } = render(CardHeader, {
				props: {
					title: 'Title',
					subtitle: 'Subtitle',
					children: () => 'Custom content'
				}
			});
			expect(screen.queryByText('Title')).toBeFalsy();
			expect(screen.queryByText('Subtitle')).toBeFalsy();
			expect(screen.getByText('Custom content')).toBeTruthy();
		});
	});

	describe('actions slot', () => {
		test('renders actions slot content', () => {
			render(CardHeader, {
				props: {
					title: 'Title',
					actions: () => 'Action Button'
				}
			});
			expect(screen.getByText('Action Button')).toBeTruthy();
		});

		test('renders actions in separate container', () => {
			const { container } = render(CardHeader, {
				props: {
					title: 'Title',
					actions: () => 'Actions'
				}
			});
			const actions = container.querySelector('.card__header-actions');
			expect(actions).toBeTruthy();
			expect(actions?.textContent).toContain('Actions');
		});

		test('renders actions alongside custom children', () => {
			const { container } = render(CardHeader, {
				props: {
					children: () => 'Custom',
					actions: () => 'Actions'
				}
			});
			expect(screen.getByText('Custom')).toBeTruthy();
			expect(screen.getByText('Actions')).toBeTruthy();
		});
	});

	describe('custom class prop', () => {
		test('applies custom class names', () => {
			const { container } = render(CardHeader, {
				props: { class: 'custom-header' }
			});
			const header = container.querySelector('.card__header');
			expect(header?.classList.contains('custom-header')).toBe(true);
		});
	});
});

describe('CardBody Component', () => {
	describe('rendering', () => {
		test('renders with card__body class', () => {
			const { container } = render(CardBody);
			const body = container.querySelector('.card__body');
			expect(body).toBeTruthy();
		});

		test('renders children content', () => {
			render(CardBody, {
				props: {
					children: () => 'Body content'
				}
			});
			expect(screen.getByText('Body content')).toBeTruthy();
		});
	});

	describe('padding prop', () => {
		test('applies medium padding by default', () => {
			const { container } = render(CardBody);
			const body = container.querySelector('.card__body');
			expect(body?.classList.contains('card__body--padding-md')).toBe(true);
		});

		test('applies small padding', () => {
			const { container } = render(CardBody, {
				props: { padding: 'sm' }
			});
			const body = container.querySelector('.card__body');
			expect(body?.classList.contains('card__body--padding-sm')).toBe(true);
		});

		test('applies large padding', () => {
			const { container } = render(CardBody, {
				props: { padding: 'lg' }
			});
			const body = container.querySelector('.card__body');
			expect(body?.classList.contains('card__body--padding-lg')).toBe(true);
		});

		test('applies no padding when set to none', () => {
			const { container } = render(CardBody, {
				props: { padding: 'none' }
			});
			const body = container.querySelector('.card__body');
			expect(body?.classList.contains('card__body--padding-sm')).toBe(false);
			expect(body?.classList.contains('card__body--padding-md')).toBe(false);
			expect(body?.classList.contains('card__body--padding-lg')).toBe(false);
		});
	});

	describe('custom class prop', () => {
		test('applies custom class names', () => {
			const { container } = render(CardBody, {
				props: { class: 'custom-body' }
			});
			const body = container.querySelector('.card__body');
			expect(body?.classList.contains('custom-body')).toBe(true);
		});
	});
});

describe('CardFooter Component', () => {
	describe('rendering', () => {
		test('renders with card__footer class', () => {
			const { container } = render(CardFooter);
			const footer = container.querySelector('.card__footer');
			expect(footer).toBeTruthy();
		});

		test('renders children content', () => {
			render(CardFooter, {
				props: {
					children: () => 'Footer content'
				}
			});
			expect(screen.getByText('Footer content')).toBeTruthy();
		});
	});

	describe('align prop', () => {
		test('applies left alignment by default', () => {
			const { container } = render(CardFooter);
			const footer = container.querySelector('.card__footer');
			expect(footer?.classList.contains('card__footer--align-left')).toBe(true);
		});

		test('applies center alignment', () => {
			const { container } = render(CardFooter, {
				props: { align: 'center' }
			});
			const footer = container.querySelector('.card__footer');
			expect(footer?.classList.contains('card__footer--align-center')).toBe(true);
		});

		test('applies right alignment', () => {
			const { container } = render(CardFooter, {
				props: { align: 'right' }
			});
			const footer = container.querySelector('.card__footer');
			expect(footer?.classList.contains('card__footer--align-right')).toBe(true);
		});
	});

	describe('custom class prop', () => {
		test('applies custom class names', () => {
			const { container } = render(CardFooter, {
				props: { class: 'custom-footer' }
			});
			const footer = container.querySelector('.card__footer');
			expect(footer?.classList.contains('custom-footer')).toBe(true);
		});
	});
});

describe('Card Composition', () => {
	describe('complete card structure', () => {
		test('renders card with header, body, and footer', async () => {
			const { container } = render(Card, {
				props: {
					children: () => {
						const header = document.createElement('div');
						header.className = 'card__header';
						header.textContent = 'Header';

						const body = document.createElement('div');
						body.className = 'card__body';
						body.textContent = 'Body';

						const footer = document.createElement('div');
						footer.className = 'card__footer';
						footer.textContent = 'Footer';

						const fragment = document.createDocumentFragment();
						fragment.appendChild(header);
						fragment.appendChild(body);
						fragment.appendChild(footer);
						return fragment;
					}
				}
			});

			expect(container.querySelector('.card__header')).toBeTruthy();
			expect(container.querySelector('.card__body')).toBeTruthy();
			expect(container.querySelector('.card__footer')).toBeTruthy();
		});
	});

	describe('variant combinations', () => {
		test('elevated card with all sub-components', () => {
			const { container } = render(Card, {
				props: {
					variant: 'elevated',
					children: () => 'Content'
				}
			});
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card--elevated')).toBe(true);
		});

		test('outlined clickable card', () => {
			const { container } = render(Card, {
				props: {
					variant: 'outlined',
					clickable: true
				}
			});
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card--outlined')).toBe(true);
			expect(card?.classList.contains('card--clickable')).toBe(true);
		});

		test('filled card with link', () => {
			const { container } = render(Card, {
				props: {
					variant: 'filled',
					href: '/link'
				}
			});
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card--filled')).toBe(true);
			expect(card?.classList.contains('card--clickable')).toBe(true);
			expect(card?.tagName).toBe('A');
		});
	});
});

describe('Accessibility', () => {
	describe('semantic HTML', () => {
		test('uses appropriate heading level in CardHeader', () => {
			const { container } = render(CardHeader, {
				props: { title: 'Title' }
			});
			const heading = container.querySelector('h3');
			expect(heading).toBeTruthy();
		});

		test('card is focusable when clickable', () => {
			const { container } = render(Card, {
				props: {
					clickable: true,
					tabindex: 0
				} as any
			});
			const card = container.querySelector('.card');
			expect(card?.getAttribute('tabindex')).toBe('0');
		});

		test('link card is naturally focusable', () => {
			const { container } = render(Card, {
				props: { href: '/test' }
			});
			const card = container.querySelector('a.card');
			expect(card).toBeTruthy();
			// Links are naturally focusable
		});
	});

	describe('ARIA attributes', () => {
		test('accepts aria-label on card', () => {
			const { container } = render(Card, {
				props: {
					'aria-label': 'User profile card'
				} as any
			});
			const card = container.querySelector('.card');
			expect(card?.getAttribute('aria-label')).toBe('User profile card');
		});

		test('accepts role attribute', () => {
			const { container } = render(Card, {
				props: {
					role: 'article'
				} as any
			});
			const card = container.querySelector('.card');
			expect(card?.getAttribute('role')).toBe('article');
		});
	});
});

describe('Edge Cases', () => {
	describe('empty content', () => {
		test('renders empty card', () => {
			const { container } = render(Card);
			const card = container.querySelector('.card');
			expect(card).toBeTruthy();
		});

		test('renders empty header', () => {
			const { container } = render(CardHeader);
			const header = container.querySelector('.card__header');
			expect(header).toBeTruthy();
		});

		test('renders empty body', () => {
			const { container } = render(CardBody);
			const body = container.querySelector('.card__body');
			expect(body).toBeTruthy();
		});

		test('renders empty footer', () => {
			const { container } = render(CardFooter);
			const footer = container.querySelector('.card__footer');
			expect(footer).toBeTruthy();
		});
	});

	describe('combined props', () => {
		test('handles all props together', () => {
			const { container } = render(Card, {
				props: {
					variant: 'outlined',
					padding: 'lg',
					clickable: true,
					class: 'custom',
					'data-testid': 'test'
				} as any
			});
			const card = container.querySelector('.card');
			expect(card?.classList.contains('card--outlined')).toBe(true);
			expect(card?.classList.contains('card--padding-lg')).toBe(true);
			expect(card?.classList.contains('card--clickable')).toBe(true);
			expect(card?.classList.contains('custom')).toBe(true);
			expect(card?.getAttribute('data-testid')).toBe('test');
		});
	});
});
