<script lang="ts">
	import { ContactForm } from '@goobits/forms/ui';
	import '@goobits/forms/ui/variables.css';
	import '@goobits/forms/ui/ContactForm.css';
</script>

<svelte:head>
	<title>@goobits/forms Demo</title>
</svelte:head>

<div class="hero">
	<h1>@goobits/forms Demo</h1>
	<p class="subtitle">
		Production-ready forms for SvelteKit with validation, security, and email delivery
	</p>
</div>

<section class="features">
	<div class="feature">
		<h3>✨ Type-Safe</h3>
		<p>Built with TypeScript and Zod for complete type safety</p>
	</div>
	<div class="feature">
		<h3>🔒 Secure</h3>
		<p>CSRF protection, reCAPTCHA, and rate limiting built-in</p>
	</div>
	<div class="feature">
		<h3>📧 Email Ready</h3>
		<p>Send emails via Nodemailer, AWS SES, or custom providers</p>
	</div>
</section>

<section class="demo-form">
	<h2>Try it yourself</h2>
	<p>This is a live demo of ContactForm component:</p>

	<ContactForm apiEndpoint="/api/contact" />
</section>

<style>
	.hero {
		text-align: center;
		padding: 3rem 0;
		border-bottom: 1px solid #e0e0e0;
	}

	.hero h1 {
		margin: 0 0 1rem 0;
		font-size: 3rem;
	}

	.subtitle {
		font-size: 1.25rem;
		color: #666;
		max-width: 600px;
		margin: 0 auto;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		padding: 3rem 0;
	}

	.feature {
		padding: 2rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		text-align: center;
	}

	.feature h3 {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
	}

	.demo-form {
		padding: 3rem 0;
	}

	.demo-form h2 {
		margin: 0 0 0.5rem 0;
	}

	.demo-form p {
		color: #666;
		margin: 0 0 2rem 0;
	}
</style>
