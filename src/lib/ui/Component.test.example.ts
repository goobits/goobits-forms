/**
 * Example Component Test Template
 *
 * This file demonstrates best practices for testing Svelte components
 * using Vitest and Testing Library.
 *
 * Copy this template when creating new component tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from './test-utils';
import userEvent from '@testing-library/user-event';
// import YourComponent from './YourComponent.svelte';

/**
 * Example 1: Basic Component Rendering
 *
 * Test that a component renders correctly with default props
 */
describe('BasicComponent', () => {
	it('renders with default props', () => {
		// Uncomment and replace with your component
		// render(BasicComponent, { props: { text: 'Hello World' } });
		// expect(screen.getByText('Hello World')).toBeInTheDocument();
	});

	it('renders with custom props', () => {
		// render(BasicComponent, {
		// 	props: {
		// 		text: 'Custom Text',
		// 		variant: 'primary'
		// 	}
		// });
		// expect(screen.getByText('Custom Text')).toBeInTheDocument();
	});

	it('applies correct CSS classes', () => {
		// render(BasicComponent, { props: { variant: 'primary' } });
		// const element = screen.getByRole('button');
		// expect(element).toHaveClass('btn-primary');
	});
});

/**
 * Example 2: User Interactions
 *
 * Test component behavior with user events
 */
describe('InteractiveComponent', () => {
	it('handles click events', async () => {
		const handleClick = vi.fn();

		// render(Button, {
		// 	props: {
		// 		onClick: handleClick
		// 	}
		// });

		// const button = screen.getByRole('button');
		// await userEvent.click(button);

		// expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('handles keyboard navigation', async () => {
		// render(Menu, { props: { items: ['Item 1', 'Item 2', 'Item 3'] } });

		// const menu = screen.getByRole('menu');
		// await userEvent.type(menu, '{ArrowDown}');

		// const firstItem = screen.getByText('Item 1');
		// expect(firstItem).toHaveFocus();
	});

	it('handles text input', async () => {
		// render(Input, { props: { label: 'Username' } });

		// const input = screen.getByLabelText('Username');
		// await userEvent.type(input, 'john.doe');

		// expect(input).toHaveValue('john.doe');
	});

	it('toggles state on click', async () => {
		// render(ToggleSwitch, { props: { label: 'Enable notifications' } });

		// const toggle = screen.getByRole('switch');
		// expect(toggle).not.toBeChecked();

		// await userEvent.click(toggle);
		// expect(toggle).toBeChecked();
	});
});

/**
 * Example 3: Form Validation
 *
 * Test form components with validation logic
 */
describe('FormComponent', () => {
	it('displays validation errors for invalid input', async () => {
		// render(ContactForm);

		// const emailInput = screen.getByLabelText('Email');
		// await userEvent.type(emailInput, 'invalid-email');
		// await userEvent.tab(); // Trigger blur event

		// await waitFor(() => {
		// 	expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
		// });
	});

	it('submits form with valid data', async () => {
		const handleSubmit = vi.fn();

		// render(ContactForm, {
		// 	props: {
		// 		onSubmit: handleSubmit
		// 	}
		// });

		// await userEvent.type(screen.getByLabelText('Name'), 'John Doe');
		// await userEvent.type(screen.getByLabelText('Email'), 'john@example.com');
		// await userEvent.click(screen.getByRole('button', { name: /submit/i }));

		// await waitFor(() => {
		// 	expect(handleSubmit).toHaveBeenCalledWith({
		// 		name: 'John Doe',
		// 		email: 'john@example.com'
		// 	});
		// });
	});

	it('prevents submission with invalid data', async () => {
		const handleSubmit = vi.fn();

		// render(ContactForm, {
		// 	props: {
		// 		onSubmit: handleSubmit
		// 	}
		// });

		// await userEvent.click(screen.getByRole('button', { name: /submit/i }));

		// expect(handleSubmit).not.toHaveBeenCalled();
		// expect(screen.getByText(/required/i)).toBeInTheDocument();
	});
});

/**
 * Example 4: Async Operations
 *
 * Test components with async data fetching or operations
 */
describe('AsyncComponent', () => {
	beforeEach(() => {
		// Reset fetch mock before each test
		vi.clearAllMocks();
	});

	it('displays loading state while fetching data', async () => {
		// Mock a delayed API response
		// global.fetch = vi.fn(() =>
		// 	new Promise(resolve =>
		// 		setTimeout(() =>
		// 			resolve({
		// 				ok: true,
		// 				json: async () => ({ data: [] })
		// 			}),
		// 			100
		// 		)
		// 	)
		// );

		// render(DataList);

		// expect(screen.getByText(/loading/i)).toBeInTheDocument();

		// await waitFor(() => {
		// 	expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
		// });
	});

	it('displays error message on fetch failure', async () => {
		// global.fetch = vi.fn(() =>
		// 	Promise.reject(new Error('Network error'))
		// );

		// render(DataList);

		// await waitFor(() => {
		// 	expect(screen.getByText(/error/i)).toBeInTheDocument();
		// });
	});

	it('displays fetched data', async () => {
		// global.fetch = vi.fn(() =>
		// 	Promise.resolve({
		// 		ok: true,
		// 		json: async () => ({ items: ['Item 1', 'Item 2'] })
		// 	})
		// );

		// render(DataList);

		// await waitFor(() => {
		// 	expect(screen.getByText('Item 1')).toBeInTheDocument();
		// 	expect(screen.getByText('Item 2')).toBeInTheDocument();
		// });
	});
});

/**
 * Example 5: Accessibility Testing
 *
 * Test components for accessibility compliance
 */
describe('AccessibleComponent', () => {
	it('has accessible name', () => {
		// render(Button, { props: { label: 'Submit' } });
		// const button = screen.getByRole('button');
		// expect(button).toHaveAccessibleName('Submit');
	});

	it('has correct ARIA attributes', () => {
		// render(Modal, {
		// 	props: {
		// 		isOpen: true,
		// 		title: 'Confirm Action'
		// 	}
		// });

		// const dialog = screen.getByRole('dialog');
		// expect(dialog).toHaveAttribute('aria-modal', 'true');
		// expect(dialog).toHaveAttribute('aria-labelledby');
	});

	it('supports keyboard navigation', async () => {
		// render(Menu, { props: { items: ['Item 1', 'Item 2'] } });

		// const menu = screen.getByRole('menu');
		// await userEvent.type(menu, '{ArrowDown}');

		// const firstItem = screen.getByText('Item 1');
		// expect(firstItem).toHaveFocus();

		// await userEvent.type(menu, '{ArrowDown}');
		// const secondItem = screen.getByText('Item 2');
		// expect(secondItem).toHaveFocus();
	});

	it('announces changes to screen readers', () => {
		// render(Alert, { props: { message: 'Success!' } });

		// const alert = screen.getByRole('alert');
		// expect(alert).toBeInTheDocument();
		// expect(alert).toHaveTextContent('Success!');
	});

	it('has sufficient color contrast', () => {
		// This would typically require additional tools like axe-core
		// render(Button, { props: { variant: 'primary' } });
		// const button = screen.getByRole('button');

		// Manual verification or integration with axe-core would go here
	});
});

/**
 * Example 6: Component with Context/Stores
 *
 * Test components that use Svelte context or stores
 */
describe('ComponentWithContext', () => {
	it('uses context values', () => {
		// If your component uses context, you may need to provide it:
		// const contextValue = { theme: 'dark' };

		// render(ThemedComponent, {
		// 	context: new Map([['theme', contextValue]])
		// });

		// expect(screen.getByTestId('theme-indicator')).toHaveTextContent('dark');
	});

	it('updates when store value changes', async () => {
		// import { writable } from 'svelte/store';
		// const count = writable(0);

		// render(Counter, { props: { store: count } });

		// expect(screen.getByText('Count: 0')).toBeInTheDocument();

		// count.set(5);
		// await waitFor(() => {
		// 	expect(screen.getByText('Count: 5')).toBeInTheDocument();
		// });
	});
});

/**
 * Example 7: Snapshot Testing (Optional)
 *
 * Use snapshot testing for components with stable output
 */
describe('SnapshotTest', () => {
	it('matches snapshot', () => {
		// const { container } = render(StaticComponent, {
		// 	props: { title: 'Test' }
		// });

		// expect(container.firstChild).toMatchSnapshot();
	});
});

/**
 * Testing Tips:
 *
 * 1. Query Priority (prefer in order):
 *    - getByRole (most accessible)
 *    - getByLabelText
 *    - getByPlaceholderText
 *    - getByText
 *    - getByTestId (last resort)
 *
 * 2. User Events:
 *    - Always use userEvent instead of fireEvent for user interactions
 *    - Use await with userEvent methods
 *
 * 3. Async Testing:
 *    - Use waitFor for async updates
 *    - Use findBy queries for elements that appear asynchronously
 *
 * 4. Accessibility:
 *    - Always test with screen readers in mind
 *    - Use semantic HTML and ARIA attributes
 *    - Test keyboard navigation
 *
 * 5. Mocking:
 *    - Mock external dependencies (fetch, localStorage, etc.)
 *    - Use vi.fn() for callbacks
 *    - Clear mocks between tests
 *
 * 6. Coverage:
 *    - Aim for 80%+ coverage for UI components
 *    - Focus on user-facing functionality
 *    - Don't test implementation details
 */
