<script>
	import { onMount } from 'svelte'
	// browser check can be done inline
	const browser = typeof window !== 'undefined'
	
	// Import message helpers
	import { createMessageGetter } from '../utils/messages.js'
	import { defaultMessages } from '../config/defaultMessages.js'
	
	// Props
	let {
		thankYouImageUrl = '/images/contact-thank-you.svg',
		homeUrl = '/',
		messages = {}
	} = $props()
	
	// Create message getter
	const getMessage = createMessageGetter({ ...defaultMessages, ...messages })
	
	let thankYouContainer = $state()
	
	// Focus the thank you message when it appears
	onMount(() => {
		if (browser && thankYouContainer) {
			// Set focus to the container for screen readers to announce the message
			setTimeout(() => {
				thankYouContainer.focus()
			}, 100)
		}
	})
</script>

<div 
	class="thank-you" 
	role="status" 
	aria-live="polite" 
	tabindex="-1"
	bind:this={thankYouContainer}
>
	<h1 class="thank-you__heading" id="thank-you-title">
		<img 
			src={thankYouImageUrl} 
			alt={getMessage('thankYouAlt', 'Thank You!')}
			class="thank-you__image"
		/>
	</h1>
	<hr class="thank-you__divider" aria-hidden="true" />
	<h3 class="thank-you__message" aria-labelledby="thank-you-title">
		{getMessage('thankYouMessage', 'Thank you for your message!')}<br>
		<span class="thank-you__sub-message">{getMessage('thankYouSubMessage', "We'll get back to you as soon as possible 🌈")}</span>
	</h3>
	<div class="thank-you__actions">
		<a href={homeUrl} class="thank-you__button">{getMessage('returnToHome', 'Return to Home')}</a>
	</div>
</div>

<style lang="scss">
	@use './ThankYou.scss';
</style>