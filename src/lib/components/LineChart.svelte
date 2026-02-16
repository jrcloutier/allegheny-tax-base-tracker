<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { MuniRecord } from '$lib/types';
	import { getAggregateChartData } from '$lib/data';
	import { externalTooltipHandler } from '$lib/tooltip';

	Chart.register(...registerables);

	interface Props {
		data: MuniRecord[];
	}

	let { data }: Props = $props();
	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	function createChart() {
		if (!canvas || !data.length) return;

		const { weeks, values } = getAggregateChartData(data);

		// Determine color based on final value
		const lastValue = values[values.length - 1] || 0;
		const lineColor = lastValue >= 0 ? '#2e7d32' : '#c62828';
		const fillColor = lastValue >= 0 ? 'rgba(46, 125, 50, 0.1)' : 'rgba(198, 40, 40, 0.1)';

		if (chart) {
			chart.destroy();
		}

		chart = new Chart(canvas, {
			type: 'line',
			data: {
				labels: weeks,
				datasets: [{
					label: 'Allegheny County Total',
					data: values,
					borderColor: lineColor,
					backgroundColor: fillColor,
					tension: 0,
					pointRadius: 4,
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
						text: 'Year-to-Date Change in Total County Taxable Value',
						font: {
							family: "'Noto Sans Display', sans-serif",
							size: 14,
							weight: '600'
						}
					}
				},
				scales: {
					x: {
						title: {
							display: true,
							text: 'Week',
							font: {
								family: "'Noto Sans Display', sans-serif"
							}
						},
						ticks: {
							font: {
								family: "'Noto Sans Mono', monospace"
							}
						}
					},
					y: {
						title: {
							display: true,
							text: 'YTD Change ($)',
							font: {
								family: "'Noto Sans Display', sans-serif"
							}
						},
						ticks: {
							font: {
								family: "'Noto Sans Mono', monospace"
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

	onMount(() => {
		createChart();
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});

	$effect(() => {
		if (data) {
			createChart();
		}
	});
</script>

<div class="chart-container">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.chart-container {
		width: 100%;
		height: 400px;
		position: relative;
	}
</style>
