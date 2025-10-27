<script>
	import './ContactForm.css'
	import FormErrors from './FormErrors.svelte'
	import ThankYou from './ThankYou.svelte'
	import CategorySelector from './ContactFormParts/CategorySelector.svelte'
	import FieldRenderer from './ContactFormParts/FieldRenderer.svelte'
	import SubmitButton from './ContactFormParts/SubmitButton.svelte'
	import FormFooter from './ContactFormParts/FormFooter.svelte'
	import { onDestroy, onMount } from 'svelte'
	import { z } from 'zod'
	import { AlertCircle } from '@lucide/svelte'

	import { getContactFormConfig } from '../config/index.ts'
	import { hydrateForm } from '../services/formHydration.ts'
	import { debounce } from '../utils/debounce.ts'
	import { saveFormData, clearFormData } from '../services/formStorage.ts'
	import { IS_BROWSER, SAVE_DEBOUNCE_DELAY } from '../utils/constants.ts'

	// Import shared form service functions
	import {
		createFormSubmitHandler,
		handleFieldInput,
		handleFieldTouch,
		initializeForm,
		initializeFormState
	} from '../services/formService.ts'

	// Import enhanced screen reader announcements
	import {
		initializeScreenReaderRegions,
		announce,
		announceFormErrors,
		announceFormStatus,
		cleanupAllAnnouncements
	} from '../services/screenReaderService.js'

	// Import reCAPTCHA provider
	import { createRecaptchaProvider } from '../services/recaptcha/index.ts'
	import { createLogger } from '../utils/logger.ts'

	// Import message helpers
	import { createMessageGetter } from '../utils/messages.ts'
	import { defaultMessages } from '../config/defaultMessages'

	const logger = createLogger('ContactForm')

	// Get configuration
	const config = getContactFormConfig();
	const { categories: contactCategories, fieldConfigs, categoryToFieldMap, schemas } = config;

	// Log for debugging
	if (!schemas || !schemas.categories) {
		logger.error('ContactForm: schemas not properly initialized', {
			config,
			schemas,
			hasCategories: schemas?.categories
		});
	}

	// Props
	let {
		apiEndpoint = '/api/contact',
		initialData: providedInitialData = {},
		messages = {},
		submitContactForm = async (data, endpoint) => {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			})
			if (!response.ok) throw new Error('Form submission failed')
			return response.json()
		},
		uploadAttachments = async () => {
			logger.warn('No uploadAttachments function provided')
			return []
		},
		privacyPolicyUrl = '/legal/privacy-policy',
		thankYouImageUrl = '/images/contact-thank-you.svg',
		homeUrl = '/'
	} = $props()

	// Initialize all possible form fields to ensure they're never undefined
	const initializeAllFormFields = (data = {}) => {
		const baseFields = {
			category: data.category || 'product-feedback',
			name: data.name || '',
			email: data.email || '',
			message: data.message || '',
			coppa: data.coppa || false
		}

		// Add all possible fields from all categories with empty string defaults
		Object.keys(fieldConfigs).forEach((fieldName) => {
			if (!(fieldName in baseFields)) {
				baseFields[fieldName] = data[fieldName] || ''
			}
		})

		return baseFields
	}

	// Ensure all fields are initialized
	const initialData = initializeAllFormFields(providedInitialData)

	// Create message getter
	const getMessage = createMessageGetter({ ...defaultMessages, ...messages });

	// Create fallback schema if none provided
	function createFallbackSchema() {
		return z.object({
			name: z.string().default(''),
			email: z.string().email().default(''),
			message: z.string().default(''),
			category: z.string().default('general')
		});
	}

	// Use dynamic schema based on selected category with fallback
	const contactSchema =
		schemas.categories?.[initialData.category] ||
		schemas.categories?.['general'] ||
		schemas.complete ||
		createFallbackSchema();

	// Initialize form state using shared service
	const formState = initializeFormState({
		attachments: [],
		selectedCategory: initialData.category
	})

	let attachments = $state(formState.attachments)
	let recaptcha = $state(formState.recaptcha)
	let selectedCategory = $state(formState.selectedCategory)
	let showThankYou = $state(formState.showThankYou)
	let submissionError = $state(formState.submissionError)
	let submitting = $state(false)
	let touched = $state(formState.touched)
	let statusMessage = $state(null)

	// Define the submit handler using shared function
	const handleSubmit = async (formData) => {
		const submitHandler = createFormSubmitHandler({
			validateForm: () => !Object.values(formErrors).some((v) => v),
			recaptcha,
			prepareFormData: async (formData, recaptchaToken) => {
				// Process attachments if present
				let processedAttachments = [];
				if (attachments.length > 0) {
					try {
						// Enhanced status message for file uploads
						if (IS_BROWSER) {
							announce('Uploading files. Please wait...', { type: 'form' });
						}

						processedAttachments = await uploadAttachments(attachments);
					} catch (error) {
						logger.error('Error uploading files:', error);
						// Enhanced message for attachment upload failure
						if (IS_BROWSER) {
							announce('Could not upload files. Continuing without attachments.', {
								type: 'alert',
								duration: 5000
							});
						}
					}
				}

				// Return prepared form data
				return {
					...Object.fromEntries(formData),
					category: selectedCategory,
					attachments: processedAttachments,
					recaptchaToken
				};
			},
			submitForm: async (formDataToSubmit) => {
				submitting = true;

				// Add accessible status message
				statusMessage = 'Submitting your form...';
				if (IS_BROWSER) {
					announceFormStatus('submitting', { messages });
				}

				return await submitContactForm(formDataToSubmit, apiEndpoint);
			},
			onSuccess: (response) => {
				// Check if the server returned a redirect URL
				if (response && response.redirectUrl) {
					// Navigate to the redirect URL
					window.location.href = response.redirectUrl;
					return;
				}

				// If no redirect URL, show the thank you message in place
				showThankYou = true;
				window.scrollTo(0, 0);

				// Add accessibility announcement
				statusMessage = 'Your form has been submitted successfully!';
				if (IS_BROWSER) {
					announceFormStatus('success', { messages });

					// Clear saved form data after successful submission
					clearFormData(selectedCategory);
				}
			},
			onError: (error) => {
				// Custom handling for rate limiting errors
				if (error.code === 'RATE_LIMITED' && error.retryAfter) {
					const minutes = Math.ceil(error.retryAfter / 60);
					submissionError = `${error.message}. Please try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`;
				} else {
					submissionError = error;
				}

				// Add accessibility announcement
				statusMessage = `Form submission error: ${submissionError}`;
				if (IS_BROWSER) {
					announceFormStatus('error', {
						errorMessage: submissionError,
						messages
					});
				}
			}
		});

		await submitHandler(formData);
	};

	// Initialize form with shared service
	const form = initializeForm({
		initialData,
		schema: contactSchema,
		onSubmitHandler: handleSubmit,
		extraOptions: {
			onError: ({ result }) => {
				// Handle validation errors from server
				if (result?.error) {
					submissionError = result.error;

					// Enhanced accessibility announcement for form errors
					if (IS_BROWSER) {
						announceFormStatus('error', {
							errorMessage: result.error,
							messages
						});
					}
				}
			}
		}
	});

	const { form: formData, errors, enhance, validate } = form;
	const formErrors = $derived(errors || {});

	// Production-ready effects with minimal reactivity to prevent loops

	// Ensure formData always has all required fields
	$effect(() => {
		// Initialize any undefined fields immediately
		Object.keys(fieldConfigs).forEach((fieldName) => {
			if ($formData[fieldName] === undefined) {
				$formData[fieldName] = '';
			}
		});
	});

	// Note: Other reactive features (attachments, auto-save, category effects)
	// are handled manually in event handlers to prevent infinite loops.
	// This is a stable, production-ready approach that avoids the deep
	// reactivity issues between Svelte 5 and the formsnap library.

	// Initialize on mount with shared lifecycle setup
	onMount(async () => {
		if (IS_BROWSER) {
			try {
				// Initialize screen reader regions for accessibility
				initializeScreenReaderRegions();

				// Initial announcement for screen readers
				announce('Contact form loaded. Form fields are ready for input.', { type: 'status' });

				// Initialize reCAPTCHA if enabled
				if (config.recaptcha.enabled) {
					const recaptchaProvider = createRecaptchaProvider(config.recaptcha);
					recaptcha = recaptchaProvider;
					// Initialize the provider
					recaptchaProvider.init().catch((error) => {
						logger.error('Failed to initialize reCAPTCHA:', error);
					});
				}

				// Set up beforeunload event to notify users of unsaved data
				window.addEventListener('beforeunload', handleBeforeUnload);

				// Listen for force update events from parent component
				window.addEventListener('formCategoryForceUpdate', handleForceUpdate);
			} catch (error) {
				submissionError = error.message;

				// Enhanced accessibility announcement for errors
				if (IS_BROWSER) {
					announce(`Error initializing form: ${error.message}`, {
						type: 'alert',
						duration: 7000 // Keep error visible longer
					});
				}
			}
		}
	});

	// Clean up event listeners and resources
	onDestroy(() => {
		if (IS_BROWSER) {
			window.removeEventListener('formCategoryForceUpdate', handleForceUpdate);
			window.removeEventListener('beforeunload', handleBeforeUnload);
			// Clean up all announcements and regions
			cleanupAllAnnouncements();
		}
	});

	function handleBeforeUnload(event) {
		// Check if the form has unsaved data
		if (!showThankYou && Object.keys(touched).length > 0) {
			// Save form data before unloading
			saveFormData($formData, selectedCategory);

			// Standard way to show a confirmation dialog when leaving the page
			// Only shown if the form has been interacted with
			const message =
				'You have unsaved changes. Your data has been saved and will be available when you return.';
			event.preventDefault();
			event.returnValue = message;
			return message;
		}
	}

	// Handler for force update events
	function handleForceUpdate(event) {
		if (event.detail && event.detail.category) {
			showThankYou = false;
			selectedCategory = event.detail.category;

			// Force form to update with new data
			const newData = hydrateForm({
				selectedCategory: event.detail.category,
				formData: $formData
			});

			if (newData) {
				$formData = newData;
			}
		}
	}

	function handleCategorySelect(value) {
		showThankYou = false;
		selectedCategory = value;

		// Handle form data hydration and accessibility manually
		if (IS_BROWSER) {
			const newData = hydrateForm({
				selectedCategory: value,
				formData: $formData
			});
			if (newData) {
				$formData = newData;
			}

			// Announce category change to screen readers
			announce(
				`Form category changed to ${contactCategories[selectedCategory]?.label || selectedCategory}`,
				{
					type: 'status'
				}
			);

			// Handle manual form validation announcement if there are errors
			if (Object.keys(formErrors).length > 0 && Object.keys(touched).length > 0) {
				announceFormErrors(formErrors, { messages });
			}
		}

		// Dispatch event for URL updates
		if (typeof window !== 'undefined') {
			setTimeout(() => {
				window.dispatchEvent(
					new CustomEvent('formCategoryChange', {
						detail: { category: value }
					})
				);
			}, 0);
		}
	}

	function handleBlur(fieldName) {
		touched = handleFieldTouch(touched, fieldName);

		// Validate on blur for immediate feedback
		validate(fieldName);

		// Add shake animation for invalid fields
		if ($errors[fieldName] && IS_BROWSER) {
			const element = document.querySelector(
				`[data-name="${fieldName}"] input, [data-name="${fieldName}"] textarea, [data-name="${fieldName}"] select`
			);
			if (element) {
				element.classList.add('field-shake');
				setTimeout(() => {
					element.classList.remove('field-shake');
				}, 500);
			}
		}
	}

	function handleInput(fieldName) {
		handleFieldInput(touched, fieldName, validate);

		// Manual auto-save functionality (avoiding reactive effects)
		if (IS_BROWSER && !submitting && !showThankYou) {
			if (Object.keys(touched).length > 0) {
				const saveDebounced = debounce(() => {
					saveFormData($formData, selectedCategory);
				}, SAVE_DEBOUNCE_DELAY);
				saveDebounced();
			}
		}
	}

	function handleFileChange(files) {
		attachments = files;

		// Manually update form data with attachments (avoiding reactive effects)
		if (attachments.length > 0) {
			$formData.attachments = attachments;
		}

		validate('attachments');
	}

	function handleFileError(error) {
		validate('attachments');
		logger.error(error);

		// Enhanced accessibility announcement for file errors
		if (IS_BROWSER) {
			announce(`File error: ${error}`, {
				type: 'alert',
				duration: 6000
			});
		}
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

	<form
		class="contact-form"
		method="POST"
		use:enhance
		enctype="multipart/form-data"
		data-redirect="true"
	>
		{#if $errors}
			<FormErrors
				errors={$errors}
				title={getMessage('formErrorsTitle', 'Please check the form for errors')}
				{messages}
			/>
		{/if}

		<div class="contact-form__fields">
			<CategorySelector
				bind:value={selectedCategory}
				categories={contactCategories}
				onChange={handleCategorySelect}
				{getMessage}
			/>

			{#each categoryToFieldMap[selectedCategory] || [] as fieldName (fieldName)}
				{#if fieldConfigs[fieldName] && fieldName !== 'category'}
					<FieldRenderer
						{form}
						{fieldName}
						fieldConfig={fieldConfigs[fieldName]}
						formData={$formData}
						errors={$errors}
						{touched}
						{attachments}
						onBlur={handleBlur}
						onInput={handleInput}
						onFileChange={handleFileChange}
						onFileError={handleFileError}
					/>
				{/if}
			{/each}
		</div>

		<SubmitButton {submitting} {getMessage} />

		<FormFooter {privacyPolicyUrl} {getMessage} />
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

	.contact-form__status-region {
		position: absolute;
		left: -10000px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}
</style>
