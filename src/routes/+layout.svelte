<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<footer>
	<p>Made by <a href="https://jrcloutier.com" target="_blank" rel="noopener">Jimmy Cloutier</a> with help from <a href="https://claude.ai" target="_blank" rel="noopener">Claude.ai</a></p>
</footer>

<style>
	footer {
		text-align: center;
		padding: 0 1rem 1.5rem;
		margin-top: -3.5rem;
		font-family: 'Noto Sans Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 0.8rem;
		color: #888;
		background: transparent;
		position: relative;
	}

	footer p {
		margin: 0;
	}

	footer a {
		color: #888;
		text-decoration: underline;
	}

	footer a:hover {
		color: #555;
	}
</style>
