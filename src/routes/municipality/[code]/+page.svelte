<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import MuniFacetedLineChart from '$lib/components/MuniFacetedLineChart.svelte';
	import { fetchData, fetchMillageRates, getMuniSummary } from '$lib/data';
	import type { MuniRecord, MuniSummary } from '$lib/types';

	let data: MuniRecord[] = $state([]);
	let summary: MuniSummary | null = $state(null);
	let loading: boolean = $state(true);
	let error: string | null = $state(null);

	let muniCode = $derived($page.params.code);

	function formatDateForDisplay(dateStr: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr + 'T00:00:00');
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function formatCurrency(value: number): string {
		if (Math.abs(value) >= 1e9) {
			return '$' + (value / 1e9).toFixed(2) + 'B';
		} else if (Math.abs(value) >= 1e6) {
			return '$' + (value / 1e6).toFixed(2) + 'M';
		} else if (Math.abs(value) >= 1e3) {
			return '$' + (value / 1e3).toFixed(1) + 'K';
		}
		return '$' + value.toFixed(0);
	}

	function formatPercent(value: number): string {
		if (value === 0) return '0.00%';
		const iconClass = value > 0 ? 'fa-arrow-up' : 'fa-arrow-down';
		return `<i class="fa-solid ${iconClass}"></i> ${Math.abs(value).toFixed(2)}%`;
	}

	function formatChange(value: number): string {
		const sign = value >= 0 ? '+' : '-';
		return `${sign}$${formatCurrencyAbs(Math.abs(value))}`;
	}

	function formatCurrencyAbs(value: number): string {
		if (value >= 1e9) {
			return (value / 1e9).toFixed(2) + 'B';
		} else if (value >= 1e6) {
			return (value / 1e6).toFixed(2) + 'M';
		} else if (value >= 1e3) {
			return (value / 1e3).toFixed(1) + 'K';
		}
		return value.toFixed(0);
	}

	function formatTaxImpact(value: number | null): string {
		if (value === null) return 'N/A';
		const sign = value >= 0 ? '+' : '-';
		return `${sign}$${formatCurrencyAbs(Math.abs(value))}`;
	}

	function formatTaxImpactPct(value: number | null): string {
		if (value === null) return 'N/A';
		if (value === 0) return '0.00%';
		const iconClass = value > 0 ? 'fa-arrow-up' : 'fa-arrow-down';
		return `<i class="fa-solid ${iconClass}"></i> ${Math.abs(value).toFixed(2)}%`;
	}

	onMount(async () => {
		try {
			const [muniData, millageRates] = await Promise.all([
				fetchData(),
				fetchMillageRates()
			]);
			data = muniData;
			summary = getMuniSummary(data, millageRates, muniCode);
			if (!summary) {
				error = 'Municipality not found';
			}
			loading = false;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load data';
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{summary?.municipality || 'Municipality'} | Allegheny County Tax Base Tracker</title>
</svelte:head>

<main>
	<header>
		<h1>Allegheny County Tax Base Tracker</h1>
		<p class="subtitle">Real estate values as of {formatDateForDisplay(summary?.dataAsOf || '')}</p>
	</header>

	{#if loading}
		<div class="loading">Loading data...</div>
	{:else if error}
		<div class="error">Error: {error}</div>
	{:else if summary}
		<div class="muni-header">
			<a href="/" class="back-link">
				<span class="back-arrow">←</span>
				Back to Dashboard
			</a>
			<h2>{summary.municipality}</h2>
		</div>

		<section class="chart-section">
			<MuniFacetedLineChart {data} muniCode={muniCode} muniName={summary.municipality} />

			<div class="summary-boxes">
				<div class="summary-box">
					<h4 class="box-title">Taxable Value</h4>
					<div class="box-row">
						<span class="label">Start of Year</span>
						<span class="value">{formatCurrency(summary.taxable.startOfYear)}</span>
					</div>
					<div class="box-row">
						<span class="label">Current</span>
						<span class="value">{formatCurrency(summary.taxable.current)}</span>
					</div>
					<div class="box-row">
						<span class="label">Change</span>
						<span class="value" class:positive={summary.taxable.change > 0} class:negative={summary.taxable.change < 0}>
							{formatChange(summary.taxable.change)}
						</span>
					</div>
					<div class="box-row">
						<span class="label">% Change</span>
						<span class="value" class:positive={summary.taxable.pctChange > 0} class:negative={summary.taxable.pctChange < 0}>
							{@html formatPercent(summary.taxable.pctChange)}
						</span>
					</div>
				</div>

				<div class="summary-box">
					<h4 class="box-title">Tax Exempt Value</h4>
					<div class="box-row">
						<span class="label">Start of Year</span>
						<span class="value">{formatCurrency(summary.exempt.startOfYear)}</span>
					</div>
					<div class="box-row">
						<span class="label">Current</span>
						<span class="value">{formatCurrency(summary.exempt.current)}</span>
					</div>
					<div class="box-row">
						<span class="label">Change</span>
						<span class="value" class:positive={summary.exempt.change > 0} class:negative={summary.exempt.change < 0}>
							{formatChange(summary.exempt.change)}
						</span>
					</div>
					<div class="box-row">
						<span class="label">% Change</span>
						<span class="value" class:positive={summary.exempt.pctChange > 0} class:negative={summary.exempt.pctChange < 0}>
							{@html formatPercent(summary.exempt.pctChange)}
						</span>
					</div>
				</div>

				<div class="summary-box">
					<h4 class="box-title">PURTA Value</h4>
					<div class="box-row">
						<span class="label">Start of Year</span>
						<span class="value">{formatCurrency(summary.purta.startOfYear)}</span>
					</div>
					<div class="box-row">
						<span class="label">Current</span>
						<span class="value">{formatCurrency(summary.purta.current)}</span>
					</div>
					<div class="box-row">
						<span class="label">Change</span>
						<span class="value" class:positive={summary.purta.change > 0} class:negative={summary.purta.change < 0}>
							{formatChange(summary.purta.change)}
						</span>
					</div>
					<div class="box-row">
						<span class="label">% Change</span>
						<span class="value" class:positive={summary.purta.pctChange > 0} class:negative={summary.purta.pctChange < 0}>
							{@html formatPercent(summary.purta.pctChange)}
						</span>
					</div>
				</div>

				<div class="summary-box" class:box-positive={summary.estimatedTaxImpact !== null && summary.estimatedTaxImpact > 0} class:box-negative={summary.estimatedTaxImpact !== null && summary.estimatedTaxImpact < 0}>
					<h4 class="box-title">Tax Impact</h4>
					<div class="box-row">
						<span class="label">Est. Impact</span>
						<span class="value" class:positive={summary.estimatedTaxImpact !== null && summary.estimatedTaxImpact > 0} class:negative={summary.estimatedTaxImpact !== null && summary.estimatedTaxImpact < 0}>
							{formatTaxImpact(summary.estimatedTaxImpact)}
						</span>
					</div>
					<div class="box-row">
						<span class="label">% Change</span>
						<span class="value" class:positive={summary.taxImpactPct !== null && summary.taxImpactPct > 0} class:negative={summary.taxImpactPct !== null && summary.taxImpactPct < 0}>
							{@html formatTaxImpactPct(summary.taxImpactPct)}
						</span>
					</div>
				</div>
			</div>
		</section>
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Noto Sans Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		line-height: 1.6;
		color: #333;
	}

	main {
		width: 75%;
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	header {
		text-align: center;
		margin-bottom: 1rem;
	}

	h1 {
		margin: 0 0 0.5rem;
		color: #1a1a1a;
		font-family: 'Noto Serif', Georgia, serif;
		font-weight: 700;
	}

	.muni-header {
		margin-bottom: 2rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: #1976d2;
		text-decoration: none;
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.back-arrow {
		font-size: 1.1rem;
	}

	.muni-header h2 {
		margin: 0.5rem 0 0.25rem;
		font-size: 1.5rem;
		font-family: 'Noto Serif', Georgia, serif;
		font-weight: 600;
	}

	.subtitle {
		color: #666;
		margin: 0;
		font-family: 'Noto Sans', sans-serif;
	}

	h3 {
		margin: 0 0 1rem;
		font-size: 1.1rem;
		font-family: 'Noto Serif', Georgia, serif;
		font-weight: 600;
	}

	section {
		margin-bottom: 3rem;
	}

	.loading, .error {
		text-align: center;
		padding: 3rem;
		font-size: 1.1rem;
		font-family: 'Noto Sans Display', sans-serif;
	}

	.error {
		color: #c62828;
		background: #ffebee;
		border-radius: 8px;
	}

	.summary-subhead {
		margin: 1.5rem 0 0.25rem;
		font-size: 1.25rem;
		font-family: 'Noto Sans Display', sans-serif;
		font-weight: 600;
		color: #333;
	}

	.summary-description {
		margin: 0 0 1rem;
		font-size: 0.9rem;
		color: #555;
		font-family: 'Noto Sans Display', sans-serif;
	}

	.summary-boxes {
		display: flex;
		gap: 1rem;
		margin-top: 4rem;
	}

	.summary-box {
		flex: 1;
		background: #f8f9fa;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 1rem;
	}

	.box-title {
		margin: 0 0 0.75rem;
		font-size: 0.9rem;
		font-family: 'Noto Sans Display', sans-serif;
		font-weight: 600;
		color: #333;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.box-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.35rem 0;
	}

	.box-row .label {
		font-family: 'Noto Sans Display', sans-serif;
		font-size: 0.8rem;
		color: #666;
	}

	.box-row .value {
		font-family: 'Noto Sans Mono', monospace;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.positive {
		color: #2e7d32;
	}

	.negative {
		color: #c62828;
	}

	.box-positive {
		background: #e8f5e9;
		border-color: #c8e6c9;
	}

	.box-positive .box-title {
		border-bottom-color: #c8e6c9;
	}

	.box-negative {
		background: #ffebee;
		border-color: #ffcdd2;
	}

	.box-negative .box-title {
		border-bottom-color: #ffcdd2;
	}
</style>
