import type { Chart, TooltipModel } from 'chart.js';

function formatCurrency(value: number): string {
	const sign = value >= 0 ? '+' : '';
	return sign + new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(value);
}

function valueColor(value: number): string {
	if (value > 0) return '#2e7d32';
	if (value < 0) return '#c62828';
	return '#333';
}

export function externalTooltipHandler(context: { chart: Chart; tooltip: TooltipModel<'line'> }) {
	const { chart, tooltip } = context;
	const canvas = chart.canvas;

	let tooltipEl = canvas.parentElement?.querySelector('.custom-tooltip') as HTMLDivElement | null;

	if (!tooltipEl) {
		tooltipEl = document.createElement('div');
		tooltipEl.classList.add('custom-tooltip');
		tooltipEl.style.cssText = `
			position: absolute;
			background: #fff;
			border: 1px solid #ccc;
			border-radius: 6px;
			padding: 8px 10px;
			pointer-events: none;
			font-family: 'Noto Sans Display', sans-serif;
			font-size: 12px;
			white-space: nowrap;
			z-index: 10;
			box-shadow: 0 2px 4px rgba(0,0,0,0.1);
			transition: opacity 0.15s ease;
		`;
		canvas.parentElement?.appendChild(tooltipEl);
	}

	if (tooltip.opacity === 0) {
		tooltipEl.style.opacity = '0';
		return;
	}

	const dataIndex = tooltip.dataPoints?.[0]?.dataIndex ?? 0;
	const datasetData = tooltip.dataPoints?.[0]?.dataset?.data as number[] | undefined;
	const currentValue = tooltip.dataPoints?.[0]?.parsed?.y ?? 0;
	const prevValue = dataIndex > 0 && datasetData ? datasetData[dataIndex - 1] : 0;
	const weeklyChange = currentValue - prevValue;

	const titleText = tooltip.title?.[0] || '';

	tooltipEl.innerHTML = `
		<div style="font-weight:600; margin-bottom:4px; color:#333; font-family:'Noto Sans Display',sans-serif;">${titleText}</div>
		<table style="border-collapse:collapse; width:100%;">
			<tr>
				<td style="color:#333; padding:1px 12px 1px 0; font-family:'Noto Sans Display',sans-serif;">YTD</td>
				<td style="color:${valueColor(currentValue)}; text-align:right; padding:1px 0; font-family:'Noto Sans Mono',monospace; font-weight:600;">${formatCurrency(currentValue)}</td>
			</tr>
			<tr>
				<td style="color:#333; padding:1px 12px 1px 0; font-family:'Noto Sans Display',sans-serif;">Weekly</td>
				<td style="color:${valueColor(weeklyChange)}; text-align:right; padding:1px 0; font-family:'Noto Sans Mono',monospace; font-weight:600;">${formatCurrency(weeklyChange)}</td>
			</tr>
		</table>
	`;

	tooltipEl.style.opacity = '1';

	const { offsetLeft, offsetTop } = canvas;
	const tooltipWidth = tooltipEl.offsetWidth;
	const chartWidth = canvas.offsetWidth;

	let left = offsetLeft + tooltip.caretX - tooltipWidth / 2;
	if (left < offsetLeft) left = offsetLeft;
	if (left + tooltipWidth > offsetLeft + chartWidth) left = offsetLeft + chartWidth - tooltipWidth;

	tooltipEl.style.left = left + 'px';
	tooltipEl.style.top = offsetTop + tooltip.caretY - tooltipEl.offsetHeight - 12 + 'px';
}
