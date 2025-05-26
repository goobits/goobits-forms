<script>
	import { ContactFormPage } from 'packages/forms'
	import { getContactFormConfig } from '@goobits/contactform/config'
	
	export let data
	
	const config = getContactFormConfig()
</script>

<main class="contact-page">
	<ContactFormPage
		{config}
		initialData={data.form}
		defaultCategory="general"
		privacyPolicyUrl="/legal/privacy-policy"
		thankYouImageUrl="/images/thank-you.svg"
		homeUrl="/"
	/>
</main>

<style>
	.contact-page {
		padding: 2rem;
		max-width: 800px;
		margin: 0 auto;
	}
</style>