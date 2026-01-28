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

export function calculateSummaries(data: MuniRecord[]): { summaries: MuniSummary[]; dataAsOf: string } {
	const municipalities = [...new Set(data.map(d => d.municipality))];
	const currentYear = new Date().getFullYear();
	let latestDataAsOf = '';

	const allSummaries = municipalities.map(muni => {
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

		// Track the latest data date
		if (currentRecord?.value_as_of_date && currentRecord.value_as_of_date > latestDataAsOf) {
			latestDataAsOf = currentRecord.value_as_of_date;
		}

		return {
			municipality: muni,
			startOfYearValue: startValue,
			currentValue,
			change,
			pctChange,
			dataAsOf: currentRecord?.value_as_of_date || ''
		};
	});

	// Return all municipalities sorted alphabetically
	const sorted = allSummaries.sort((a, b) => a.municipality.localeCompare(b.municipality));

	return { summaries: sorted, dataAsOf: latestDataAsOf };
}

export function getAggregateChartData(data: MuniRecord[]): { weeks: string[]; values: number[] } {
	const weeks = [...new Set(data.map(d => d.scrape_week))].sort();
	const currentYear = new Date().getFullYear();

	// Calculate total county value for start of year
	const startOfYearData = data.filter(d => d.year === currentYear);
	const startWeek = [...new Set(startOfYearData.map(d => d.scrape_week))].sort()[0];

	let startOfYearTotal = 0;
	if (startWeek) {
		startOfYearTotal = data
			.filter(d => d.scrape_week === startWeek)
			.reduce((sum, d) => sum + d.taxable_value, 0);
	}

	// Calculate YTD percent change for each week
	const values = weeks.map(week => {
		const weekData = data.filter(d => d.scrape_week === week);
		const weekTotal = weekData.reduce((sum, d) => sum + d.taxable_value, 0);

		if (startOfYearTotal === 0) return 0;
		return ((weekTotal - startOfYearTotal) / startOfYearTotal) * 100;
	});

	return { weeks, values };
}
