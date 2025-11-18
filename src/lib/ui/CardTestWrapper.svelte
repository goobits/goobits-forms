<script lang="ts">
	import Card from './Card.svelte';
	import CardHeader from './CardHeader.svelte';
	import CardBody from './CardBody.svelte';
	import CardFooter from './CardFooter.svelte';

	let {
		testType = 'card-with-children',
		...props
	}: {
		testType?: string;
		[key: string]: any;
	} = $props();
</script>

{#if testType === 'card-with-children'}
	<Card {...props}>Test content</Card>
{:else if testType === 'card-with-structure'}
	<Card {...props}>
		<div class="card__header">Header</div>
		<div class="card__body">Body</div>
		<div class="card__footer">Footer</div>
	</Card>
{:else if testType === 'header-with-children'}
	<CardHeader {...props}>Custom content</CardHeader>
{:else if testType === 'header-with-actions'}
	<CardHeader title="Title" {...props}>
		{#snippet actions()}
			Action Button
		{/snippet}
	</CardHeader>
{:else if testType === 'header-with-both'}
	<CardHeader {...props}>
		{#snippet actions()}
			Actions
		{/snippet}
		Custom
	</CardHeader>
{:else if testType === 'body-with-children'}
	<CardBody {...props}>Body content</CardBody>
{:else if testType === 'footer-with-children'}
	<CardFooter {...props}>Footer content</CardFooter>
{/if}
