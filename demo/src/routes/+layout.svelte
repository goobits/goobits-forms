<script lang="ts">
	import {
		CodeTabsHydrator,
		FileTreeHydrator,
		MermaidHydrator,
		ScreenshotHydrator
	} from '@goobits/docs-engine/components';
	import '@goobits/docs-engine/styles';
	import './app.css';
</script>

<CodeTabsHydrator theme="dracula" />
<FileTreeHydrator allowCopy={true} />
<MermaidHydrator />
<ScreenshotHydrator />

<div class="app">
	<header>
		<h1>@goobits/forms Demo</h1>
		<nav>
			<a href="/">Home</a>
			<a href="/docs">Docs</a>
			<a href="/examples">Examples</a>
		</nav>
	</header>

	<main>
		<slot />
	</main>

	<footer>
		<p>Built with @goobits/forms and @goobits/docs-engine</p>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	header {
		padding: 1rem 2rem;
		background: #1e1e1e;
		color: white;
		border-bottom: 2px solid #333;
	}

	header h1 {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
	}

	nav {
		display: flex;
		gap: 1.5rem;
	}

	nav a {
		color: #888;
		text-decoration: none;
		transition: color 0.2s;
	}

	nav a:hover {
		color: white;
	}

	main {
		flex: 1;
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}

	footer {
		padding: 1rem;
		text-align: center;
		background: #f5f5f5;
		color: #666;
		font-size: 0.875rem;
	}
</style>
