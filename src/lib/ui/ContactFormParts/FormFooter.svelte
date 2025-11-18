<script>
	/**
	 * FormFooter - Contact form footer with privacy policy text
	 *
	 * @component
	 * Part of ContactForm - extracted for maintainability
	 *
	 * @prop {string} privacyPolicyUrl - URL to privacy policy page
	 * @prop {Function} getMessage - Message getter function
	 */

	let { privacyPolicyUrl, getMessage } = $props()
</script>

<hr class="contact-form__divider contact-form__divider--top-spacing" />
<p class="contact-form__footer-text">
	{@html getMessage(
		'privacyText',
		`By submitting this form, you agree to our <a href="${privacyPolicyUrl}" target="_blank">Privacy Policy</a>.`
	)}
</p>
