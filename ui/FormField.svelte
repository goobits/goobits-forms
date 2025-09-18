<script>
	import { CheckCircle, AlertCircle } from '@lucide/svelte'
	
	let {
		fieldName,
		fieldConfig,
		value,
		errors,
		touched,
		getFieldClasses,
		handleBlur,
		handleInput,
		props
	} = $props()
	
	// Reference to the input element
	let inputElement = $state(null)
	
	// Track focus state for enhanced keyboard navigation
	let hasFocus = $state(false)
	
	// Handle focus event
	function handleFocus() {
		hasFocus = true
	}
	
	// Handle blur with additional focus tracking
	function handleFieldBlur() {
		hasFocus = false
		handleBlur(fieldName)
	}
	
	// Add keyboard event handlers for enhanced navigation
	function handleKeyDown(event) {
		// Handle Enter key on select elements (activate dropdown)
		if (event.key === 'Enter' && fieldConfig.type === 'select') {
			event.preventDefault()
			event.target.click()
		}
		
		// Custom handling for Escape key
		if (event.key === 'Escape') {
			event.target.blur()
		}
	}
	
	// Common field props
	const fieldProps = $derived({
		...props,
		name: fieldName,
		id: fieldName,
		...fieldConfig,
		'aria-invalid': touched[fieldName] && errors?.[fieldName] ? 'true' : null,
		'aria-describedby': touched[fieldName] && errors?.[fieldName] ? `${fieldName}-error` : null,
		'aria-required': fieldConfig.required ? 'true' : null,
		// Add tabindex attribute if provided
		...(fieldConfig.tabindex !== undefined ? { tabindex: fieldConfig.tabindex } : {})
	})
	
	// Classes for styling and validation states
	const baseClasses = $derived(getFieldClasses(fieldName))
	
	const validationClasses = $derived(
		[
			touched[fieldName] && errors?.[fieldName] ? 'contact-form__field--error' : '',
			!errors?.[fieldName] && touched[fieldName] && value ? 'contact-form__field--valid' : ''
		].filter(Boolean).join(' ')
	)
	
	// Complete classes for different field types
	const selectClasses = $derived(`contact-form__select ${baseClasses} ${validationClasses}`)
	const textareaClasses = $derived(`contact-form__textarea ${baseClasses} ${validationClasses}`)
	const inputClasses = $derived(`contact-form__input ${baseClasses} ${validationClasses}`)
</script>

<!-- Common wrapper for fields with validation icon -->
{#if fieldConfig.type !== 'checkbox'}
	<div class="contact-form__validation-container"
		data-field-name={fieldName}
		data-field-type={fieldConfig.type}>
		{#if fieldConfig.type === 'select'}
			<select
				{...fieldProps}
				bind:value={value}
				bind:this={inputElement}
				class={selectClasses}
				class:contact-form__field--focused={hasFocus}
				onblur={handleFieldBlur}
				oninput={() => handleInput(fieldName)}
				onfocus={handleFocus}
				onkeydown={handleKeyDown}
			>
				<option value="">Select {fieldConfig.label.replace('(optional)', '')}</option>
				{#each fieldConfig.options as option}
					{#if typeof option === 'object'}
						<option value={option.value}>{option.label}</option>
					{:else}
						<option value={option}>{option}</option>
					{/if}
				{/each}
			</select>
		{:else if fieldConfig.type === 'textarea'}
			<textarea
				{...fieldProps}
				bind:value={value}
				bind:this={inputElement}
				class={textareaClasses}
				class:contact-form__field--focused={hasFocus}
				onblur={handleFieldBlur}
				oninput={() => handleInput(fieldName)}
				onfocus={handleFocus}
				onkeydown={handleKeyDown}
				placeholder={fieldConfig.placeholder}
				rows={fieldConfig.rows || 4}
			></textarea>
		{:else}
			<input
				{...fieldProps}
				bind:value={value}
				bind:this={inputElement}
				class={inputClasses}
				class:contact-form__field--focused={hasFocus}
				onblur={handleFieldBlur}
				oninput={() => handleInput(fieldName)}
				onfocus={handleFocus}
				onkeydown={handleKeyDown}
				placeholder={fieldConfig.placeholder}
				type={fieldConfig.type}
			>
		{/if}
		
		<!-- Validation icon -->
		<span class="contact-form__validation-icon" aria-hidden="true">
			{#if !errors?.[fieldName] && touched[fieldName] && value}
				<CheckCircle size={16} class="contact-form__validation-icon--state-valid" />
			{:else if errors?.[fieldName] && touched[fieldName] && value}
				<AlertCircle size={16} class="contact-form__validation-icon--state-invalid" />
			{/if}
		</span>
	</div>
{:else}
	<!-- Special case for checkbox - no container needed -->
	<input
		{...fieldProps}
		bind:checked={value}
		bind:this={inputElement}
		class="contact-form__checkbox {validationClasses}"
		class:contact-form__field--focused={hasFocus}
		onblur={handleFieldBlur}
		oninput={() => handleInput(fieldName)}
		onfocus={handleFocus}
		onkeydown={handleKeyDown}
		type="checkbox"
	>
{/if}

<style>
	/* Enhanced focus styles for keyboard navigation */
	:global(.contact-form__field--focused) {
		outline: 2px solid var(--color-primary-500) !important;
		outline-offset: 2px !important;
		box-shadow: 0 0 0 3px var(--color-primary-100) !important;
		transition: outline 0.2s ease, box-shadow 0.2s ease;
	}

	/* High contrast focus style for Windows High Contrast Mode */
	@media (forced-colors: active) {
		:global(.contact-form__field--focused) {
			outline: 3px solid CanvasText !important;
			outline-offset: 2px !important;
		}
	}
</style>