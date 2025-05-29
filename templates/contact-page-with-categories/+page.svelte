<script>
	import { page } from '$app/stores'
	import CategoryContactForm from '../../ui/CategoryContactForm.svelte'
	import { generateCsrfToken } from '../../security/csrf.js'
	
	// Import configuration - this should be adjusted based on your project structure
	// You would typically import from your app's config
	// import { contactConfig } from '$lib/config/contact.js'
	
	// For the template, we'll use a prop
	export let contactConfig = {}
	export let messages = {}
	
	// Get data from the loader
	let { data, form } = $props()
	
	// Destructure and set defaults
	const {
		showThankYou = false,
		categorySlug = 'general'
	} = data || {}
	
	// Current category
	const category = contactConfig.categories?.[categorySlug] || contactConfig.categories?.general || { label: 'Contact Us' }
	
	// Generate CSRF token for form security
	let csrfToken = ''
	$: {
		generateCsrfToken().then(token => {
			csrfToken = token
		})
	}
	
	// Handle form submission - the CategoryContactForm component will handle this
	function handleFormSubmit(event) {
		// This is handled by SvelteKit's form actions
		// The form will be submitted to the server
	}
	
	// Get message from the messages object or use default
	function getMessage(key, defaultValue) {
		return messages[key] || defaultValue
	}
</script>

<svelte:head>
	<title>{getMessage('contact_title', 'Contact Us')} - {contactConfig.appName || 'Contact Form'}</title>
	<meta name="description" content={getMessage('contact_description', 'Get in touch with us through our contact form.')} />
</svelte:head>

<main class="contact-page">
	<div class="container">
		<header class="contact-header">
			<h1>{getMessage('contact_title', 'Contact Us')}</h1>
			<p>{getMessage('contact_description', 'Get in touch with us. We\'d love to hear from you!')}</p>
		</header>

		{#if showThankYou}
			<div class="thank-you">
				<h2>{getMessage('contact_thank_you_title', 'Thank You!')}</h2>
				<p>{getMessage('contact_thank_you_message', 'Your message has been sent successfully.')}</p>
				<p>{getMessage('contact_thank_you_sub', 'We\'ll get back to you as soon as possible.')}</p>
				<a href="/" class="btn btn-primary">{getMessage('contact_return_home', 'Return to Home')}</a>
			</div>
		{:else}
			<div class="contact-form-wrapper">
				{#if Object.keys(contactConfig.categories || {}).length > 1}
					<div class="category-selector">
						<label for="category-select">{getMessage('contact_how_help', 'How can we help you?')}</label>
						<select 
							id="category-select" 
							value={categorySlug} 
							on:change={e => {
								const newCategory = e.target.value
								const baseUrl = $page.url.pathname.split('/contact/')[0]
								window.location.href = `${baseUrl}/contact/${newCategory}`
							}}
						>
							{#each Object.entries(contactConfig.categories || {}) as [key, cat]}
								<option value={key}>{cat.label}</option>
							{/each}
						</select>
					</div>
				{/if}

				<CategoryContactForm 
					config={contactConfig}
					categorySlug={categorySlug}
					form={form}
					messages={messages}
					on:submit={handleFormSubmit}
				/>
			</div>
		{/if}
	</div>
</main>

<style>
	.contact-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.contact-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.contact-header h1 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	.category-selector {
		margin-bottom: 2rem;
	}

	.category-selector label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.category-selector select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
	}

	.thank-you {
		text-align: center;
		padding: 3rem;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.thank-you h2 {
		color: #28a745;
		margin-bottom: 1rem;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		text-decoration: none;
		display: inline-block;
		text-align: center;
	}

	.btn-primary {
		background: #007bff;
		color: white;
	}

	.btn-primary:hover {
		background: #0056b3;
	}
</style>