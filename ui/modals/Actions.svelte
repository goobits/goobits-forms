<script lang="ts">

  type ModalActionsProps = {
    /**
     * Additional CSS class names
     */
    class?: string;
  } & Omit<svelte.JSX.HTMLDivAttributes, 'class'>;

  const {
    class: className = '',
    children,
    ...restProps
  }: ModalActionsProps = $props();
</script>

<div class={[
  'action-bar',
  className
].filter(Boolean).join(' ')} {...restProps}>
  {@render children?.()}
</div>

<style>
  /* Action bar for fixed buttons */
  .action-bar {
    background-color: var(--color-white);
    border-top: 1px solid var(--color-border);
    padding: var(--space-4) var(--space-6);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
  }

  @media (max-width: var(--breakpoint-md)) {
    .action-bar {
      padding: var(--space-3) var(--space-4);
    }
  }
</style>