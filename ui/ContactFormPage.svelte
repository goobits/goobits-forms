<script>
	import ContactForm from './ContactForm.svelte'
	import { onMount, onDestroy } from 'svelte'
	import { createLogger } from '../utils/logger.js'

	const logger = createLogger('ContactFormPage')

	// Props
	let {
		// Initial data from page load
		initialData = {},
		// Configuration
		config = {},
		// URL parameter names
		categoryParam = 'type',
		thankYouValue = 'thank-you',
		defaultCategory = 'general',
		// Explicitly specify a category (takes precedence over initialData)
		category = null,
		// Optional booking mode
		bookingParam = 'booking',
		bookingCategory = 'booking',
		// Customization
		pageTitle = 'Contact Us',
		bookingPageTitle = 'Book an Appointment',
		introText = 'Have a question? Want to get in touch? Fill out the form below and we\'ll get back to you as soon as possible.',
		bookingIntroText = 'Schedule an appointment with us.',
		// ContactForm props
		contactFormProps = {},
		// Callbacks
		onCategoryChange = null,
		onUrlUpdate = null
	} = $props()

	// State
	let selectedCategory = $state(category || initialData.category || defaultCategory)
	let showThankYou = $state(false)
	let isBookingMode = $state(false)
	let currentPageTitle = $state(pageTitle)
	let isInitialRender = true

	// Get valid categories from config
	const validCategories = config.categories ? Object.keys(config.categories) : []

	// Initialize on mount
	onMount(() => {
		// Add event listeners
		window.addEventListener('popstate', handlePopState)
		window.addEventListener('formCategoryChange', handleCategoryChange)

		// Process initial URL
		handlePopState()
	})

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('popstate', handlePopState)
			window.removeEventListener('formCategoryChange', handleCategoryChange)
		}
	})

	// Handle category change event from ContactForm
	function handleCategoryChange(event) {
		if (event.detail && event.detail.category) {
			selectedCategory = event.detail.category
			updateUrl()

			// Call custom callback if provided
			if (onCategoryChange) {
				onCategoryChange(event.detail.category)
			}
		}
	}

	// Handle browser navigation
	function handlePopState() {
		const url = new URL(window.location.toString())
		const type = url.searchParams.get(categoryParam)
		const isBooking = url.searchParams.has(bookingParam)

		// Update booking mode
		if (isBooking) {
			isBookingMode = true
			currentPageTitle = bookingPageTitle
			if (!validCategories.includes(type)) {
				selectedCategory = bookingCategory
			}
		} else {
			isBookingMode = false
			currentPageTitle = pageTitle
		}

		// Handle page state based on URL
		if (type === thankYouValue) {
			showThankYou = true
		} else if (validCategories.includes(type)) {
			showThankYou = false
			selectedCategory = type

			// Force form update
			setTimeout(() => {
				if (typeof window !== 'undefined') {
					window.dispatchEvent(new CustomEvent('formCategoryForceUpdate', {
						detail: { category: type }
					}))
				}
			}, 0)
		} else {
			showThankYou = false
			selectedCategory = defaultCategory
		}

		window.scrollTo(0, 0)
	}

	// Update URL based on state
	function updateUrl() {
		if (typeof window === 'undefined') return

		const currentUrl = new URL(window.location.toString())
		const newUrl = new URL(window.location.toString())

		// Set URL parameters
		if (showThankYou) {
			newUrl.searchParams.set(categoryParam, thankYouValue)
		} else {
			newUrl.searchParams.set(categoryParam, selectedCategory)
		}

		if (isBookingMode) {
			newUrl.searchParams.set(bookingParam, 'true')
		} else {
			newUrl.searchParams.delete(bookingParam)
		}

		// Only update if changed
		if (newUrl.toString() !== currentUrl.toString()) {
			try {
				// Use history.pushState for better control
				window.history.pushState({}, '', newUrl.toString())

				// Call custom callback if provided
				if (onUrlUpdate) {
					onUrlUpdate(newUrl)
				}
			} catch (error) {
				logger.warn('Could not update URL:', error)
			}
		}
	}

	// Watch for state changes
	$effect(() => {
		if (!isInitialRender) {
			updateUrl()
		}
	})

	// After first render
	$effect(() => {
		isInitialRender = false
	})
</script>

{#key showThankYou}
	<h1 class="contact-form-page__title">{currentPageTitle}</h1>
	{#if isBookingMode}
		<p class="contact-form-page__intro">{@html bookingIntroText}</p>
	{:else}
		<p class="contact-form-page__intro">{@html introText}</p>
	{/if}

	<ContactForm
			initialData={{...initialData, category: selectedCategory}}
			{...contactFormProps}
	/>
{/key}

<style>
	.contact-form-page__title {
		text-align: center;
		margin-bottom: 1rem;
	}

	.contact-form-page__intro {
		text-align: center;
		margin-bottom: 2rem;
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;
	}
</style>