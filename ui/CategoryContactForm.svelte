<script>
	import { createEventDispatcher } from 'svelte'
	import { generateCsrfToken } from '../security/csrf.js'
	import { getValidationClasses } from '../validation/index.js'
	import FormErrors from './FormErrors.svelte'
	
	export let config = {}
	export let categorySlug = 'general'
	export let form = { data: {}, errors: {}, isSubmitted: false }
	export let messages = {}
	export let showRequiredLabel = true
	export let submitButtonText = undefined
	export let submittingButtonText = undefined
	export let resetAfterSubmit = true
	export let hideLabels = false
	
	// Extract form configuration
	const { categories = {}, fieldConfigs = {}, ui = {} } = config
	
	// Get the selected category configuration or fallback to default
	const categoryConfig = categories[categorySlug] || categories.general || { fields: ['name', 'email', 'message'] }
	
	// Use configuration or props for button text
	const _submitButtonText = submitButtonText || ui.submitButtonText || 'Send Message'
	const _submittingButtonText = submittingButtonText || ui.submittingButtonText || 'Sending...'
	
	// Generate CSRF token for form security
	let csrfToken = ''
	$: {
		generateCsrfToken().then(token => {
			csrfToken = token
		})
	}
	
	// Track form submission state
	let isSubmitting = false
	
	// Track form field touched state
	let touchedFields = {}
	function markAsTouched(fieldName) {
		touchedFields[fieldName] = true
	}
	
	// Form submission handler
	const dispatch = createEventDispatcher()
	
	function handleSubmit(event) {
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
	
	function getMessage(key, defaultMsg) {
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
		color: #666;
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
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
		width: 100%;
	}
	
	.form-field input:focus,
	.form-field textarea:focus,
	.form-field select:focus {
		outline: none;
		border-color: #4a90e2;
		box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
	}
	
	.form-field input.is-invalid,
	.form-field textarea.is-invalid,
	.form-field select.is-invalid {
		border-color: #dc3545;
		background-color: rgba(220, 53, 69, 0.05);
	}
	
	.form-field input.is-valid,
	.form-field textarea.is-valid,
	.form-field select.is-valid {
		border-color: #28a745;
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
		color: #dc3545;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}
	
	.required-indicator {
		color: #dc3545;
		margin-left: 0.25rem;
	}
	
	.form-actions {
		margin-top: 1rem;
	}
	
	.submit-button {
		padding: 0.75rem 1.5rem;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	.submit-button:hover {
		background-color: #0056b3;
	}
	
	.submit-button:disabled {
		background-color: #6c757d;
		cursor: not-allowed;
	}
</style>