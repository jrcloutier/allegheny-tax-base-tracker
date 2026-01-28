<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { MuniRecord } from '$lib/types';
	import { getChartData, generateColor } from '$lib/data';

	Chart.register(...registerables);

	interface Props {
		data: MuniRecord[];
		selectedMunis: string[];
	}

	let { data, selectedMunis }: Props = $props();
	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	function createChart() {
		if (!canvas || !data.length) return;

		const { weeks, series } = getChartData(data);
		const municipalities = [...series.keys()].sort();
		const filteredMunis = selectedMunis.length > 0 ? selectedMunis : municipalities;

		const datasets = filteredMunis.map((muni, i) => {
			const values = series.get(muni) || [];
			const color = generateColor(municipalities.indexOf(muni), municipalities.length);

			return {
				label: muni,
				data: values.map((v, j) => ({ x: weeks[j], y: v ?? 0 })),
				borderColor: color,
				backgroundColor: color,
				tension: 0.1,
				pointRadius: 3,
				borderWidth: 2,
				fill: false
			};
		});

		if (chart) {
			chart.destroy();
		}

		chart = new Chart(canvas, {
			type: 'line',
			data: {
				labels: weeks,
				datasets
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
						display: filteredMunis.length <= 10,
						position: 'bottom'
					},
					tooltip: {
						callbacks: {
							label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(4)}%`
						}
					},
					title: {
						display: true,
						text: 'Year-to-Date Percent Change in Taxable Value'
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
		// Re-create chart when data or selection changes
		if (data && selectedMunis) {
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
		height: 500px;
		position: relative;
	}
</style>
