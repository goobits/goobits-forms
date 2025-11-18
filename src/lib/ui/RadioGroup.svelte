<script lang="ts">
	/**
	 * Radio option interface
	 */
	export interface RadioOption {
		/** Value of the radio option */
		value: string | number;
		/** Label text for the option */
		label: string;
		/** Whether this option is disabled */
		disabled?: boolean;
		/** Optional description text */
		description?: string;
	}

	/**
	 * Props interface for the RadioGroup component
	 */
	interface Props {
		/** Array of radio options */
		options: RadioOption[];
		/** Currently selected value */
		value?: string | number;
		/** Name attribute for the radio group */
		name: string;
		/** Label for the radio group */
		label?: string;
		/** Error message to display */
		error?: string;
		/** Whether all radios are disabled */
		disabled?: boolean;
		/** Layout orientation */
		orientation?: 'vertical' | 'horizontal';
		/** Whether the field is required */
		required?: boolean;
		/** Size of the radio buttons */
		size?: 'sm' | 'md' | 'lg';
		/** Additional CSS class names */
		class?: string;
		/** ID for the fieldset element */
		id?: string;
		/** Test ID for automated testing */
		'data-testid'?: string;
	}

	let {
		options,
		value = $bindable(),
		name,
		label,
		error,
		disabled = false,
		orientation = 'vertical',
		required = false,
		size = 'md',
		class: className = '',
		id = `radio-group-${Math.random().toString(36).substring(2, 9)}`,
		'data-testid': dataTestId,
		onchange,
		...restProps
	}: Props = $props();

	// Fieldset element reference
	let fieldsetElement: HTMLFieldSetElement | undefined = $state();

	// Track radio elements for keyboard navigation
	let radioElements = $state<Record<number, HTMLInputElement>>({});

	// Combine CSS classes using BEM methodology
	const groupClasses = $derived(
		[
			'radio-group',
			`radio-group--${orientation}`,
			error && 'radio-group--error',
			disabled && 'radio-group--disabled',
			className
		]
			.filter(Boolean)
			.join(' ')
	);

	// Handle change event
	function handleChange(newValue: string | number) {
		value = newValue;
		if (onchange) {
			const event = new CustomEvent('change', { detail: newValue });
			onchange(event as any);
		}
	}

	// Handle keyboard navigation (Arrow keys)
	function handleKeyDown(event: KeyboardEvent, currentIndex: number) {
		const enabledRadios = options
			.map((opt, idx) => ({ option: opt, index: idx }))
			.filter(({ option }) => !option.disabled && !disabled);

		if (enabledRadios.length === 0) return;

		const currentEnabledIndex = enabledRadios.findIndex(({ index }) => index === currentIndex);
		if (currentEnabledIndex === -1) return;

		let nextIndex: number | undefined;

		if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
			event.preventDefault();
			// Move to next radio, wrapping to first if at end
			const nextEnabledIndex = (currentEnabledIndex + 1) % enabledRadios.length;
			nextIndex = enabledRadios[nextEnabledIndex].index;
		} else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
			event.preventDefault();
			// Move to previous radio, wrapping to last if at beginning
			const prevEnabledIndex =
				currentEnabledIndex === 0 ? enabledRadios.length - 1 : currentEnabledIndex - 1;
			nextIndex = enabledRadios[prevEnabledIndex].index;
		}

		if (nextIndex !== undefined) {
			const nextRadio = radioElements[nextIndex];
			if (nextRadio) {
				nextRadio.focus();
				nextRadio.click();
			}
		}
	}

	// Error ID for ARIA
	const errorId = error ? `${id}-error` : undefined;

	// Expose the fieldset element for binding
	export { fieldsetElement as element };
</script>

<fieldset
	bind:this={fieldsetElement}
	class={groupClasses}
	{disabled}
	aria-invalid={!!error}
	aria-describedby={errorId}
	aria-required={required}
	data-testid={dataTestId}
	role="radiogroup"
	{...restProps}
>
	{#if label}
		<legend class="radio-group__legend">
			{label}
			{#if required}
				<span class="radio-group__required" aria-label="required">*</span>
			{/if}
		</legend>
	{/if}

	<div class="radio-group__options">
		{#each options as option, index (option.value)}
			{@const radioId = `${id}-${option.value}`}
			{@const isChecked = value === option.value}
			{@const isDisabled = disabled || option.disabled}

			<div
				class="radio-group__option {isDisabled ? 'radio-group__option--disabled' : ''}"
			>
				<input
					bind:this={radioElements[index]}
					type="radio"
					class="radio__input radio--{size}"
					id={radioId}
					{name}
					value={option.value}
					checked={isChecked}
					disabled={isDisabled}
					aria-describedby={option.description ? `${radioId}-desc` : undefined}
					onchange={() => handleChange(option.value)}
					onkeydown={(e) => handleKeyDown(e, index)}
				/>
				<span class="radio__button radio__button--{size}" aria-hidden="true"></span>
				<label for={radioId} class="radio__label radio__label--{size}">
					{option.label}
					{#if option.description}
						<span class="radio__description" id="{radioId}-desc">
							{option.description}
						</span>
					{/if}
				</label>
			</div>
		{/each}
	</div>
</fieldset>

{#if error}
	<div class="radio-group__error" id={errorId} role="alert">
		{error}
	</div>
{/if}

<style>
	@import './Radio.css';
</style>
