<script lang="ts">
	import type { MuniSummary } from '$lib/types';

	interface Props {
		summaries: MuniSummary[];
		onMuniSelect: (munis: string[]) => void;
		selectedMunis: string[];
	}

	let { summaries, onMuniSelect, selectedMunis }: Props = $props();

	type SortKey = 'municipality' | 'startOfYearValue' | 'currentValue' | 'change' | 'pctChange' | 'dataAsOf';
	let sortKey: SortKey = $state('municipality');
	let sortAsc: boolean = $state(true);

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

	function toggleSelection(muni: string) {
		if (selectedMunis.includes(muni)) {
			onMuniSelect(selectedMunis.filter(m => m !== muni));
		} else {
			onMuniSelect([...selectedMunis, muni]);
		}
	}

	function clearSelection() {
		onMuniSelect([]);
	}

	let sortedSummaries = $derived(
		[...summaries].sort((a, b) => {
			const aVal = a[sortKey];
			const bVal = b[sortKey];
			const compare = typeof aVal === 'string'
				? aVal.localeCompare(bVal as string)
				: (aVal as number) - (bVal as number);
			return sortAsc ? compare : -compare;
		})
	);
</script>

<div class="table-container">
	{#if selectedMunis.length > 0}
		<div class="selection-info">
			<span>{selectedMunis.length} municipalities selected</span>
			<button onclick={clearSelection}>Clear selection</button>
		</div>
	{/if}

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
				<th class="sortable" onclick={() => handleSort('dataAsOf')}>
					Data As Of {sortKey === 'dataAsOf' ? (sortAsc ? '▲' : '▼') : ''}
				</th>
			</tr>
		</thead>
		<tbody>
			{#each sortedSummaries as summary}
				<tr
					class:selected={selectedMunis.includes(summary.municipality)}
					onclick={() => toggleSelection(summary.municipality)}
				>
					<td>{summary.municipality}</td>
					<td class="numeric">{formatCurrency(summary.startOfYearValue)}</td>
					<td class="numeric">{formatCurrency(summary.currentValue)}</td>
					<td class="numeric" class:positive={summary.change > 0} class:negative={summary.change < 0}>
						{formatChange(summary.change)}
					</td>
					<td class="numeric" class:positive={summary.pctChange > 0} class:negative={summary.pctChange < 0}>
						{formatPercent(summary.pctChange)}
					</td>
					<td>{summary.dataAsOf}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-container {
		overflow-x: auto;
		margin-top: 2rem;
	}

	.selection-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding: 0.5rem 1rem;
		background: #f0f0f0;
		border-radius: 4px;
	}

	.selection-info button {
		padding: 0.25rem 0.75rem;
		border: 1px solid #ccc;
		background: white;
		border-radius: 4px;
		cursor: pointer;
	}

	.selection-info button:hover {
		background: #eee;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
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
	}

	th.sortable {
		cursor: pointer;
		user-select: none;
	}

	th.sortable:hover {
		background: #e8e8e8;
	}

	.numeric {
		text-align: right;
		font-family: monospace;
	}

	tr:hover {
		background: #f8f8f8;
		cursor: pointer;
	}

	tr.selected {
		background: #e3f2fd;
	}

	tr.selected:hover {
		background: #bbdefb;
	}

	.positive {
		color: #2e7d32;
	}

	.negative {
		color: #c62828;
	}
</style>
