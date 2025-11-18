<script>
	import { Field, Control, Label, FieldErrors } from 'formsnap'
	import { CheckCircle, AlertCircle } from '@lucide/svelte'
	import Input from '../Input.svelte'
	import Textarea from '../Textarea.svelte'
	import SelectMenu from '../SelectMenu.svelte'
	import UploadImage from '../UploadImage.svelte'
	import { getValidationClasses } from '../../validation/index.ts'

	/**
	 * FieldRenderer - Dynamic field renderer for ContactForm
	 *
	 * @component
	 * Part of ContactForm - extracted for maintainability
	 * Renders different field types based on configuration
	 *
	 * @prop {Object} form - Form object from formsnap
	 * @prop {string} fieldName - Name of the field to render
	 * @prop {Object} fieldConfig - Configuration for the field
	 * @prop {Object} formData - Form data object
	 * @prop {Object} errors - Form errors object
	 * @prop {Object} touched - Touched fields object
	 * @prop {Array} attachments - Attachments array (for file fields)
	 * @prop {Function} onBlur - Blur event handler
	 * @prop {Function} onInput - Input event handler
	 * @prop {Function} onFileChange - File change handler (for file fields)
	 * @prop {Function} onFileError - File error handler (for file fields)
	 */

	let {
		form,
		fieldName,
		fieldConfig,
		formData,
		errors,
		touched,
		attachments,
		onBlur,
		onInput,
		onFileChange,
		onFileError
	} = $props()

	function getFieldClasses(name) {
		const hasError = !!errors[name]
		const isTouched = touched[name]
		const value = formData[name]
		return getValidationClasses(hasError, isTouched, value)
	}
</script>

<Field {form} name={fieldName}>
	{#snippet children({ errors: fieldErrors })}
		<Control>
			{#snippet children({ props })}
				<Label class="contact-form__label" data-name={fieldName}>
					{@html fieldConfig.label}

					{#if fieldName === 'attachments'}
						<UploadImage
							accept={fieldConfig.accept}
							error={fieldErrors?.attachments}
							files={attachments}
							maxFiles={fieldConfig.maxFiles}
							maxSize={fieldConfig.maxSize}
							onChange={onFileChange}
							onError={onFileError}
						/>
					{:else if fieldConfig.type === 'select'}
						<div class="contact-form__validation-container">
							<SelectMenu
								{...props}
								bind:value={formData[fieldName]}
								options={fieldConfig.options.map((option) =>
									typeof option === 'object' ? option : { value: option, label: option }
								)}
								placeholder="Select {fieldConfig.label.replace('(optional)', '')}"
								required={fieldConfig.required}
								onchange={() => {
									onInput(fieldName)
									onBlur(fieldName)
								}}
								class="contact-form__select {getFieldClasses(fieldName)}"
							/>

							<span class="contact-form__validation-icon" aria-hidden="true">
								{#if !fieldErrors?.[fieldName] && touched[fieldName] && formData[fieldName]}
									<CheckCircle size={16} class="contact-form__validation-icon--state-valid" />
								{:else if fieldErrors?.[fieldName] && touched[fieldName] && formData[fieldName]}
									<AlertCircle size={16} class="contact-form__validation-icon--state-invalid" />
								{/if}
							</span>
						</div>
					{:else if fieldConfig.type === 'textarea'}
						<div class="contact-form__validation-container">
							<Textarea
								{...props}
								bind:value={formData[fieldName]}
								variant={touched[fieldName] && fieldErrors?.[fieldName]
									? 'error'
									: !fieldErrors?.[fieldName] && touched[fieldName] && formData[fieldName]
										? 'success'
										: 'default'}
								class="contact-form__textarea {getFieldClasses(fieldName)}"
								placeholder={fieldConfig.placeholder}
								required={fieldConfig.required}
								rows={4}
								autoResize={true}
							/>

							<span class="contact-form__validation-icon" aria-hidden="true">
								{#if !fieldErrors?.[fieldName] && touched[fieldName] && formData[fieldName]}
									<CheckCircle size={16} class="contact-form__validation-icon--state-valid" />
								{:else if fieldErrors?.[fieldName] && touched[fieldName] && formData[fieldName]}
									<AlertCircle size={16} class="contact-form__validation-icon--state-invalid" />
								{/if}
							</span>
						</div>
					{:else if fieldConfig.type === 'checkbox'}
						<input
							{...props}
							bind:checked={formData[fieldName]}
							class:contact-form__field--error={touched[fieldName] && fieldErrors?.[fieldName]}
							class="contact-form__checkbox"
							onblur={() => onBlur(fieldName)}
							oninput={() => onInput(fieldName)}
							type="checkbox"
						/>
					{:else}
						<div class="contact-form__validation-container">
							<Input
								{...props}
								bind:value={formData[fieldName]}
								variant={touched[fieldName] && fieldErrors?.[fieldName]
									? 'error'
									: !fieldErrors?.[fieldName] && touched[fieldName] && formData[fieldName]
										? 'success'
										: 'default'}
								class="contact-form__input {getFieldClasses(fieldName)}"
								placeholder={fieldConfig.placeholder}
								required={fieldConfig.required}
								type={fieldConfig.type}
							/>

							<span class="contact-form__validation-icon" aria-hidden="true">
								{#if !fieldErrors?.[fieldName] && touched[fieldName] && formData[fieldName]}
									<CheckCircle size={16} class="contact-form__validation-icon--state-valid" />
								{:else if fieldErrors?.[fieldName] && touched[fieldName] && formData[fieldName]}
									<AlertCircle size={16} class="contact-form__validation-icon--state-invalid" />
								{/if}
							</span>
						</div>
					{/if}
				</Label>
				{#if touched[fieldName] && fieldErrors?.[fieldName]}
					<FieldErrors />
				{/if}
			{/snippet}
		</Control>
	{/snippet}
</Field>
