import type { MuniRecord, MuniSummary } from './types';

const DATA_URL = 'https://raw.githubusercontent.com/PittsburghPG/scraper-allegheny-county-muni-profiles/main/data/muni-real-estate-time-series.csv';

export async function fetchData(): Promise<MuniRecord[]> {
	const response = await fetch(DATA_URL);
	const text = await response.text();
	return parseCSV(text);
}

function parseCSV(text: string): MuniRecord[] {
	const lines = text.trim().split('\n');
	const headers = lines[0].split(',');

	return lines.slice(1).map(line => {
		const values = parseCSVLine(line);
		const record: Record<string, string | number | null> = {};

		headers.forEach((header, i) => {
			const value = values[i] || '';
			if (header === 'taxable_value' || header === 'year') {
				record[header] = parseInt(value, 10) || 0;
			} else if (header.includes('_change') || header.includes('_pct')) {
				record[header] = value === 'NA' || value === '' ? null : parseFloat(value);
			} else {
				record[header] = value;
			}
		});

		return record as unknown as MuniRecord;
	});
}

function parseCSVLine(line: string): string[] {
	const values: string[] = [];
	let current = '';
	let inQuotes = false;

	for (const char of line) {
		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === ',' && !inQuotes) {
			values.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}
	values.push(current.trim());

	return values;
}

export function calculateSummaries(data: MuniRecord[]): MuniSummary[] {
	const municipalities = [...new Set(data.map(d => d.municipality))];
	const currentYear = new Date().getFullYear();

	return municipalities.map(muni => {
		const muniData = data
			.filter(d => d.municipality === muni)
			.sort((a, b) => a.scrape_week.localeCompare(b.scrape_week));

		const yearData = muniData.filter(d => d.year === currentYear);
		const startRecord = yearData[0] || muniData[0];
		const currentRecord = muniData[muniData.length - 1];

		const startValue = startRecord?.taxable_value || 0;
		const currentValue = currentRecord?.taxable_value || 0;
		const change = currentValue - startValue;
		const pctChange = startValue > 0 ? (change / startValue) * 100 : 0;

		return {
			municipality: muni,
			startOfYearValue: startValue,
			currentValue,
			change,
			pctChange,
			dataAsOf: currentRecord?.value_as_of_date || ''
		};
	}).sort((a, b) => a.municipality.localeCompare(b.municipality));
}

export function getChartData(data: MuniRecord[]): { weeks: string[]; series: Map<string, (number | null)[]> } {
	const weeks = [...new Set(data.map(d => d.scrape_week))].sort();
	const municipalities = [...new Set(data.map(d => d.municipality))];

	const series = new Map<string, (number | null)[]>();

	municipalities.forEach(muni => {
		const muniData = data.filter(d => d.municipality === muni);
		const values = weeks.map(week => {
			const record = muniData.find(d => d.scrape_week === week);
			return record?.taxable_value_ytd_pct ?? null;
		});
		series.set(muni, values);
	});

	return { weeks, series };
}

// Generate distinct colors for municipalities
export function generateColor(index: number, total: number): string {
	const hue = (index * 360 / total) % 360;
	return `hsl(${hue}, 70%, 50%)`;
}
