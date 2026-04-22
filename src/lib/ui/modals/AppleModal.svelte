<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import Modal from './Modal.svelte';
	import './shared-styles.css';

	interface Props {
		isVisible?: boolean;
		title?: string;
		icon?: Component<Record<string, unknown>> | null;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
		showHeader?: boolean;
		onClose?: () => void;
		footer?: Snippet;
		children?: Snippet;
	}

	const {
		isVisible = false,
		title = '',
		icon = null,
		size = 'md',
		showHeader = true,
		onClose,
		footer,
		children
	}: Props = $props();
</script>

{#snippet header()}
	{#if showHeader}
		<div class="modal-apple__header">
			<h2 class="modal-apple__title">
				{#if icon}
					<svelte:component this={icon} class="modal-apple__title-icon" />
				{/if}
				{title}
			</h2>
		</div>
	{/if}
{/snippet}

<Modal {isVisible} {onClose} {size} variant="apple" {footer}>
	<div class="modal-apple">
		{#if showHeader}
			{@render header()}
		{/if}

		<div class="modal-apple__content">
			{#if children}
				{@render children()}
			{/if}
		</div>
	</div>
</Modal>

<style>
	/* Component-specific styles can go here if needed */
	/* Most styling comes from shared-styles.css */
</style>
