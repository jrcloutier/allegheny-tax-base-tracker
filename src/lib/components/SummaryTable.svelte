<script lang="ts">
	import type { MuniSummary } from '$lib/types';

	interface Props {
		summaries: MuniSummary[];
	}

	let { summaries }: Props = $props();

	type SortKey = 'municipality' | 'startOfYearValue' | 'currentValue' | 'change' | 'pctChange';
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

	function formatPercent(value: number): string {
		const sign = value >= 0 ? '+' : '';
		return `${sign}${value.toFixed(4)}%`;
	}

	function formatChange(value: number): string {
		const sign = value >= 0 ? '+' : '';
		return `${sign}${formatCurrency(value)}`;
	}

	function handleSort(key: SortKey) {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = key === 'municipality';
		}
	}

	let filteredAndSortedSummaries = $derived(
		[...summaries]
			.filter(s => s.municipality.toLowerCase().includes(searchQuery.toLowerCase()))
			.sort((a, b) => {
				const aVal = a[sortKey];
				const bVal = b[sortKey];
				const compare = typeof aVal === 'string'
					? aVal.localeCompare(bVal as string)
					: (aVal as number) - (bVal as number);
				return sortAsc ? compare : -compare;
			})
	);
</script>

<div class="table-wrapper">
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

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th class="sortable" onclick={() => handleSort('municipality')}>
						Municipality {sortKey === 'municipality' ? (sortAsc ? '▲' : '▼') : ''}
					</th>
					<th class="sortable numeric" onclick={() => handleSort('startOfYearValue')}>
						Start of Year Value {sortKey === 'startOfYearValue' ? (sortAsc ? '▲' : '▼') : ''}
					</th>
					<th class="sortable numeric" onclick={() => handleSort('currentValue')}>
						Current Value {sortKey === 'currentValue' ? (sortAsc ? '▲' : '▼') : ''}
					</th>
					<th class="sortable numeric" onclick={() => handleSort('change')}>
						Change {sortKey === 'change' ? (sortAsc ? '▲' : '▼') : ''}
					</th>
					<th class="sortable numeric" onclick={() => handleSort('pctChange')}>
						% Change {sortKey === 'pctChange' ? (sortAsc ? '▲' : '▼') : ''}
					</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredAndSortedSummaries as summary}
					<tr>
						<td>{summary.municipality}</td>
						<td class="numeric">{formatCurrency(summary.startOfYearValue)}</td>
						<td class="numeric">{formatCurrency(summary.currentValue)}</td>
						<td class="numeric" class:positive={summary.change > 0} class:negative={summary.change < 0}>
							{formatChange(summary.change)}
						</td>
						<td class="numeric" class:positive={summary.pctChange > 0} class:negative={summary.pctChange < 0}>
							{formatPercent(summary.pctChange)}
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="5" class="no-results">No municipalities found</td>
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

	.search-box {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.search-box input {
		flex: 1;
		max-width: 300px;
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
		font-size: 0.9rem;
		font-family: 'Noto Sans Display', sans-serif;
	}

	th, td {
		padding: 0.75rem 1rem;
		text-align: left;
		border-bottom: 1px solid #ddd;
	}

	th {
		background: #f5f5f5;
		font-weight: 600;
		position: sticky;
		top: 0;
		font-family: 'Noto Sans Display', sans-serif;
	}

	th.sortable {
		cursor: pointer;
		user-select: none;
	}

	th.sortable:hover {
		background: #e8e8e8;
	}

	th.numeric {
		text-align: right;
	}

	td.numeric {
		text-align: right;
		font-family: 'Noto Sans Mono', monospace;
	}

	tr:hover {
		background: #f8f8f8;
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
</style>
