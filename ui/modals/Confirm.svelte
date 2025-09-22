<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { AlertTriangle } from '@lucide/svelte';
  import Modal from './Modal.svelte';
  import Footer from './Footer.svelte';
  import Button from './Button.svelte';

  interface Props {
    isVisible?: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'primary' | 'danger' | 'warning';
    cancelButton?: import('svelte').Snippet<[{ handleClose: () => void; cancelText: string }]>;
    confirmButton?: import('svelte').Snippet<[{ handleConfirm: () => void; confirmText: string; confirmVariant: string }]>;
  }

  const {
    isVisible = false,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'primary',
    cancelButton,
    confirmButton
  }: Props = $props();

  const dispatch = createEventDispatcher<{
    close: void;
    confirm: void;
  }>();

  function handleClose() {
    dispatch('close');
  }

  function handleConfirm() {
    dispatch('confirm');
  }
</script>

<Modal 
  {isVisible} 
  onClose={handleClose} 
  {title}
  size="sm"
  showCloseButton={false}
>
  <!-- Content -->
  <div class="confirmation-modal__content">
    <div class="confirmation-modal__header">
      <div class="confirmation-modal__icon">
        <AlertTriangle class="confirmation-modal__icon-svg" />
      </div>
      <p class="confirmation-modal__message">
        {message}
      </p>
    </div>
  </div>

  <!-- Footer with actions -->
  <Footer variant="compact">
    {#snippet actions()}
      {#if cancelButton}
        {@render cancelButton({ handleClose, cancelText })}
      {:else}
        <Button variant="ghost" onclick={handleClose}>
          {cancelText}
        </Button>
      {/if}
      {#if confirmButton}
        {@render confirmButton({ handleConfirm, confirmText, confirmVariant })}
      {:else}
        <Button variant={confirmVariant} onclick={handleConfirm}>
          {confirmText}
        </Button>
      {/if}
    {/snippet}
  </Footer>
</Modal>

<style>
  /**
   * Modern Confirmation Modal Styles
   * Using design tokens for consistency with the app theme
   */
  
  .confirmation-modal__content {
    padding: var(--space-6);
  }

  .confirmation-modal__header {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
  }

  .confirmation-modal__icon {
    flex-shrink: 0;
    padding: var(--space-3);
    background-color: var(--warning-bg);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .confirmation-modal__icon-svg {
    width: 1.25rem;
    height: 1.25rem;
    color: var(--color-warning-800);
  }

  .confirmation-modal__message {
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }

  /* Theme support */
  :global(.theme-dark) .confirmation-modal__icon,
  :global(.theme-system-dark) .confirmation-modal__icon {
    background-color: rgba(var(--color-warning-900-rgb), 0.2);
  }

  :global(.theme-dark) .confirmation-modal__icon-svg,
  :global(.theme-system-dark) .confirmation-modal__icon-svg {
    color: var(--color-warning-400);
  }

  :global(.theme-dark) .confirmation-modal__message,
  :global(.theme-system-dark) .confirmation-modal__message {
    color: var(--color-text-secondary);
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .confirmation-modal__content {
      padding: var(--space-4);
    }
  }
</style>