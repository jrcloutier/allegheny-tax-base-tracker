<script lang="ts">
	import { onMount } from 'svelte';
	import LineChart from '$lib/components/LineChart.svelte';
	import SummaryTable from '$lib/components/SummaryTable.svelte';
	import { fetchData, calculateSummaries } from '$lib/data';
	import type { MuniRecord, MuniSummary } from '$lib/types';

	let data: MuniRecord[] = $state([]);
	let summaries: MuniSummary[] = $state([]);
	let dataAsOf: string = $state('');
	let loading: boolean = $state(true);
	let error: string | null = $state(null);

	function formatDateForDisplay(dateStr: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr + 'T00:00:00');
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	onMount(async () => {
		try {
			data = await fetchData();
			const result = calculateSummaries(data);
			summaries = result.summaries;
			dataAsOf = result.dataAsOf;
			loading = false;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load data';
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Allegheny County Assessment Dashboard</title>
</svelte:head>

<main>
	<header>
		<h1>Allegheny County Assessment Dashboard</h1>
		<p class="subtitle">Real estate values as of {formatDateForDisplay(dataAsOf)}</p>
	</header>

	{#if loading}
		<div class="loading">Loading data...</div>
	{:else if error}
		<div class="error">Error: {error}</div>
	{:else}
		<section class="chart-section">
			<h2>County-Wide Year-to-Date Change</h2>
			<LineChart {data} />
		</section>

		<section class="table-section">
			<h2>All Municipalities</h2>
			<p class="help-text">Click column headers to sort.</p>
			<SummaryTable {summaries} />
		</section>
	{/if}

	<footer>
		<p>
			Data source: <a href="https://github.com/PittsburghPG/scraper-allegheny-county-muni-profiles" target="_blank" rel="noopener">
				Allegheny County Municipal Profiles Scraper
			</a>
		</p>
	</footer>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		line-height: 1.6;
		color: #333;
	}

	main {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	header {
		text-align: center;
		margin-bottom: 2rem;
	}

	h1 {
		margin: 0 0 0.5rem;
		color: #1a1a1a;
	}

	.subtitle {
		color: #666;
		margin: 0;
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
	}

	.help-text {
		color: #666;
		font-size: 0.9rem;
		margin: 0 0 1rem;
	}

	section {
		margin-bottom: 3rem;
	}

	.loading, .error {
		text-align: center;
		padding: 3rem;
		font-size: 1.1rem;
	}

	.error {
		color: #c62828;
		background: #ffebee;
		border-radius: 8px;
	}

	footer {
		margin-top: 3rem;
		padding-top: 1rem;
		border-top: 1px solid #ddd;
		text-align: center;
		font-size: 0.85rem;
		color: #666;
	}

	footer a {
		color: #1976d2;
	}
</style>
