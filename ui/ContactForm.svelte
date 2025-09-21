<script lang="ts">
	import './ContactForm.css'
	import FormErrors from './FormErrors.svelte'
	import ThankYou from './ThankYou.svelte'
	import UploadImage from './UploadImage.svelte'
	import SelectMenu from './SelectMenu.svelte'
	import Input from './Input.svelte'
	import Textarea from './Textarea.svelte'
	import { createEventDispatcher, onDestroy, onMount } from 'svelte'
	import { z } from 'zod'

	const _dispatch = createEventDispatcher()

	import { getContactFormConfig } from '../config/index.ts'
	import { Field, Control, Label, FieldErrors } from 'formsnap'
	import { hydrateForm } from '../services/formHydration.js'
	import { Loader2, AlertCircle, CheckCircle } from '@lucide/svelte'
	import { getValidationClasses } from '../validation/index.ts'
	import { debounce } from '../utils/debounce.ts'
	import { saveFormData, clearFormData } from '../services/formStorage.js'
	import { IS_BROWSER, SAVE_DEBOUNCE_DELAY } from '../utils/constants.ts'

	// Import shared form service functions
	import {
		createFormSubmitHandler,
		handleFieldInput,
		handleFieldTouch,
		initializeForm,
		initializeFormState
	} from '../services/formService.js'

	// Import enhanced screen reader announcements
	import {
		initializeScreenReaderRegions,
		announce,
		announceFormErrors,
		announceFormStatus,
		cleanupAllAnnouncements
	} from '../services/screenReaderService.js'

	// Import reCAPTCHA provider
	import { createRecaptchaProvider } from '../services/recaptcha/index.js'
	import { createLogger } from '../utils/logger.ts'

	// Import message helpers
	import { createMessageGetter } from '../utils/messages.ts'
	import { defaultMessages } from '../config/defaultMessages'

	const logger = createLogger('ContactForm')

	// Get configuration
	const config = getContactFormConfig()
	const { categories: contactCategories, fieldConfigs, categoryToFieldMap, schemas } = config
	
	// Log for debugging
	if (!schemas || !schemas.categories) {
		logger.error('ContactForm: schemas not properly initialized', { 
			config, 
			schemas, 
			hasCategories: schemas?.categories 
		})
	}

	// Props
	let {
		/**
		 * API endpoint for form submission
		 */
		apiEndpoint = '/api/contact',
		/**
		 * Initial form data
		 */
		initialData: providedInitialData = {},
		/**
		 * Localization messages
		 */
		messages = {},
		/**
		 * Function to submit contact form data
		 */
		submitContactForm = async (data: any, endpoint: string) => {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			})
			if (!response.ok) throw new Error('Form submission failed')
			return response.json()
		},
		/**
		 * Function to upload file attachments
		 */
		uploadAttachments = async (files: Array<{ file: File; preview: string }>) => {
			// Default implementation - can be overridden
			logger.warn('No uploadAttachments function provided')
			return []
		},
		/**
		 * URL to privacy policy page
		 */
		privacyPolicyUrl = '/legal/privacy-policy',
		/**
		 * URL to thank you image
		 */
		thankYouImageUrl = '/images/contact-thank-you.svg',
		/**
		 * URL to home page
		 */
		homeUrl = '/'
	}: {
		apiEndpoint?: string
		initialData?: Record<string, any>
		messages?: Record<string, string>
		submitContactForm?: (data: any, endpoint: string) => Promise<any>
		uploadAttachments?: (files: Array<{ file: File; preview: string }>) => Promise<any[]>
		privacyPolicyUrl?: string
		thankYouImageUrl?: string
		homeUrl?: string
	} = $props()

	// Initialize all possible form fields to ensure they're never undefined
	const initializeAllFormFields = (data: Record<string, any> = {}): Record<string, any> => {
		const baseFields = {
			category: data.category || 'product-feedback',
			name: data.name || '',
			email: data.email || '',
			message: data.message || '',
			coppa: data.coppa || false
		};
		
		// Add all possible fields from all categories with empty string defaults
		Object.keys(fieldConfigs).forEach(fieldName => {
			if (!(fieldName in baseFields)) {
				baseFields[fieldName] = data[fieldName] || '';
			}
		});
		
		return baseFields;
	};

	// Ensure all fields are initialized
	const initialData: Record<string, any> = initializeAllFormFields(providedInitialData);

	// Create message getter
	const getMessage = createMessageGetter({ ...defaultMessages, ...messages })
	
	// Use dynamic schema based on selected category
	const contactSchema = schemas.categories[initialData.category] || schemas.categories.general || schemas.complete

	// Initialize form state using shared service
	const formState = initializeFormState({
		attachments: [],
		selectedCategory: initialData.category,
		cachedCategory: null
	})

	let attachments: Array<{ file: File; preview: string }> = $state(formState.attachments)
	let _cachedCategory: string | null = $state(formState.cachedCategory)
	let recaptcha: any = $state(formState.recaptcha)
	let selectedCategory: string = $state(formState.selectedCategory)
	let showThankYou: boolean = $state(formState.showThankYou)
	let submissionError: string | null = $state(formState.submissionError)
	let submitting: boolean = $state(false)
	let touched: Record<string, boolean> = $state(formState.touched)
	let statusMessage: string | null = $state(null)
	let formErrors: Record<string, any> = $state({})


	// Define the submit handler using shared function
	const handleSubmit = async (formData: FormData): Promise<void> => {
		const submitHandler = createFormSubmitHandler({
			validateForm: () => !Object.values(formErrors).some(v => v),
			recaptcha,
			prepareFormData: async (formData, recaptchaToken) => {
				// Process attachments if present
				let processedAttachments = []
				if (attachments.length > 0) {
					try {
						// Enhanced status message for file uploads
						if (IS_BROWSER) {
							announce('Uploading files. Please wait...', { type: 'form' })
						}

						processedAttachments = await uploadAttachments(attachments)
					} catch (error) {
						logger.error('Error uploading files:', error)
						// Enhanced message for attachment upload failure
						if (IS_BROWSER) {
							announce('Could not upload files. Continuing without attachments.', {
								type: 'alert',
								duration: 5000
							})
						}
					}
				}

				// Return prepared form data
				return {
					...Object.fromEntries(formData),
					category: selectedCategory,
					attachments: processedAttachments,
					recaptchaToken
				}
			},
			submitForm: async (formDataToSubmit) => {
				submitting = true

				// Add accessible status message
				statusMessage = 'Submitting your form...'
				if (IS_BROWSER) {
					announceFormStatus('submitting', { messages })
				}

				return await submitContactForm(formDataToSubmit, apiEndpoint)
			},
			onSuccess: (response) => {
				// Check if the server returned a redirect URL
				if (response && response.redirectUrl) {
					// Navigate to the redirect URL
					window.location.href = response.redirectUrl;
					return;
				}
				
				// If no redirect URL, show the thank you message in place
				showThankYou = true
				window.scrollTo(0, 0)

				// Add accessibility announcement
				statusMessage = 'Your form has been submitted successfully!'
				if (IS_BROWSER) {
					announceFormStatus('success', { messages })

					// Clear saved form data after successful submission
					clearFormData(selectedCategory)
				}
			},
			onError: (error) => {
				// Custom handling for rate limiting errors
				if (error.code === 'RATE_LIMITED' && error.retryAfter) {
					const minutes = Math.ceil(error.retryAfter / 60)
					submissionError = `${ error.message }. Please try again in ${ minutes } ${ minutes === 1 ? 'minute' : 'minutes' }.`
				} else {
					submissionError = error
				}

				// Add accessibility announcement
				statusMessage = `Form submission error: ${ submissionError }`
				if (IS_BROWSER) {
					announceFormStatus('error', {
						errorMessage: submissionError,
						messages
					})
				}
			}
		})

		await submitHandler(formData)
	}

	// Initialize form with shared service
	const form = initializeForm({
		initialData,
		schema: contactSchema,
		onSubmitHandler: handleSubmit,
		extraOptions: {
			onError: ({ result }) => {
				// Handle validation errors from server
				if (result?.error) {
					submissionError = result.error

					// Enhanced accessibility announcement for form errors
					if (IS_BROWSER) {
						announceFormStatus('error', {
							errorMessage: result.error,
							messages
						})
					}
				}
			}
		}
	})

	const { form: formData, errors, enhance, validate } = form

	// Production-ready effects with minimal reactivity to prevent loops
	
	// Handle form errors only - no complex reactive dependencies
	$effect(() => {
		formErrors = errors || {}
	})
	
	// Ensure formData always has all required fields
	$effect(() => {
		// Initialize any undefined fields immediately
		Object.keys(fieldConfigs).forEach(fieldName => {
			if ($formData[fieldName] === undefined) {
				$formData[fieldName] = '';
			}
		});
	})

	// Note: Other reactive features (attachments, auto-save, category effects) 
	// are handled manually in event handlers to prevent infinite loops.
	// This is a stable, production-ready approach that avoids the deep 
	// reactivity issues between Svelte 5 and the formsnap library.

	// Initialize on mount with shared lifecycle setup
	onMount(async () => {
		if (IS_BROWSER) {
			try {
				// Initialize screen reader regions for accessibility
				initializeScreenReaderRegions()

				// Initial announcement for screen readers
				announce('Contact form loaded. Form fields are ready for input.', { type: 'status' })

				// Initialize reCAPTCHA if enabled
				if (config.recaptcha.enabled) {
					const recaptchaProvider = createRecaptchaProvider(config.recaptcha)
					recaptcha = recaptchaProvider
					// Initialize the provider
					recaptchaProvider.init().catch(error => {
						logger.error('Failed to initialize reCAPTCHA:', error)
					})
				}

				// Set up beforeunload event to notify users of unsaved data
				window.addEventListener('beforeunload', handleBeforeUnload)

				// Listen for force update events from parent component
				window.addEventListener('formCategoryForceUpdate', handleForceUpdate)
			} catch (error) {
				submissionError = error.message

				// Enhanced accessibility announcement for errors
				if (IS_BROWSER) {
					announce(`Error initializing form: ${ error.message }`, {
						type: 'alert',
						duration: 7000 // Keep error visible longer
					})
				}
			}
		}

	})

	// Clean up event listeners and resources
	onDestroy(() => {
		if (IS_BROWSER) {
			window.removeEventListener('formCategoryForceUpdate', handleForceUpdate)
			window.removeEventListener('beforeunload', handleBeforeUnload)
			// Clean up all announcements and regions
			cleanupAllAnnouncements()
		}
	})

	/**
	 * Handle beforeunload event to warn about unsaved form data
	 * @param {BeforeUnloadEvent} event - The beforeunload event
	 */
	function handleBeforeUnload(event: BeforeUnloadEvent): string | undefined {
		// Check if the form has unsaved data
		if (!showThankYou && Object.keys(touched).length > 0) {
			// Save form data before unloading
			saveFormData($formData, selectedCategory)

			// Standard way to show a confirmation dialog when leaving the page
			// Only shown if the form has been interacted with
			const message = 'You have unsaved changes. Your data has been saved and will be available when you return.'
			event.preventDefault()
			event.returnValue = message
			return message
		}
	}

	// Handler for force update events
	function handleForceUpdate(event: CustomEvent): void {
		if (event.detail && event.detail.category) {
			showThankYou = false
			selectedCategory = event.detail.category

			// Force form to update with new data
			const newData = hydrateForm({
				selectedCategory: event.detail.category,
				formData: $formData
			})

			if (newData) {
				$formData = newData
			}
		}
	}


	/**
	 * Set the selected category
	 * @param {string} value - The selected category
	 */
	function handleCategorySelect(value: string): void {
		showThankYou = false
		selectedCategory = value
		
		// Update cached category to prevent effect loops
		cachedCategory = value

		// Handle form data hydration and accessibility manually
		if (IS_BROWSER) {
			const newData = hydrateForm({
				selectedCategory: value,
				formData: $formData
			})
			if (newData) {
				$formData = newData
			}

			// Announce category change to screen readers
			announce(`Form category changed to ${ contactCategories[selectedCategory]?.label || selectedCategory }`, {
				type: 'status'
			})
			
			// Handle manual form validation announcement if there are errors
			if (Object.keys(formErrors).length > 0 && Object.keys(touched).length > 0) {
				announceFormErrors(formErrors, { messages })
			}
		}

		// Dispatch event for URL updates
		if (typeof window !== 'undefined') {
			setTimeout(() => {
				window.dispatchEvent(new CustomEvent('formCategoryChange', {
					detail: { category: value }
				}))
			}, 0)
		}
	}

	/**
	 * Handle field blur event using shared function
	 * @param {string} fieldName
	 */
	function handleBlur(fieldName: string): void {
		touched = handleFieldTouch(touched, fieldName)

		// Validate on blur for immediate feedback
		validate(fieldName)

		// Add shake animation for invalid fields
		if ($errors[fieldName] && IS_BROWSER) {
			const element = document.querySelector(`[data-name="${ fieldName }"] input, [data-name="${ fieldName }"] textarea, [data-name="${ fieldName }"] select`)
			if (element) {
				element.classList.add('field-shake')
				setTimeout(() => {
					element.classList.remove('field-shake')
				}, 500)
			}
		}
	}

	/**
	 * Handle field input event using shared function
	 * @param {string} fieldName
	 */
	function handleInput(fieldName: string): void {
		handleFieldInput(touched, fieldName, validate)
		
		// Manual auto-save functionality (avoiding reactive effects)
		if (IS_BROWSER && !submitting && !showThankYou) {
			if (Object.keys(touched).length > 0) {
				const saveDebounced = debounce(() => {
					saveFormData($formData, selectedCategory)
				}, SAVE_DEBOUNCE_DELAY)
				saveDebounced()
			}
		}
	}

	/**
	 * Handle file change event
	 * @param {Array<{file: File, preview: string}>} files
	 */
	function handleFileChange(files: Array<{ file: File; preview: string }>): void {
		attachments = files
		
		// Manually update form data with attachments (avoiding reactive effects)
		if (attachments.length > 0) {
			$formData.attachments = attachments
		}
		
		validate('attachments')
	}

	/**
	 * Handle file error event
	 * @param {string} error
	 */
	function handleFileError(error: string): void {
		validate('attachments')
		logger.error(error)

		// Enhanced accessibility announcement for file errors
		if (IS_BROWSER) {
			announce(`File error: ${ error }`, {
				type: 'alert',
				duration: 6000
			})
		}
	}

	/**
	 * Get CSS classes for a field based on validation state
	 * @param {string} fieldName - The field name
	 * @returns {string} CSS classes
	 */
	function getFieldClasses(fieldName: string): string {
		const hasError = !!$errors[fieldName]
		const isTouched = touched[fieldName]
		const value = $formData[fieldName]

		return getValidationClasses(hasError, isTouched, value)
	}
</script>

{#if showThankYou}
	<ThankYou {thankYouImageUrl} {homeUrl} {messages} />
{:else}
	<!-- Accessible status region for form feedback -->
	{#if statusMessage}
		<div class="contact-form__status-region" role="status" aria-live="polite">
			{statusMessage}
		</div>
	{/if}

	{#if submissionError}
		<div class="submission-error" role="alert">
			<AlertCircle size={18} />
			<p>{submissionError}</p>
		</div>
	{/if}

	<form class="contact-form" method="POST" use:enhance enctype="multipart/form-data" data-redirect="true">
		{#if $errors}
			<FormErrors errors={$errors} title={getMessage('formErrorsTitle', 'Please check the form for errors')} {messages} />
		{/if}

		<div class="contact-form__fields">
			<!-- Category Selector -->
			<div class="contact-form__field-group">
				<div class="contact-form__label">
					{getMessage('howCanWeHelp', 'How can we help?')}
				</div>
				<SelectMenu
					bind:value={selectedCategory}
					options={Object.entries(contactCategories).map(([value, { label }]) => ({ value, label }))}
					placeholder="Select a category"
					onchange={(value) => handleCategorySelect(value)}
					class="contact-form__select contact-form__category-select"
				/>
			</div>

			{#each categoryToFieldMap[selectedCategory] || [] as fieldName}
				{#if fieldConfigs[fieldName] && fieldName !== 'category'}
					<Field {form} name={fieldName}>
						{#snippet children({ value: _value, errors, tainted: _tainted, constraints: _constraints })}
							<Control>
								{#snippet children({ props })}
									<Label class="contact-form__label" data-name={fieldName}>
										{@html fieldConfigs[fieldName].label}
										{#if fieldName === 'attachments'}
											<UploadImage
													accept={fieldConfigs.attachments.accept}
													error={errors?.attachments}
													files={attachments}
													maxFiles={fieldConfigs.attachments.maxFiles}
													maxSize={fieldConfigs.attachments.maxSize}
													onChange={handleFileChange}
													onError={handleFileError}
											/>
										{:else if fieldConfigs[fieldName].type === 'select'}
											<div class="contact-form__validation-container">
												<SelectMenu
													bind:value={$formData[fieldName]}
													options={fieldConfigs[fieldName].options.map(option => 
														typeof option === 'object' ? option : { value: option, label: option }
													)}
													placeholder="Select {fieldConfigs[fieldName].label.replace('(optional)', '')}"
													onchange={(_value) => {
														handleInput(fieldName);
														handleBlur(fieldName);
													}}
													class="contact-form__select {getFieldClasses(fieldName)}"
												/>

												<!-- Validation icon -->
												<span class="contact-form__validation-icon" aria-hidden="true">
													{#if !errors?.[fieldName] && touched[fieldName] && $formData[fieldName]}
														<CheckCircle size={16} class="contact-form__validation-icon--state-valid" />
													{:else if errors?.[fieldName] && touched[fieldName] && $formData[fieldName]}
														<AlertCircle size={16} class="contact-form__validation-icon--state-invalid" />
													{/if}
												</span>
											</div>
										{:else if fieldConfigs[fieldName].type === 'textarea'}
											<div class="contact-form__validation-container">
												<Textarea
													bind:value={$formData[fieldName]}
													variant={touched[fieldName] && errors?.[fieldName] ? 'error' : (!errors?.[fieldName] && touched[fieldName] && $formData[fieldName] ? 'success' : 'default')}
													class="contact-form__textarea {getFieldClasses(fieldName)}"
													placeholder={fieldConfigs[fieldName].placeholder}
													rows={4}
													autoResize={true}
												/>

												<!-- Validation icon -->
												<span class="contact-form__validation-icon" aria-hidden="true">
													{#if !errors?.[fieldName] && touched[fieldName] && $formData[fieldName]}
														<CheckCircle size={16} class="contact-form__validation-icon--state-valid" />
													{:else if errors?.[fieldName] && touched[fieldName] && $formData[fieldName]}
														<AlertCircle size={16} class="contact-form__validation-icon--state-invalid" />
													{/if}
												</span>
											</div>
										{:else if fieldConfigs[fieldName].type === 'checkbox'}
											<input
													{...props}
													bind:checked={$formData[fieldName]}
													class:contact-form__field--error={touched[fieldName] && errors?.[fieldName]}
													class="contact-form__checkbox"
													onblur={() => handleBlur(fieldName)}
													oninput={() => handleInput(fieldName)}
													type="checkbox"
											/>
										{:else}
											<div class="contact-form__validation-container">
												<Input
													bind:value={$formData[fieldName]}
													variant={touched[fieldName] && errors?.[fieldName] ? 'error' : (!errors?.[fieldName] && touched[fieldName] && $formData[fieldName] ? 'success' : 'default')}
													class="contact-form__input {getFieldClasses(fieldName)}"
													placeholder={fieldConfigs[fieldName].placeholder}
													type={fieldConfigs[fieldName].type}
												/>

												<!-- Validation icon -->
												<span class="contact-form__validation-icon" aria-hidden="true">
													{#if !errors?.[fieldName] && touched[fieldName] && $formData[fieldName]}
														<CheckCircle size={16} class="contact-form__validation-icon--state-valid" />
													{:else if errors?.[fieldName] && touched[fieldName] && $formData[fieldName]}
														<AlertCircle size={16} class="contact-form__validation-icon--state-invalid" />
													{/if}
												</span>
											</div>
										{/if}

									</Label>
									{#if touched[fieldName] && errors?.[fieldName]}
										<FieldErrors />
									{/if}
								{/snippet}
							</Control>
						{/snippet}
					</Field>
				{/if}
			{/each}
		</div>
		<div class="contact-form__button-container">
			<button
					class="contact-form__submit-button"
					disabled={submitting}
					aria-busy={submitting}
			>
				{#if submitting}
					<Loader2 class="animate-spin" size={18} />
					<span>{getMessage('sending', 'Sending...')}</span>
				{:else}
					<span>{getMessage('sendMessage', 'Send Message')}</span>
					<i class="fa fa-paper-plane contact-form__icon"></i>
				{/if}
			</button>
		</div>
		<hr class="contact-form__divider contact-form__divider--top-spacing" />
		<p class="contact-form__footer-text">
			{@html getMessage('privacyText', `By submitting this form, you agree to our <a href="${ privacyPolicyUrl }" target="_blank">Privacy Policy</a>.`)}
		</p>
	</form>
{/if}

<style>

	.submission-error {
		text-align: center;
		padding: 1rem;
		color: var(--color-error-600);
		background-color: var(--color-error-50);
		border-radius: 4px;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	:global(.grecaptcha-badge) {
		display: none !important;
	}

	.contact-form__field-group {
		margin-bottom: 1.5rem;
	}

	.contact-form__field-group .contact-form__label {
		display: block;
		margin-bottom: 0.5rem;
	}

	:global(.animate-spin) {
		animation: spin 1.5s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>