<script lang="ts">
  import { ChevronDown } from '@lucide/svelte';
  import Menu from './menu/Menu.svelte';

  /**
   * Interface for select options
   */
  interface SelectOption {
    /** The option value */
    value: string
    /** The option label */
    label: string
    /** Support icon components */
    icon?: any
  }

  /**
   * Props interface for the SelectMenu component
   */
  interface Props {
    /** The selected value */
    value?: string
    /** Array of select options */
    options?: SelectOption[]
    /** Placeholder text */
    placeholder?: string
    /** Whether the select is disabled */
    disabled?: boolean
    /** Additional CSS class names */
    class?: string
    /** Icon for the trigger button */
    icon?: any
    /** Callback when value changes */
    onchange?: (value: string) => void
  }
  let {
    value = $bindable(''),
    options = [],
    placeholder = 'Select an option',
    disabled = false,
    class: className = '',
    icon,
    onchange
  }: Props = $props();

  let isOpen: boolean = $state(false);
  let triggerRef: HTMLButtonElement | undefined = $state();
  let triggerPosition: { x: number; y: number } = $state({ x: 0, y: 0 });

  // Convert options to menu items
  const menuItems: import('./menu/types').MenuItem[] = $derived(
    options.map(option => ({
      type: 'action',
      label: option.label,
      icon: option.icon,
      onClick: () => {
        value = option.value;
        onchange?.(option.value);
        isOpen = false;
      }
    }))
  );

  // Get selected option for display
  const selectedOption = $derived(
    options.find(opt => opt.value === value)
  );

  // Get display text
  const displayText = $derived(
    selectedOption?.label || placeholder
  );

  // Get display icon
  const displayIcon = $derived(
    selectedOption?.icon || icon
  );

  function updateMenuPosition(): void {
    if (!triggerRef) return;

    const rect = triggerRef.getBoundingClientRect();
    triggerPosition = {
      x: rect.left,
      y: rect.bottom + 4
    };
  }

  function handleToggle(): void {
    if (disabled) return;

    if (!isOpen) {
      updateMenuPosition();
    }
    isOpen = !isOpen;
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    } else if (event.key === 'Escape' && isOpen) {
      isOpen = false;
    }
  }
</script>

<div class="select-menu {className}">
  <button
    bind:this={triggerRef}
    type="button"
    class="select-menu__trigger"
    class:select-menu__trigger--open={isOpen}
    class:select-menu__trigger--disabled={disabled}
    class:select-menu__trigger--has-value={!!selectedOption}
    onclick={handleToggle}
    onkeydown={handleKeydown}
    {disabled}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-label={placeholder}
  >
    {#if displayIcon}
      <span class="select-menu__trigger-icon">
        <svelte:component this={displayIcon} size="16" />
      </span>
    {/if}

    <span class="select-menu__trigger-text">
      {displayText}
    </span>

    <span class="select-menu__trigger-arrow" class:select-menu__trigger-arrow--open={isOpen}>
      <ChevronDown size="16" />
    </span>
  </button>

  {#if isOpen}
    <Menu
      items={menuItems}
      isVisible={isOpen}
      x={triggerPosition.x}
      y={triggerPosition.y}
      onClose={() => isOpen = false}
      anchorEl={triggerRef}
      autoFocus={true}
      showIcons={options.some(opt => opt.icon)}
      showShortcuts={false}
      minWidth={triggerRef?.offsetWidth || 200}
    />
  {/if}
</div>

<style>
  .select-menu {
    position: relative;
    display: inline-block;
    width: 100%;
  }

  .select-menu__trigger {
    width: 100%;
    height: 40px;
    padding: 0 var(--space-3);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    color: var(--color-text-primary);
    font-size: var(--font-size-base, 16px);
    cursor: pointer;
    transition: var(--transition-base, all 0.15s ease);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    text-align: left;
  }

  .select-menu__trigger:hover:not(.select-menu__trigger--disabled) {
    border-color: var(--color-border-strong);
  }

  .select-menu__trigger:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 2px var(--color-primary-100);
  }

  .select-menu__trigger--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--color-background-secondary);
  }

  .select-menu__trigger--open {
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 2px var(--color-primary-100);
  }

  .select-menu__trigger-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--color-text-secondary);
  }

  .select-menu__trigger-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .select-menu__trigger--has-value .select-menu__trigger-text {
    color: var(--color-text-primary);
  }

  .select-menu__trigger:not(.select-menu__trigger--has-value) .select-menu__trigger-text {
    color: var(--color-text-tertiary);
  }

  .select-menu__trigger-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--color-text-secondary);
    transition: transform 0.2s ease;
  }

  .select-menu__trigger-arrow--open {
    transform: rotate(180deg);
  }

  /* High contrast mode adjustments */
  @media (prefers-contrast: high) {
    .select-menu__trigger {
      border-width: 2px;
    }

    .select-menu__trigger:focus {
      box-shadow: 0 0 0 2px var(--color-text-primary);
    }
  }
</style>