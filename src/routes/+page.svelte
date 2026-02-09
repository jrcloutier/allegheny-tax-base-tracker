<script lang="ts">
	import { onMount } from 'svelte';
	import FacetedLineChart from '$lib/components/FacetedLineChart.svelte';
	import SummaryTable from '$lib/components/SummaryTable.svelte';
	import { fetchData, fetchMillageRates, calculateSummaries } from '$lib/data';
	import type { MuniRecord, MuniSummary, ValueCategory } from '$lib/types';

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

	// Calculate county-wide totals
	let countyTotals = $derived(() => {
		const taxable: ValueCategory = {
			startOfYear: summaries.reduce((sum, s) => sum + s.taxable.startOfYear, 0),
			current: summaries.reduce((sum, s) => sum + s.taxable.current, 0),
			change: 0,
			pctChange: 0
		};
		taxable.change = taxable.current - taxable.startOfYear;
		taxable.pctChange = taxable.startOfYear > 0 ? (taxable.change / taxable.startOfYear) * 100 : 0;

		const exempt: ValueCategory = {
			startOfYear: summaries.reduce((sum, s) => sum + s.exempt.startOfYear, 0),
			current: summaries.reduce((sum, s) => sum + s.exempt.current, 0),
			change: 0,
			pctChange: 0
		};
		exempt.change = exempt.current - exempt.startOfYear;
		exempt.pctChange = exempt.startOfYear > 0 ? (exempt.change / exempt.startOfYear) * 100 : 0;

		const purta: ValueCategory = {
			startOfYear: summaries.reduce((sum, s) => sum + s.purta.startOfYear, 0),
			current: summaries.reduce((sum, s) => sum + s.purta.current, 0),
			change: 0,
			pctChange: 0
		};
		purta.change = purta.current - purta.startOfYear;
		purta.pctChange = purta.startOfYear > 0 ? (purta.change / purta.startOfYear) * 100 : 0;

		// Sum up tax impacts for municipalities that have millage data
		const taxImpact = summaries.reduce((sum, s) => sum + (s.estimatedTaxImpact ?? 0), 0);

		// Calculate tax impact percentage based on start-of-year tax revenue
		const startTaxRevenue = summaries.reduce((sum, s) => {
			if (s.millage !== null) {
				return sum + (s.taxable.startOfYear * (s.millage / 1000));
			}
			return sum;
		}, 0);
		const taxImpactPct = startTaxRevenue > 0 ? (taxImpact / startTaxRevenue) * 100 : 0;

		return { taxable, exempt, purta, taxImpact, taxImpactPct };
	});

	onMount(async () => {
		try {
			const [muniData, millageRates] = await Promise.all([
				fetchData(),
				fetchMillageRates()
			]);
			data = muniData;
			const result = calculateSummaries(data, millageRates);
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
	<title>Allegheny County Tax Base Tracker</title>
</svelte:head>

<main>
	<header>
		<h1>Allegheny County Tax Base Tracker</h1>
		<p class="description">Track real-time change in taxable and tax-exempt property values across Allegheny County and its 130 municipalities.</p>
		<p class="data-date">Updated {formatDateForDisplay(dataAsOf)}</p>
	</header>

	{#if loading}
		<div class="loading">Loading data...</div>
	{:else if error}
		<div class="error">Error: {error}</div>
	{:else}
		<div class="entity-header">
			<h2>Allegheny County</h2>
		</div>

		<section class="chart-section">
			<FacetedLineChart {data} />

			<div class="summary-boxes">
				<div class="summary-box">
					<h4 class="box-title">Taxable Value</h4>
					<div class="box-row">
						<span class="label">Start of Year</span>
						<span class="value">{formatCurrency(countyTotals().taxable.startOfYear)}</span>
					</div>
					<div class="box-row">
						<span class="label">Current</span>
						<span class="value">{formatCurrency(countyTotals().taxable.current)}</span>
					</div>
					<div class="box-row">
						<span class="label">Change</span>
						<span class="value" class:positive={countyTotals().taxable.change > 0} class:negative={countyTotals().taxable.change < 0}>
							{formatChange(countyTotals().taxable.change)}
						</span>
					</div>
					<div class="box-row">
						<span class="label">% Change</span>
						<span class="value" class:positive={countyTotals().taxable.pctChange > 0} class:negative={countyTotals().taxable.pctChange < 0}>
							{@html formatPercent(countyTotals().taxable.pctChange)}
						</span>
					</div>
				</div>

				<div class="summary-box">
					<h4 class="box-title">Tax Exempt Value</h4>
					<div class="box-row">
						<span class="label">Start of Year</span>
						<span class="value">{formatCurrency(countyTotals().exempt.startOfYear)}</span>
					</div>
					<div class="box-row">
						<span class="label">Current</span>
						<span class="value">{formatCurrency(countyTotals().exempt.current)}</span>
					</div>
					<div class="box-row">
						<span class="label">Change</span>
						<span class="value" class:positive={countyTotals().exempt.change > 0} class:negative={countyTotals().exempt.change < 0}>
							{formatChange(countyTotals().exempt.change)}
						</span>
					</div>
					<div class="box-row">
						<span class="label">% Change</span>
						<span class="value" class:positive={countyTotals().exempt.pctChange > 0} class:negative={countyTotals().exempt.pctChange < 0}>
							{@html formatPercent(countyTotals().exempt.pctChange)}
						</span>
					</div>
				</div>

				<div class="summary-box">
					<h4 class="box-title">PURTA Value</h4>
					<div class="box-row">
						<span class="label">Start of Year</span>
						<span class="value">{formatCurrency(countyTotals().purta.startOfYear)}</span>
					</div>
					<div class="box-row">
						<span class="label">Current</span>
						<span class="value">{formatCurrency(countyTotals().purta.current)}</span>
					</div>
					<div class="box-row">
						<span class="label">Change</span>
						<span class="value" class:positive={countyTotals().purta.change > 0} class:negative={countyTotals().purta.change < 0}>
							{formatChange(countyTotals().purta.change)}
						</span>
					</div>
					<div class="box-row">
						<span class="label">% Change</span>
						<span class="value" class:positive={countyTotals().purta.pctChange > 0} class:negative={countyTotals().purta.pctChange < 0}>
							{@html formatPercent(countyTotals().purta.pctChange)}
						</span>
					</div>
				</div>

				<div class="summary-box" class:box-positive={countyTotals().taxImpact > 0} class:box-negative={countyTotals().taxImpact < 0}>
					<h4 class="box-title">Tax Impact</h4>
					<div class="box-row">
						<span class="label">Est. Impact</span>
						<span class="value" class:positive={countyTotals().taxImpact > 0} class:negative={countyTotals().taxImpact < 0}>
							{formatChange(countyTotals().taxImpact)}
						</span>
					</div>
					<div class="box-row">
						<span class="label">% Change</span>
						<span class="value" class:positive={countyTotals().taxImpactPct > 0} class:negative={countyTotals().taxImpactPct < 0}>
							{@html formatPercent(countyTotals().taxImpactPct)}
						</span>
					</div>
				</div>
			</div>
		</section>

		<section class="table-section">
			<SummaryTable {summaries} />
		</section>

	{/if}
</main>

<section class="about-section">
	<div class="about-inner">
		<h3>About the Data</h3>
		<div class="about-columns">
			<div class="about-column">
				<p>
					The tax base in Allegheny County shifts as buildings go up, others come down, and property owners appeal their assessments. These changes are reflected on a county <a href="https://apps.alleghenycounty.us/website/GeneralInfo.asp" target="_blank" rel="noopener">webpage</a> that is updated every Friday.
				</p>
				<p>
					This dashboard tracks weekly shifts in real estate values and measures the impacts on tax revenue. It is powered by a <a href="https://github.com/PittsburghPG/scraper-allegheny-county-muni-profiles" target="_blank" rel="noopener">scraper</a> that pulls data from the county every week.
				</p>
				<p>The dashboard shows three categories of real estate value:</p>
				<ul>
					<li><strong>Taxable value</strong> is the total real estate value that is subject to property taxes.</li>
					<li><strong>Tax-exempt value</strong> is the total value that is exempt from property taxes.
					<li><strong>PURTA</strong> covers the value of utilities taxed under a separate state formula.</li>
				</ul>
			</div>
			<div class="about-column">
				<p>
					The estimated tax impact multiplies each municipality's change in taxable value by its millage rate. This shows how much more or less revenue the municipality could collect if rates stay the same.
				</p>
				<p>
					<b>Found a problem with the data?</b> <a href="mailto:cloutierjr@icloud.com?subject=Assessment%20Dashboard%20Issue">Send an email</a>.
				</p>
			</div>
		</div>
	</div>
</section>

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
		margin-bottom: 2rem;
	}

	h1 {
		margin: 0 0 0.5rem;
		color: #1a1a1a;
		font-family: 'Noto Serif', Georgia, serif;
		font-weight: 700;
	}

	.description {
		color: #666;
		margin: 0.5rem auto 0;
		font-family: 'Noto Sans Display', sans-serif;
		font-size: 0.95rem;
		max-width: 500px;
		line-height: 1.5;
	}

	.data-date {
		color: #666;
		margin: 0.75rem 0 0;
		font-family: 'Noto Sans Display', sans-serif;
		font-size: 0.95rem;
	}

	.entity-header h2 {
		margin: 0 0 1rem;
		font-size: 1.5rem;
		font-family: 'Noto Serif', Georgia, serif;
		font-weight: 600;
	}

	h3 {
		margin: 0 0 1rem;
		font-size: 1.1rem;
		font-family: 'Noto Serif', Georgia, serif;
		font-weight: 600;
	}

	.about-section {
		background: #f8f9fa;
		border-top: 1px solid #e0e0e0;
		padding: 2rem 0 5rem;
		margin-bottom: 0;
	}

	.about-inner {
		width: 75%;
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.about-section h3 {
		margin-top: 0;
	}

	.about-columns {
		display: flex;
		gap: 2rem;
	}

	.about-column {
		flex: 1;
	}

	.about-section p {
		font-family: 'Noto Sans Display', sans-serif;
		font-size: 0.95rem;
		color: #444;
		line-height: 1.7;
		margin: 0 0 1rem;
	}

	.about-column p:last-child {
		margin-bottom: 0;
	}

	.about-section ul {
		font-family: 'Noto Sans Display', sans-serif;
		font-size: 0.95rem;
		color: #444;
		line-height: 1.7;
		margin: 0 0 1rem;
		padding-left: 1.25rem;
	}

	.about-section li {
		margin-bottom: 0.25rem;
	}

	main section {
		margin-bottom: 3rem;
	}

	.table-section {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid #e0e0e0;
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

	.about-section a {
		color: #1976d2;
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
