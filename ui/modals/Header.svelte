<script lang="ts">
  type ModalHeaderFieldsProps = {
    /**
     * Additional CSS class names
     */
    class?: string;
  } & Omit<svelte.JSX.HTMLDivAttributes, 'class'>;

  const {
    class: className = '',
    children,
    ...restProps
  }: ModalHeaderFieldsProps = $props();
</script>

<div class="modal-header-fields {className}" {...restProps}>
  {@render children?.()}
</div>

<style>
  /* Header fields section for metadata */
  .modal-header-fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }
</style>