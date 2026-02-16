<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { MuniRecord } from '$lib/types';
	import { getAggregateFacetedChartData, type ValueType } from '$lib/data';
	import { externalTooltipHandler } from '$lib/tooltip';

	Chart.register(...registerables);

	interface Props {
		data: MuniRecord[];
	}

	let { data }: Props = $props();
	let taxableCanvas: HTMLCanvasElement;
	let exemptCanvas: HTMLCanvasElement;
	let purtaCanvas: HTMLCanvasElement;
	let charts: Chart[] = [];

	function formatWeekLabel(week: string): string {
		const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

		// Handle date format "2026-01-16"
		const dateMatch = week.match(/(\d{4})-(\d{2})-(\d{2})/);
		if (dateMatch) {
			const month = parseInt(dateMatch[2]) - 1;
			const day = parseInt(dateMatch[3]);
			return `${months[month]} ${day}`;
		}

		return week;
	}

	function createChart(
		canvas: HTMLCanvasElement,
		valueType: ValueType,
		title: string,
		weeks: string[],
		values: number[],
		yMin: number,
		yMax: number
	): Chart | null {
		if (!canvas) return null;

		// Format week labels
		const labels = weeks.map(formatWeekLabel);

		// Determine color based on final value
		const lastValue = values[values.length - 1] || 0;
		const lineColor = lastValue >= 0 ? '#2e7d32' : '#c62828';
		const fillColor = lastValue >= 0 ? 'rgba(46, 125, 50, 0.1)' : 'rgba(198, 40, 40, 0.1)';

		return new Chart(canvas, {
			type: 'line',
			data: {
				labels: labels,
				datasets: [{
					label: title,
					data: values,
					borderColor: lineColor,
					backgroundColor: fillColor,
					tension: 0,
					pointRadius: 3,
					borderWidth: 2,
					fill: true
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index',
					intersect: false
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						enabled: false,
						external: externalTooltipHandler
					},
					title: {
						display: true,
						text: title,
						font: {
							family: "'Noto Sans Display', sans-serif",
							size: 13,
							weight: '600'
						}
					}
				},
				scales: {
					x: {
						ticks: {
							font: {
								family: "'Noto Sans Mono', monospace",
								size: 10
							},
							maxRotation: 0,
							minRotation: 0
						}
					},
					y: {
						min: yMin,
						max: yMax,
						ticks: {
							font: {
								family: "'Noto Sans Mono', monospace",
								size: 10
							},
							callback: (value) => {
								const num = Number(value);
								if (Math.abs(num) >= 1000000) {
									return (num / 1000000).toFixed(1) + 'M';
								} else if (Math.abs(num) >= 1000) {
									return (num / 1000).toFixed(0) + 'K';
								}
								return String(value);
							}
						}
					}
				}
			}
		});
	}

	function createAllCharts() {
		if (!data.length) return;

		// Destroy existing charts
		charts.forEach(c => c?.destroy());
		charts = [];

		// Get data for all three chart types
		const taxableData = getAggregateFacetedChartData(data, 'taxable');
		const exemptData = getAggregateFacetedChartData(data, 'exempt');
		const purtaData = getAggregateFacetedChartData(data, 'purta');

		// Calculate uniform y-axis scale across all charts
		const allValues = [...taxableData.values, ...exemptData.values, ...purtaData.values];
		const minValue = Math.min(...allValues);
		const maxValue = Math.max(...allValues);

		// Add minimal padding to the scale (2%)
		const range = maxValue - minValue;
		const padding = range * 0.02;
		const yMin = minValue - padding;
		const yMax = maxValue + padding;

		const taxableChart = createChart(taxableCanvas, 'taxable', 'Taxable Value YTD Change', taxableData.weeks, taxableData.values, yMin, yMax);
		const exemptChart = createChart(exemptCanvas, 'exempt', 'Tax Exempt Value YTD Change', exemptData.weeks, exemptData.values, yMin, yMax);
		const purtaChart = createChart(purtaCanvas, 'purta', 'PURTA Value YTD Change', purtaData.weeks, purtaData.values, yMin, yMax);

		if (taxableChart) charts.push(taxableChart);
		if (exemptChart) charts.push(exemptChart);
		if (purtaChart) charts.push(purtaChart);
	}

	onMount(() => {
		createAllCharts();
	});

	onDestroy(() => {
		charts.forEach(c => c?.destroy());
	});

	$effect(() => {
		if (data) {
			createAllCharts();
		}
	});
</script>

<div class="faceted-charts">
	<div class="chart-container">
		<canvas bind:this={taxableCanvas}></canvas>
	</div>
	<div class="chart-container">
		<canvas bind:this={exemptCanvas}></canvas>
	</div>
	<div class="chart-container">
		<canvas bind:this={purtaCanvas}></canvas>
	</div>
</div>

<style>
	.faceted-charts {
		display: flex;
		gap: 1rem;
		width: 100%;
	}

	.chart-container {
		flex: 1;
		height: 280px;
		position: relative;
		min-width: 0;
	}
</style>
