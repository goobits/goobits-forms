<script lang="ts">
	/**
	 * Props interface for the ToggleSwitch component
	 */
	interface ToggleSwitchProps {
		/** Whether the toggle is checked */
		checked?: boolean;
		/** Whether the toggle is disabled */
		disabled?: boolean;
		/** Callback function when toggle state changes */
		onchange?: (checked: boolean) => void;
		/** Visual variant of the toggle */
		variant?: 'default' | 'ios';
		/** Size of the toggle */
		size?: 'small' | 'medium' | 'large';
		/** Additional CSS class names */
		class?: string;
	}
	const {
		checked = false,
		disabled = false,
		onchange,
		variant = 'ios',
		size = 'medium',
		class: className = ''
	}: ToggleSwitchProps = $props();

	function handleToggle(): void {
		if (!disabled && onchange) {
			onchange(!checked);
		}
	}
</script>

<button
	class="toggle-switch toggle-switch--{variant} toggle-switch--{size} {checked
		? 'active'
		: ''} {className}"
	onclick={handleToggle}
	{disabled}
	role="switch"
	aria-checked={checked}
	aria-disabled={disabled}
>
	<span class="toggle-handle"></span>
</button>

<style>
	/* Base Toggle Styles */
	.toggle-switch {
		position: relative;
		border: none;
		cursor: pointer;
		background: #e5e5ea;
		padding: 0;
		transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.12);
		overflow: hidden;
	}

	.toggle-switch::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transform: translateX(-100%);
		transition: transform 0.6s ease;
	}

	.toggle-switch.active::before {
		transform: translateX(100%);
	}

	.toggle-switch:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.toggle-handle {
		position: absolute;
		background: white;
		transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow:
			0 3px 8px rgba(0, 0, 0, 0.15),
			0 1px 3px rgba(0, 0, 0, 0.12),
			0 0 0 1px rgba(0, 0, 0, 0.04);
		z-index: 1;
	}

	.toggle-switch:hover:not(:disabled) .toggle-handle {
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.18),
			0 2px 4px rgba(0, 0, 0, 0.15),
			0 0 0 1px rgba(0, 0, 0, 0.06);
	}

	/* iOS Variant */
	.toggle-switch--ios {
		border-radius: 999px;
		background: linear-gradient(to bottom, #e5e5ea, #d1d1d6);
		border: none;
		position: relative;
	}

	.toggle-switch--ios::after {
		content: '';
		position: absolute;
		top: 1px;
		left: 1px;
		right: 1px;
		bottom: 1px;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.25), transparent);
		border-radius: 999px;
		pointer-events: none;
	}

	.toggle-switch--ios.active {
		background: linear-gradient(
			to bottom,
			var(--color-success-400, #4cd964),
			var(--color-success-500, #34c759)
		);
		box-shadow:
			inset 0 1px 3px rgba(0, 0, 0, 0.1),
			0 0 0 0.5px var(--color-success-300, rgba(52, 199, 89, 0.5));
	}

	.toggle-switch--ios.active::after {
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent);
	}

	:global(.dark) .toggle-switch--ios {
		background: linear-gradient(to bottom, #39393d, #2c2c2e);
	}

	:global(.dark) .toggle-switch--ios.active {
		background: linear-gradient(to bottom, #32d74b, #28c840);
		box-shadow:
			inset 0 1px 3px rgba(0, 0, 0, 0.2),
			0 0 0 0.5px rgba(50, 215, 75, 0.5);
	}

	.toggle-switch--ios .toggle-handle {
		border-radius: 50%;
		top: 2px;
		left: 2px;
		background: linear-gradient(to bottom, #ffffff, #f4f4f4);
	}

	.toggle-switch--ios.active .toggle-handle {
		background: linear-gradient(to bottom, #ffffff, #f8f8f8);
	}

	/* Default Variant */
	.toggle-switch--default {
		border-radius: 999px;
		background: linear-gradient(to bottom, #e2e8f0, #cbd5e1);
		border: none;
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	.toggle-switch--default.active {
		background: linear-gradient(to bottom, var(--color-primary-500), var(--color-primary-600));
		box-shadow:
			inset 0 1px 3px rgba(0, 0, 0, 0.1),
			0 0 0 0.5px var(--color-primary-400);
	}

	:global(.theme-dark) .toggle-switch--default,
	:global(.theme-system-dark) .toggle-switch--default {
		background: linear-gradient(to bottom, var(--color-secondary-400), var(--color-secondary-500));
	}

	:global(.theme-dark) .toggle-switch--default.active,
	:global(.theme-system-dark) .toggle-switch--default.active {
		background: linear-gradient(to bottom, var(--color-primary-400), var(--color-primary-500));
	}

	.toggle-switch--default .toggle-handle {
		border-radius: 50%;
		top: 2px;
		left: 2px;
		background: linear-gradient(to bottom, #ffffff, #f4f4f4);
	}

	/* Size Variations */

	/* Small */
	.toggle-switch--small {
		width: 44px;
		height: 26px;
	}

	.toggle-switch--small .toggle-handle {
		width: 22px;
		height: 22px;
	}

	.toggle-switch--small.active .toggle-handle {
		transform: translateX(18px) scale(1.05);
	}

	.toggle-switch--small:not(.active) .toggle-handle {
		transform: translateX(0) scale(1);
	}

	/* Medium (Default) */
	.toggle-switch--medium {
		width: 51px;
		height: 31px;
	}

	.toggle-switch--medium .toggle-handle {
		width: 27px;
		height: 27px;
	}

	.toggle-switch--medium.active .toggle-handle {
		transform: translateX(20px) scale(1.05);
	}

	.toggle-switch--medium:not(.active) .toggle-handle {
		transform: translateX(0) scale(1);
	}

	/* Large */
	.toggle-switch--large {
		width: 60px;
		height: 36px;
	}

	.toggle-switch--large .toggle-handle {
		width: 32px;
		height: 32px;
	}

	.toggle-switch--large.active .toggle-handle {
		transform: translateX(24px) scale(1.05);
	}

	.toggle-switch--large:not(.active) .toggle-handle {
		transform: translateX(0) scale(1);
	}

	/* Focus Styles */
	.toggle-switch:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 3px var(--color-primary-100),
			inset 0 1px 3px rgba(0, 0, 0, 0.12);
	}

	/* Active/Press State */
	.toggle-switch:active:not(:disabled) {
		transform: scale(0.98);
	}

	.toggle-switch:active:not(:disabled) .toggle-handle {
		width: calc(100% - 4px);
	}

	.toggle-switch--small:active:not(:disabled) .toggle-handle {
		width: 26px;
	}

	.toggle-switch--small.active:active:not(:disabled) .toggle-handle {
		transform: translateX(14px) scale(1.05);
	}

	.toggle-switch--medium:active:not(:disabled) .toggle-handle {
		width: 31px;
	}

	.toggle-switch--medium.active:active:not(:disabled) .toggle-handle {
		transform: translateX(16px) scale(1.05);
	}

	.toggle-switch--large:active:not(:disabled) .toggle-handle {
		width: 36px;
	}

	.toggle-switch--large.active:active:not(:disabled) .toggle-handle {
		transform: translateX(20px) scale(1.05);
	}

	/* Hover animations */
	@media (hover: hover) {
		.toggle-switch:hover:not(:disabled) {
			filter: brightness(0.95);
		}

		.toggle-switch.active:hover:not(:disabled) {
			filter: brightness(1.05);
		}

		.toggle-switch:hover:not(:disabled):not(:active) .toggle-handle {
			transform: translateX(2px) scale(1.08);
		}

		.toggle-switch.active:hover:not(:disabled):not(:active) .toggle-handle {
			transform: translateX(18px) scale(1.08);
		}

		.toggle-switch--medium.active:hover:not(:disabled):not(:active) .toggle-handle {
			transform: translateX(18px) scale(1.08);
		}

		.toggle-switch--large.active:hover:not(:disabled):not(:active) .toggle-handle {
			transform: translateX(22px) scale(1.08);
		}
	}
</style>
