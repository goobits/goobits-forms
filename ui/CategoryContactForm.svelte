<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { generateCsrfToken } from '../security/csrf.ts'
	import { getValidationClasses } from '../validation/index.ts'
	import FormErrors from './FormErrors.svelte'
	
	/**
	 * Configuration object containing categories, field configurations, and UI settings
	 */
	export let config: {
		categories?: Record<string, { fields: string[] }>
		fieldConfigs?: Record<string, {
			type?: string
			label: string
			placeholder?: string
			required?: boolean
			rows?: number
			maxlength?: number
			min?: string | number
			max?: string | number
			pattern?: string
			accept?: string
			multiple?: boolean
			options?: Array<{ value: string; label: string }>
		}>
		ui?: {
			submitButtonText?: string
			submittingButtonText?: string
		}
	} = {}

	/**
	 * The category slug to determine which fields to display
	 */
	export let categorySlug: string = 'general'

	/**
	 * Form state object containing data, errors, and submission status
	 */
	export let form: {
		data: Record<string, any>
		errors: Record<string, string>
		isSubmitted: boolean
	} = { data: {}, errors: {}, isSubmitted: false }

	/**
	 * Localization messages for form labels and validation
	 */
	export let messages: Record<string, string> = {}

	/**
	 * Whether to show the required fields label
	 */
	export let showRequiredLabel: boolean = true

	/**
	 * Custom text for the submit button
	 */
	export let submitButtonText: string | undefined = undefined

	/**
	 * Custom text for the submit button when submitting
	 */
	export let submittingButtonText: string | undefined = undefined

	/**
	 * Whether to reset form after successful submission
	 */
	export let resetAfterSubmit: boolean = true

	/**
	 * Whether to hide field labels
	 */
	export let hideLabels: boolean = false
	
	// Extract form configuration
	const { categories = {}, fieldConfigs = {}, ui = {} } = config
	
	// Get the selected category configuration or fallback to default
	const categoryConfig = categories[categorySlug] || categories.general || { fields: ['name', 'email', 'message'] }
	
	// Use configuration or props for button text
	const _submitButtonText = submitButtonText || ui.submitButtonText || 'Send Message'
	const _submittingButtonText = submittingButtonText || ui.submittingButtonText || 'Sending...'
	
	// Generate CSRF token for form security
	let csrfToken: string = ''
	$: {
		generateCsrfToken().then((token: string) => {
			csrfToken = token
		})
	}
	
	// Track form submission state
	let isSubmitting: boolean = false
	
	// Track form field touched state
	let touchedFields: Record<string, boolean> = {}
	function markAsTouched(fieldName: string): void {
		touchedFields[fieldName] = true
	}
	
	// Form submission handler
	const dispatch = createEventDispatcher()
	
	function handleSubmit(event: SubmitEvent): void {
		// Mark all fields as touched on submit
		if (categoryConfig.fields) {
			categoryConfig.fields.forEach(field => {
				touchedFields[field] = true
			})
		}
		
		// Set submitting state
		isSubmitting = true
		
		// Dispatch event
		dispatch('submit', {
			form: event.target,
			categorySlug
		})
		
		// Don't prevent default to allow normal form submission
	}
	
	function getMessage(key: string, defaultMsg: string): string {
		return messages[key] || defaultMsg
	}
</script>

<div class="contact-form-container">
	{#if Object.keys(form.errors).length > 0 && form.errors._form}
		<FormErrors errors={[form.errors._form]} />
	{/if}
	
	<form method="post" class="contact-form" on:submit={handleSubmit} enctype="multipart/form-data">
		<!-- Add CSRF token -->
		<input type="hidden" name="csrf" value={csrfToken} />
		<input type="hidden" name="category" value={categorySlug} />
		
		{#if showRequiredLabel}
			<div class="required-fields-notice">
				{getMessage('requiredFieldsLabel', 'Required fields are marked with *')}
			</div>
		{/if}
		
		{#each categoryConfig.fields as fieldName}
			{#if fieldConfigs[fieldName]}
				{@const fieldConfig = fieldConfigs[fieldName]}
				{@const isRequired = fieldConfig.required || false}
				{@const fieldValue = form.data[fieldName] || ''}
				{@const fieldError = form.errors[fieldName] || ''}
				{@const isTouched = touchedFields[fieldName] || false}
				{@const validationClass = getValidationClasses(!!fieldError, isTouched, fieldValue)}
				
				<div class="form-field {fieldConfig.type === 'checkbox' ? 'checkbox-field' : ''}">
					{#if fieldConfig.type === 'checkbox'}
						<label class="checkbox-label">
							<input 
								type="checkbox" 
								id={fieldName}
								name={fieldName} 
								checked={fieldValue === true || fieldValue === 'on' || fieldValue === '1'} 
								required={isRequired}
								class={validationClass}
								on:blur={() => markAsTouched(fieldName)}
							/>
							<span class="label-text">
								{getMessage(`field_${fieldName}`, fieldConfig.label)}
								{#if isRequired}<span class="required-indicator">*</span>{/if}
							</span>
						</label>
					{:else}
						{#if !hideLabels}
							<label for={fieldName}>
								{getMessage(`field_${fieldName}`, fieldConfig.label)}
								{#if isRequired}<span class="required-indicator">*</span>{/if}
							</label>
						{/if}
						
						{#if fieldConfig.type === 'textarea'}
							<textarea 
								id={fieldName}
								name={fieldName} 
								placeholder={fieldConfig.placeholder || ''}
								rows={fieldConfig.rows || 5}
								required={isRequired}
								maxlength={fieldConfig.maxlength}
								class={validationClass}
								on:blur={() => markAsTouched(fieldName)}
							>{fieldValue}</textarea>
						{:else if fieldConfig.type === 'select'}
							<select 
								id={fieldName}
								name={fieldName} 
								required={isRequired}
								class={validationClass}
								on:blur={() => markAsTouched(fieldName)}
							>
								<option value="" disabled selected={!fieldValue}>
									{fieldConfig.placeholder || getMessage('selectOption', 'Select an option')}
								</option>
								{#if fieldConfig.options}
									{#each fieldConfig.options as option}
										<option 
											value={option.value} 
											selected={fieldValue === option.value}
										>
											{option.label}
										</option>
									{/each}
								{/if}
							</select>
						{:else if fieldConfig.type === 'file'}
							<input 
								type="file" 
								id={fieldName}
								name={fieldName} 
								accept={fieldConfig.accept || ''}
								multiple={fieldConfig.multiple || false}
								required={isRequired}
								class={validationClass}
								on:blur={() => markAsTouched(fieldName)}
							/>
						{:else}
							<input 
								type={fieldConfig.type || 'text'} 
								id={fieldName}
								name={fieldName} 
								placeholder={fieldConfig.placeholder || ''}
								value={fieldValue} 
								required={isRequired}
								maxlength={fieldConfig.maxlength}
								min={fieldConfig.min}
								max={fieldConfig.max}
								pattern={fieldConfig.pattern}
								class={validationClass}
								on:blur={() => markAsTouched(fieldName)}
							/>
						{/if}
					{/if}
					
					{#if fieldError && isTouched}
						<div class="field-error">{fieldError}</div>
					{/if}
				</div>
			{/if}
		{/each}
		
		<div class="form-actions">
			<button type="submit" class="submit-button" disabled={isSubmitting}>
				{isSubmitting ? _submittingButtonText : _submitButtonText}
			</button>
		</div>
	</form>
</div>

<style>
	.contact-form-container {
		width: 100%;
		max-width: 100%;
	}
	
	.contact-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		width: 100%;
	}
	
	.required-fields-notice {
		font-size: 0.875rem;
		margin-bottom: 1rem;
		color: var(--color-text-secondary);
	}
	
	.form-field {
		display: flex;
		flex-direction: column;
	}
	
	.form-field label {
		margin-bottom: 0.5rem;
		font-weight: 600;
	}
	
	.form-field input,
	.form-field textarea,
	.form-field select {
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 1rem;
		width: 100%;
	}
	
	.form-field input:focus,
	.form-field textarea:focus,
	.form-field select:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
	}
	
	.form-field input.is-invalid,
	.form-field textarea.is-invalid,
	.form-field select.is-invalid {
		border-color: var(--color-error-500);
		background-color: rgba(220, 53, 69, 0.05);
	}
	
	.form-field input.is-valid,
	.form-field textarea.is-valid,
	.form-field select.is-valid {
		border-color: var(--color-success-500);
		background-color: rgba(40, 167, 69, 0.05);
	}
	
	.checkbox-field {
		flex-direction: row;
		align-items: flex-start;
	}
	
	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		cursor: pointer;
		font-weight: normal;
		margin-bottom: 0;
	}
	
	.checkbox-label input[type="checkbox"] {
		margin-top: 0.25rem;
		width: auto;
	}
	
	.field-error {
		color: var(--color-error-500);
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}
	
	.required-indicator {
		color: var(--color-error-500);
		margin-left: 0.25rem;
	}
	
	.form-actions {
		margin-top: 1rem;
	}
	
	.submit-button {
		padding: 0.75rem 1.5rem;
		background-color: var(--color-primary-500);
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	.submit-button:hover {
		background-color: var(--color-primary-600);
	}
	
	.submit-button:disabled {
		background-color: var(--color-text-disabled);
		cursor: not-allowed;
	}
</style>