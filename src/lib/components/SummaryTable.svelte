<script lang="ts">
	import type { MuniSummary } from '$lib/types';

	interface Props {
		summaries: MuniSummary[];
	}

	let { summaries }: Props = $props();

	type ViewMode = 'ytd' | 'weekly';
	type SortKey = 'municipality' | 'taxable.change' | 'exempt.change' | 'purta.change' | 'estimatedTaxImpact' | 'taxImpactPct';
	let viewMode: ViewMode = $state('ytd');
	let sortKey: SortKey = $state('municipality');
	let sortAsc: boolean = $state(true);
	let searchQuery: string = $state('');

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}

	function formatChange(value: number): string {
		const sign = value >= 0 ? '+' : '';
		return sign + formatCurrency(value);
	}

	function formatTaxImpact(value: number | null): string {
		if (value === null) return 'N/A';
		const sign = value >= 0 ? '+' : '';
		return sign + formatCurrency(value);
	}

	function formatTaxImpactPct(value: number | null): string {
		if (value === null) return 'N/A';
		if (value === 0) return '0.00%';
		const iconClass = value > 0 ? 'fa-arrow-up' : 'fa-arrow-down';
		return `<i class="fa-solid ${iconClass}"></i> ${Math.abs(value).toFixed(2)}%`;
	}

	function getChangeValue(summary: MuniSummary, field: 'taxable' | 'exempt' | 'purta'): number {
		return viewMode === 'ytd' ? summary[field].change : summary[field].weeklyChange;
	}

	function getTaxImpactValue(summary: MuniSummary): number | null {
		return viewMode === 'ytd' ? summary.estimatedTaxImpact : summary.weeklyTaxImpact;
	}

	function getTaxImpactPctValue(summary: MuniSummary): number | null {
		return viewMode === 'ytd' ? summary.taxImpactPct : summary.weeklyTaxImpactPct;
	}

	function handleSort(key: SortKey) {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = key === 'municipality';
		}
	}

	function getSortValue(summary: MuniSummary, key: SortKey): string | number | null {
		if (key === 'municipality') return summary.municipality;
		if (key === 'taxable.change') return getChangeValue(summary, 'taxable');
		if (key === 'exempt.change') return getChangeValue(summary, 'exempt');
		if (key === 'purta.change') return getChangeValue(summary, 'purta');
		if (key === 'estimatedTaxImpact') return getTaxImpactValue(summary);
		if (key === 'taxImpactPct') return getTaxImpactPctValue(summary);
		return null;
	}

	let filteredAndSortedSummaries = $derived(
		[...summaries]
			.filter(s => s.municipality.toLowerCase().includes(searchQuery.toLowerCase()))
			.sort((a, b) => {
				const aVal = getSortValue(a, sortKey);
				const bVal = getSortValue(b, sortKey);
				if (aVal === null && bVal === null) return 0;
				if (aVal === null) return sortAsc ? 1 : -1;
				if (bVal === null) return sortAsc ? -1 : 1;
				const compare = typeof aVal === 'string'
					? aVal.localeCompare(bVal as string)
					: (aVal as number) - (bVal as number);
				return sortAsc ? compare : -compare;
			})
	);
</script>

<div class="table-wrapper">
	<div class="table-header">
		<h2>Explore Municipalities</h2>
		<div class="table-controls">
			<div class="toggle-group">
				<button class="toggle-btn" class:active={viewMode === 'ytd'} onclick={() => viewMode = 'ytd'}>YTD</button>
				<button class="toggle-btn" class:active={viewMode === 'weekly'} onclick={() => viewMode = 'weekly'}>Weekly</button>
			</div>
			<div class="search-box">
				<input
					type="text"
					placeholder="Search municipalities..."
					bind:value={searchQuery}
				/>
				{#if searchQuery}
					<button class="clear-btn" onclick={() => searchQuery = ''}>Clear</button>
				{/if}
			</div>
		</div>
	</div>

	<div class="table-container">
		<table>
			<thead>
				<tr class="header-top">
					<th></th>
					<th colspan="3" class="group-header"><span>{viewMode === 'ytd' ? 'YTD' : 'Weekly'} Change in Value</span></th>
					<th colspan="2" class="group-header"><span>Est. Tax Impact</span></th>
				</tr>
				<tr class="header-bottom">
					<th class="sortable" onclick={() => handleSort('municipality')}>
						Municipality {sortKey === 'municipality' ? (sortAsc ? '▲' : '▼') : ''}
					</th>
					<th class="sortable numeric col-fixed" onclick={() => handleSort('taxable.change')}>
						Taxable {sortKey === 'taxable.change' ? (sortAsc ? '▲' : '▼') : ''}
					</th>
					<th class="sortable numeric col-fixed" onclick={() => handleSort('exempt.change')}>
						Exempt {sortKey === 'exempt.change' ? (sortAsc ? '▲' : '▼') : ''}
					</th>
					<th class="sortable numeric col-fixed" onclick={() => handleSort('purta.change')}>
						PURTA {sortKey === 'purta.change' ? (sortAsc ? '▲' : '▼') : ''}
					</th>
					<th class="sortable numeric col-fixed" onclick={() => handleSort('estimatedTaxImpact')}>
						Total {sortKey === 'estimatedTaxImpact' ? (sortAsc ? '▲' : '▼') : ''}
					</th>
					<th class="sortable numeric col-fixed" onclick={() => handleSort('taxImpactPct')}>
						% {sortKey === 'taxImpactPct' ? (sortAsc ? '▲' : '▼') : ''}
					</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredAndSortedSummaries as summary}
					{@const taxableVal = getChangeValue(summary, 'taxable')}
					{@const exemptVal = getChangeValue(summary, 'exempt')}
					{@const purtaVal = getChangeValue(summary, 'purta')}
					{@const taxImpactVal = getTaxImpactValue(summary)}
					{@const taxImpactPctVal = getTaxImpactPctValue(summary)}
					<tr>
						<td><a href="/municipality/{summary.muniCode}">{summary.municipality}</a></td>
						<td class="numeric col-fixed" class:positive={taxableVal > 0} class:negative={taxableVal < 0}>
							{formatChange(taxableVal)}
						</td>
						<td class="numeric col-fixed" class:positive={exemptVal > 0} class:negative={exemptVal < 0}>
							{formatChange(exemptVal)}
						</td>
						<td class="numeric col-fixed" class:positive={purtaVal > 0} class:negative={purtaVal < 0}>
							{formatChange(purtaVal)}
						</td>
						<td class="numeric col-fixed" class:positive={taxImpactVal !== null && taxImpactVal > 0} class:negative={taxImpactVal !== null && taxImpactVal < 0}>
							{formatTaxImpact(taxImpactVal)}
						</td>
						<td class="numeric col-fixed" class:positive={taxImpactPctVal !== null && taxImpactPctVal > 0} class:negative={taxImpactPctVal !== null && taxImpactPctVal < 0}>
							{@html formatTaxImpactPct(taxImpactPctVal)}
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="no-results">No municipalities found</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.table-wrapper {
		margin-top: 1rem;
	}

	.table-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.table-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-family: 'Noto Sans Display', sans-serif;
	}

	.table-controls {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.toggle-group {
		display: flex;
		border: 1px solid #ddd;
		border-radius: 4px;
		overflow: hidden;
	}

	.toggle-btn {
		padding: 0.5rem 0.85rem;
		font-size: 0.85rem;
		font-family: 'Noto Sans Display', sans-serif;
		font-weight: 500;
		border: none;
		background: #f5f5f5;
		color: #666;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.toggle-btn:not(:last-child) {
		border-right: 1px solid #ddd;
	}

	.toggle-btn.active {
		background: #333;
		color: #fff;
	}

	.toggle-btn:not(.active):hover {
		background: #e8e8e8;
	}

	.search-box {
		display: flex;
		gap: 0.5rem;
	}

	.search-box input {
		width: 250px;
		padding: 0.5rem 0.75rem;
		font-size: 0.9rem;
		font-family: 'Noto Sans Display', sans-serif;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.search-box input:focus {
		outline: none;
		border-color: #1976d2;
	}

	.clear-btn {
		padding: 0.5rem 0.75rem;
		font-size: 0.9rem;
		font-family: 'Noto Sans Display', sans-serif;
		border: 1px solid #ddd;
		border-radius: 4px;
		background: #f5f5f5;
		cursor: pointer;
	}

	.clear-btn:hover {
		background: #e8e8e8;
	}

	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		font-family: 'Noto Sans Display', sans-serif;
	}

	th, td {
		padding: 0.5rem 0.75rem;
		text-align: left;
	}

	/* Header styling - clean, minimal */
	thead th {
		font-weight: 600;
		font-family: 'Noto Sans Display', sans-serif;
		background: transparent;
		vertical-align: bottom;
	}

	/* Top row - empty cells and group headers */
	.header-top th {
		border-bottom: none;
		padding-bottom: 0.25rem;
	}

	/* Group headers - text with decorative lines on either side */
	.group-header {
		text-align: center;
		font-size: 0.8rem;
		font-weight: 600;
		color: #333;
	}

	.group-header span {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.group-header span::before,
	.group-header span::after {
		content: '';
		flex: 1;
		height: 1px;
		background: #ccc;
	}

	/* Bottom header row - column labels */
	.header-bottom th {
		font-size: 0.8rem;
		color: #333;
		border-bottom: 2px solid #333;
		padding-top: 0.25rem;
	}

	/* Fixed width columns for numeric data columns */
	.col-fixed {
		width: 150px;
	}

	th.sortable {
		cursor: pointer;
		user-select: none;
	}

	th.sortable:hover {
		color: #1976d2;
	}

	th.numeric {
		text-align: right;
	}

	/* Body styling */
	td {
		border-bottom: 1px solid #eee;
	}

	td.numeric {
		text-align: right;
		font-family: 'Noto Sans Mono', monospace;
	}

	td .fa-solid {
		font-size: 0.6em;
	}

	tbody tr:hover {
		background: #f8f9fa;
	}

	.positive {
		color: #2e7d32;
	}

	.negative {
		color: #c62828;
	}

	.no-results {
		text-align: center;
		color: #666;
		font-style: italic;
	}

	td a {
		color: #1976d2;
		text-decoration: none;
	}

	td a:hover {
		text-decoration: underline;
	}
</style>
