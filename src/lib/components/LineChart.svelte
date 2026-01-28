<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { MuniRecord } from '$lib/types';
	import { getAggregateChartData } from '$lib/data';

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
					borderColor: '#1976d2',
					backgroundColor: 'rgba(25, 118, 210, 0.1)',
					tension: 0.1,
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
						callbacks: {
							label: (ctx) => `Change: ${ctx.parsed.y?.toFixed(4)}%`
						}
					},
					title: {
						display: true,
						text: 'Year-to-Date Percent Change in Total County Taxable Value'
					}
				},
				scales: {
					x: {
						title: {
							display: true,
							text: 'Week'
						}
					},
					y: {
						title: {
							display: true,
							text: 'YTD % Change'
						},
						ticks: {
							callback: (value) => `${value}%`
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
