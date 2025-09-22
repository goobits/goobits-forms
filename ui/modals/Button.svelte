<script lang="ts">
  /**
   * Modal Button Component
   *
   * A sophisticated button component for use in modal footers.
   * Follows the PromptForm button pattern.
   */

  type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  type ButtonSize = 'sm' | 'md' | 'lg';

  type ButtonProps = {
    /**
     * Button variant
     */
    variant?: ButtonVariant;

    /**
     * Button size
     */
    size?: ButtonSize;

    /**
     * Whether the button is disabled
     */
    disabled?: boolean;

    /**
     * Whether the button is loading
     */
    loading?: boolean;

    /**
     * Additional CSS class names
     */
    class?: string;

    /**
     * Click handler
     */
    onclick?: (event: MouseEvent) => void;

    /**
     * Button content
     */
    children?: import('svelte').Snippet;
  } & Omit<svelte.JSX.HTMLButtonAttributes, 'class' | 'onclick'>;

  const {
    variant = 'secondary',
    size = 'md',
    disabled = false,
    loading = false,
    class: className = '',
    onclick,
    children,
    ...restProps
  }: ButtonProps = $props();

  const buttonClasses = $derived([
    'modal-button',
    `modal-button--${variant}`,
    `modal-button--${size}`,
    loading && 'modal-button--loading',
    className
  ].filter(Boolean).join(' '));

  const isDisabled = $derived(disabled || loading);
</script>

<button
  class={buttonClasses}
  disabled={isDisabled}
  {onclick}
  {...restProps}
>
  {#if loading}
    <span class="modal-button__spinner"></span>
  {/if}
  {@render children?.()}
</button>

<style>
  /**
   * Modal Button Styles
   * Based on PromptForm's sophisticated button design
   */

  .modal-button {
    border-radius: var(--radius-lg);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-fast) ease;
    border: 1px solid transparent;
    outline: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    position: relative;
  }

  /* Size variants */
  .modal-button--sm {
    padding: 0.375rem var(--space-4);
    font-size: var(--font-size-sm);
  }

  .modal-button--md {
    padding: 0.625rem var(--space-6);
    font-size: var(--font-size-sm);
  }

  .modal-button--lg {
    padding: var(--space-3) var(--space-8);
    font-size: var(--font-size-base);
  }

  /* Primary variant */
  .modal-button--primary {
    background: var(--color-primary-500);
    color: white;
  }

  .modal-button--primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
  }

  .modal-button--primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Secondary variant */
  .modal-button--secondary {
    background: var(--color-background-secondary);
    color: var(--color-text-primary);
    border-color: var(--color-border);
  }

  .modal-button--secondary:hover:not(:disabled) {
    background: var(--color-background-tertiary);
    border-color: var(--color-border-strong);
  }

  .modal-button--secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Ghost variant */
  .modal-button--ghost {
    background: transparent;
    color: var(--color-text-secondary);
  }

  .modal-button--ghost:hover:not(:disabled) {
    background: var(--color-background-secondary);
    color: var(--color-text-primary);
  }

  .modal-button--ghost:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Danger variant */
  .modal-button--danger {
    background: var(--color-danger-500);
    color: white;
  }

  .modal-button--danger:hover:not(:disabled) {
    background: var(--color-danger-600);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
  }

  .modal-button--danger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Success variant */
  .modal-button--success {
    background: var(--color-success-500);
    color: white;
  }

  .modal-button--success:hover:not(:disabled) {
    background: var(--color-success-600);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
  }

  .modal-button--success:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Loading state */
  .modal-button--loading {
    color: transparent;
  }

  .modal-button__spinner {
    position: absolute;
    width: 1rem;
    height: 1rem;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Focus styles */
  .modal-button:focus-visible {
    box-shadow: 0 0 0 2px var(--color-primary-500);
  }

  /* Dark theme adjustments */
  :global(.theme-dark) .modal-button--secondary,
  :global(.theme-system-dark) .modal-button--secondary {
    background: var(--color-gray-800);
    border-color: var(--color-gray-600);
  }

  :global(.theme-dark) .modal-button--secondary:hover:not(:disabled),
  :global(.theme-system-dark) .modal-button--secondary:hover:not(:disabled) {
    background: var(--color-gray-700);
    border-color: var(--color-gray-500);
  }

  :global(.theme-dark) .modal-button--ghost:hover:not(:disabled),
  :global(.theme-system-dark) .modal-button--ghost:hover:not(:disabled) {
    background: var(--color-gray-800);
  }
</style>