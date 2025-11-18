<script lang="ts">
	import { AlertCircle } from '@lucide/svelte';
	import { onMount } from 'svelte';
	// Check if we're in browser
	const browser: boolean = typeof window !== 'undefined';

	/**
	 * Form errors object containing error messages
	 */
	let {
		errors,
		title = 'Form problem'
	}: {
		errors: { _errors?: string[] };
		title?: string;
	} = $props();

	/**
	 * Reference to the error container element
	 */
	let errorContainer: HTMLElement | null = $state(null);

	// Focus the error container when it appears
	onMount(() => {
		if (browser && errors?._errors?.length && errorContainer) {
			// Use a slight delay to ensure screen readers announce the alert
			setTimeout(() => {
				errorContainer.focus();
			}, 100);
		}
	});
</script>

{#if errors?._errors?.length}
	<div
		class="form-error"
		role="alert"
		aria-live="assertive"
		tabindex="-1"
		bind:this={errorContainer}
	>
		<div class="form-error__icon-wrapper" aria-hidden="true">
			<AlertCircle size={16} />
		</div>
		<strong class="form-error__title" id="error-heading">{title}</strong>
		<ul class="form-error__list" aria-labelledby="error-heading">
			{#each errors._errors as error (error)}
				<li class="form-error__item">{error}</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	@import './FormErrors.css';
</style>
