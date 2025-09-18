<script lang="ts">
  import { ChevronDown } from '@lucide/svelte';

  interface SelectOption {
    value: string;
    label: string;
  }

  interface Props {
    value?: string;
    options?: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    class?: string;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable(''),
    options = [],
    placeholder = 'Select an option',
    disabled = false,
    class: className = '',
    onchange
  }: Props = $props();

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    value = target.value;
    onchange?.(target.value);
  }
</script>

<div class="select-menu {className}">
  <select
    {value}
    {disabled}
    on:change={handleChange}
    class="select-menu__select"
  >
    <option value="" disabled>{placeholder}</option>
    {#each options as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  <div class="select-menu__icon">
    <ChevronDown size="16" />
  </div>
</div>

<style>
  .select-menu {
    position: relative;
    display: inline-block;
    width: 100%;
  }

  .select-menu__select {
    width: 100%;
    height: 40px;
    padding: 0 var(--space-3);
    padding-right: var(--space-10);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    color: var(--color-text-primary);
    font-size: var(--font-size-base, 16px);
    appearance: none;
    cursor: pointer;
    transition: var(--transition-base, all 0.15s ease);
  }

  .select-menu__select:hover:not(:disabled) {
    border-color: var(--color-border-strong);
  }

  .select-menu__select:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 2px var(--color-primary-100);
  }

  .select-menu__select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--color-background-secondary);
  }

  .select-menu__icon {
    position: absolute;
    right: var(--space-3);
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--color-text-disabled);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* High contrast mode adjustments */
  @media (prefers-contrast: high) {
    .select-menu__select {
      border-width: 2px;
    }

    .select-menu__select:focus {
      box-shadow: 0 0 0 2px var(--color-text-primary);
    }
  }
</style>