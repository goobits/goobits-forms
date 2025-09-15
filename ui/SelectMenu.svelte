<script lang="ts">
  import { ChevronDown, type Icon } from '@lucide/svelte';
  import Menu from '$lib/components/ui/menu/Menu.svelte';
  import type { MenuItem } from '$lib/components/ui/menu/types';
  import { cn } from '$lib/utils/cn';

  interface SelectOption {
    value: string;
    label: string;
    icon?: typeof Icon;
  }

  interface Props {
    value?: string;
    options?: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    icon?: typeof Icon;
    class?: string;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable(''),
    options = [],
    placeholder = 'Select an option',
    disabled = false,
    icon: IconComponent,
    class: className = '',
    onchange
  }: Props = $props();

  let isOpen = $state(false);
  let triggerRef = $state<HTMLButtonElement | undefined>();
  let selectedValue = $state(value);
  let menuPosition = $state({ x: 0, y: 0 });
  let triggerWidth = $state(0);

  // Update selectedValue when value prop changes
  $effect(() => {
    selectedValue = value;
  });

  // Update menu position on scroll/resize when open
  $effect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updateMenuPosition();
    };

    // Listen to scroll on window and all parent elements
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  });

  // Convert options to menu items
  const menuItems = $derived<MenuItem[]>(
    options.map(option => ({
      type: 'action' as const,
      label: option.label,
      icon: option.icon ? (option.icon as any) : undefined,
      onClick: () => {
        selectedValue = option.value;
        value = option.value;  // Update the bindable prop
        onchange?.(option.value);
        // MenuItem will call onClose after this
      }
    }))
  );

  // Get selected option display
  const selectedOption = $derived(
    options.find(opt => opt.value === selectedValue)
  );

  const displayText = $derived(
    selectedOption?.label || placeholder
  );

  // Get the icon to display - selected option's icon or the default icon
  const displayIcon = $derived(
    selectedOption?.icon || IconComponent
  );

  function toggleMenu() {
    if (disabled) return;
    
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function updateMenuPosition() {
    if (!triggerRef) return;
    
    const rect = triggerRef.getBoundingClientRect();
    
    // Close menu if trigger is scrolled out of viewport
    if (rect.bottom < 0 || rect.top > window.innerHeight || 
        rect.right < 0 || rect.left > window.innerWidth) {
      closeMenu();
      return;
    }
    
    triggerWidth = rect.width;
    menuPosition = {
      x: rect.left,
      y: rect.bottom
    };
  }

  function openMenu() {
    if (disabled || !triggerRef) return;
    
    updateMenuPosition();
    isOpen = true;
  }

  function closeMenu() {
    isOpen = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          openMenu();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          openMenu();
        }
        break;
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          closeMenu();
        }
        break;
    }
  }

  const buttonClasses = $derived(cn(
    'select-menu-trigger',
    disabled && 'select-menu-trigger--disabled',
    !selectedValue && 'select-menu-trigger--placeholder',
    isOpen && 'select-menu-trigger--open',
    className
  ));

  const ariaAttributes = $derived({
    'role': 'combobox',
    'aria-expanded': isOpen,
    'aria-haspopup': 'listbox',
    'aria-label': placeholder,
    'aria-describedby': undefined
  });
</script>

<button
  bind:this={triggerRef}
  type="button"
  class={buttonClasses}
  {disabled}
  onclick={toggleMenu}
  onkeydown={handleKeydown}
  {...ariaAttributes}
>
  {#if displayIcon}
    <div class="select-menu-trigger__icon">
      <svelte:component this={displayIcon} size="16" />
    </div>
  {/if}
  
  <span class="select-menu-trigger__text">
    {displayText}
  </span>
  
  <div class="select-menu-trigger__arrow" class:select-menu-trigger__arrow--open={isOpen}>
    <ChevronDown size="16" />
  </div>
</button>

<Menu
  isVisible={isOpen}
  items={menuItems}
  x={menuPosition.x}
  y={menuPosition.y + 4}
  onClose={closeMenu}
  anchorEl={triggerRef}
  autoFocus={true}
  showIcons={true}
  showShortcuts={false}
  minWidth={triggerWidth}
  className="select-menu-dropdown__menu"
/>

<style>
  .select-menu-trigger {
    display: flex;
    align-items: center;
    width: 100%;
    height: 40px;
    padding: 0 var(--space-3);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg, 12px);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: var(--transition-base, all 0.15s ease);
    outline: none;
    text-align: left;
    font-size: var(--font-size-base, 16px);
    line-height: 1;
  }

  .select-menu-trigger:hover:not(.select-menu-trigger--disabled) {
    border-color: var(--color-border-strong);
  }

  .select-menu-trigger:focus-visible {
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 2px var(--color-primary-500);
  }

  .select-menu-trigger--open {
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 2px var(--color-primary-500);
  }

  .select-menu-trigger--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .select-menu-trigger--placeholder .select-menu-trigger__text {
    color: var(--color-text-tertiary);
  }

  .select-menu-trigger__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: var(--space-2);
    color: var(--color-text-tertiary);
    flex-shrink: 0;
  }

  .select-menu-trigger__text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .select-menu-trigger__arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: var(--space-2);
    color: var(--color-text-disabled);
    transition: transform var(--duration-150, 150ms) ease;
    flex-shrink: 0;
  }

  .select-menu-trigger__arrow--open {
    transform: rotate(180deg);
  }

  /* Select menu styling overrides */
  :global(.select-menu-dropdown__menu .menu__content) {
    max-height: 240px;
    overflow-y: auto;
  }

  /* High contrast mode adjustments */
  @media (prefers-contrast: high) {
    .select-menu-trigger {
      border-width: 2px;
    }
    
    .select-menu-trigger:focus-visible {
      box-shadow: 0 0 0 2px var(--color-black);
    }
  }
</style>