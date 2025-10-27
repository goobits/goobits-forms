<script>
	import { Loader2 } from '@lucide/svelte'

	/**
	 * SubmitButton - Contact form submit button with loading state
	 *
	 * @component
	 * Part of ContactForm - extracted for maintainability
	 *
	 * @prop {boolean} submitting - Whether form is currently submitting
	 * @prop {Function} getMessage - Message getter function
	 */

	let { submitting, getMessage } = $props()
</script>

<div class="contact-form__button-container">
	<button class="contact-form__submit-button" disabled={submitting} aria-busy={submitting}>
		{#if submitting}
			<Loader2 class="animate-spin" size={18} />
			<span>{getMessage('sending', 'Sending...')}</span>
		{:else}
			<span>{getMessage('sendMessage', 'Send Message')}</span>
			<i class="fa fa-paper-plane contact-form__icon"></i>
		{/if}
	</button>
</div>

<style>
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
