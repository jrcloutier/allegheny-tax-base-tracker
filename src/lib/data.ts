import type { MuniRecord, MuniSummary, MillageRecord } from './types';

const DATA_URL = 'https://raw.githubusercontent.com/PittsburghPG/scraper-allegheny-county-muni-profiles/main/data/muni-real-estate-time-series.csv';
const MILLAGE_URL = 'https://raw.githubusercontent.com/PittsburghPG/scraper-allegheny-county-muni-profiles/main/data/muni-millage-rates.csv';

export async function fetchData(): Promise<MuniRecord[]> {
	const response = await fetch(DATA_URL);
	const text = await response.text();
	return parseCSV(text);
}

export async function fetchMillageRates(): Promise<MillageRecord[]> {
	const response = await fetch(MILLAGE_URL);
	const text = await response.text();
	return parseMillageCSV(text);
}

function parseCSV(text: string): MuniRecord[] {
	const lines = text.trim().split('\n');
	const headers = lines[0].split(',');

	return lines.slice(1).map(line => {
		const values = parseCSVLine(line);
		const record: Record<string, string | number | null> = {};

		headers.forEach((header, i) => {
			const value = values[i] || '';
			if (header === 'taxable_value' || header === 'exempt_value' || header === 'purta_value' || header === 'year') {
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

function parseMillageCSV(text: string): MillageRecord[] {
	const lines = text.trim().split('\n');
	const headers = lines[0].split(',');

	return lines.slice(1).map(line => {
		const values = parseCSVLine(line);
		return {
			municipality: values[headers.indexOf('municipality')] || '',
			muni_code: values[headers.indexOf('muni_code')] || '',
			tax_year: parseInt(values[headers.indexOf('tax_year')] || '0', 10),
			millage: parseFloat(values[headers.indexOf('millage')] || '0')
		};
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

function calculateValueCategory(
	startRecord: MuniRecord | undefined,
	currentRecord: MuniRecord | undefined,
	field: 'taxable_value' | 'exempt_value' | 'purta_value'
): { startOfYear: number; current: number; change: number; pctChange: number } {
	const startValue = startRecord?.[field] || 0;
	const currentValue = currentRecord?.[field] || 0;
	const change = currentValue - startValue;
	const pctChange = startValue > 0 ? (change / startValue) * 100 : 0;
	return { startOfYear: startValue, current: currentValue, change, pctChange };
}

export function calculateSummaries(
	data: MuniRecord[],
	millageRates: MillageRecord[]
): { summaries: MuniSummary[]; dataAsOf: string } {
	const municipalities = [...new Set(data.map(d => d.municipality))];
	const currentYear = new Date().getFullYear();
	let latestDataAsOf = '';

	// Build a map of muni_code -> most recent millage rate
	// Use muni_code for matching since municipality names differ between datasets
	// Use the latest available year (millage data may lag behind current year)
	const latestMillageYear = Math.max(...millageRates.map(m => m.tax_year));
	const millageMap = new Map<string, number>();
	millageRates
		.filter(m => m.tax_year === latestMillageYear)
		.forEach(m => {
			millageMap.set(m.muni_code, m.millage);
		});

	const allSummaries = municipalities.map(muni => {
		const muniData = data
			.filter(d => d.municipality === muni)
			.sort((a, b) => a.scrape_week.localeCompare(b.scrape_week));

		const yearData = muniData.filter(d => d.year === currentYear);
		const startRecord = yearData[0] || muniData[0];
		const currentRecord = muniData[muniData.length - 1];

		// Calculate all three value categories
		const taxable = calculateValueCategory(startRecord, currentRecord, 'taxable_value');
		const exempt = calculateValueCategory(startRecord, currentRecord, 'exempt_value');
		const purta = calculateValueCategory(startRecord, currentRecord, 'purta_value');

		// Track the latest data date
		if (currentRecord?.value_as_of_date && currentRecord.value_as_of_date > latestDataAsOf) {
			latestDataAsOf = currentRecord.value_as_of_date;
		}

		// Get millage rate for this municipality using muni_code
		const millage = millageMap.get(currentRecord?.muni_code || '') ?? null;

		// Calculate estimated tax impact: change * (millage / 1000)
		// Millage is tax per $1,000 of assessed value
		const estimatedTaxImpact = millage !== null ? taxable.change * (millage / 1000) : null;

		// Calculate tax impact as percentage of start-of-year tax revenue
		// Start-of-year tax = startValue * (millage / 1000)
		const startOfYearTax = millage !== null && taxable.startOfYear > 0 ? taxable.startOfYear * (millage / 1000) : null;
		const taxImpactPct = startOfYearTax !== null && startOfYearTax > 0 && estimatedTaxImpact !== null
			? (estimatedTaxImpact / startOfYearTax) * 100
			: null;

		return {
			municipality: muni,
			muniCode: currentRecord?.muni_code || '',
			dataAsOf: currentRecord?.value_as_of_date || '',
			taxable,
			exempt,
			purta,
			millage,
			estimatedTaxImpact,
			taxImpactPct
		};
	});

	// Return all municipalities sorted alphabetically
	const sorted = allSummaries.sort((a, b) => a.municipality.localeCompare(b.municipality));

	return { summaries: sorted, dataAsOf: latestDataAsOf };
}

export function getAggregateChartData(data: MuniRecord[]): { weeks: string[]; values: number[] } {
	// Get unique value_as_of_date values, sorted
	const dates = [...new Set(data.map(d => d.value_as_of_date))].sort();
	const currentYear = new Date().getFullYear();

	// Calculate total county value for start of year
	const startOfYearData = data.filter(d => d.year === currentYear);
	const startDate = [...new Set(startOfYearData.map(d => d.value_as_of_date))].sort()[0];

	let startOfYearTotal = 0;
	if (startDate) {
		startOfYearTotal = data
			.filter(d => d.value_as_of_date === startDate)
			.reduce((sum, d) => sum + d.taxable_value, 0);
	}

	// Calculate YTD absolute change for each date
	const values = dates.map(date => {
		const dateData = data.filter(d => d.value_as_of_date === date);
		const dateTotal = dateData.reduce((sum, d) => sum + d.taxable_value, 0);
		return dateTotal - startOfYearTotal;
	});

	return { weeks: dates, values };
}

export type ValueType = 'taxable' | 'exempt' | 'purta';

export function getAggregateFacetedChartData(
	data: MuniRecord[],
	valueType: ValueType
): { weeks: string[]; values: number[] } {
	// Get unique value_as_of_date values, sorted
	const dates = [...new Set(data.map(d => d.value_as_of_date))].sort();
	const currentYear = new Date().getFullYear();

	const fieldMap: Record<ValueType, keyof MuniRecord> = {
		taxable: 'taxable_value',
		exempt: 'exempt_value',
		purta: 'purta_value'
	};
	const field = fieldMap[valueType];

	// Calculate total county value for start of year
	const startOfYearData = data.filter(d => d.year === currentYear);
	const startDate = [...new Set(startOfYearData.map(d => d.value_as_of_date))].sort()[0];

	let startOfYearTotal = 0;
	if (startDate) {
		startOfYearTotal = data
			.filter(d => d.value_as_of_date === startDate)
			.reduce((sum, d) => sum + (d[field] as number), 0);
	}

	// Calculate YTD absolute change for each date
	const values = dates.map(date => {
		const dateData = data.filter(d => d.value_as_of_date === date);
		const dateTotal = dateData.reduce((sum, d) => sum + (d[field] as number), 0);
		return dateTotal - startOfYearTotal;
	});

	return { weeks: dates, values };
}

export function getMuniChartData(data: MuniRecord[], muniCode: string): { weeks: string[]; values: number[] } {
	const muniData = data.filter(d => d.muni_code === muniCode);
	// Get unique value_as_of_date values, sorted
	const dates = [...new Set(muniData.map(d => d.value_as_of_date))].sort();
	const currentYear = new Date().getFullYear();

	// Get start of year value for this municipality
	const yearData = muniData.filter(d => d.year === currentYear);
	const sortedYearData = yearData.sort((a, b) => a.value_as_of_date.localeCompare(b.value_as_of_date));
	const startOfYearValue = sortedYearData[0]?.taxable_value || muniData[0]?.taxable_value || 0;

	// Calculate YTD absolute change for each date
	const values = dates.map(date => {
		const dateRecord = muniData.find(d => d.value_as_of_date === date);
		const dateValue = dateRecord?.taxable_value || 0;
		return dateValue - startOfYearValue;
	});

	return { weeks: dates, values };
}

export function getMuniFacetedChartData(
	data: MuniRecord[],
	muniCode: string,
	valueType: ValueType
): { weeks: string[]; values: number[] } {
	const muniData = data.filter(d => d.muni_code === muniCode);
	// Get unique value_as_of_date values, sorted
	const dates = [...new Set(muniData.map(d => d.value_as_of_date))].sort();
	const currentYear = new Date().getFullYear();

	const fieldMap: Record<ValueType, keyof MuniRecord> = {
		taxable: 'taxable_value',
		exempt: 'exempt_value',
		purta: 'purta_value'
	};
	const field = fieldMap[valueType];

	// Get start of year value for this municipality
	const yearData = muniData.filter(d => d.year === currentYear);
	const sortedYearData = yearData.sort((a, b) => a.value_as_of_date.localeCompare(b.value_as_of_date));
	const startOfYearValue = (sortedYearData[0]?.[field] as number) || (muniData[0]?.[field] as number) || 0;

	// Calculate YTD absolute change for each date
	const values = dates.map(date => {
		const dateRecord = muniData.find(d => d.value_as_of_date === date);
		const dateValue = (dateRecord?.[field] as number) || 0;
		return dateValue - startOfYearValue;
	});

	return { weeks: dates, values };
}

export function getMuniSummary(
	data: MuniRecord[],
	millageRates: MillageRecord[],
	muniCode: string
): MuniSummary | null {
	const muniData = data
		.filter(d => d.muni_code === muniCode)
		.sort((a, b) => a.scrape_week.localeCompare(b.scrape_week));

	if (muniData.length === 0) return null;

	const currentYear = new Date().getFullYear();
	const yearData = muniData.filter(d => d.year === currentYear);
	const startRecord = yearData[0] || muniData[0];
	const currentRecord = muniData[muniData.length - 1];

	// Calculate all three value categories
	const taxable = calculateValueCategory(startRecord, currentRecord, 'taxable_value');
	const exempt = calculateValueCategory(startRecord, currentRecord, 'exempt_value');
	const purta = calculateValueCategory(startRecord, currentRecord, 'purta_value');

	// Get millage rate
	const latestMillageYear = Math.max(...millageRates.map(m => m.tax_year));
	const millageRecord = millageRates.find(
		m => m.muni_code === muniCode && m.tax_year === latestMillageYear
	);
	const millage = millageRecord?.millage ?? null;

	// Calculate tax impact
	const estimatedTaxImpact = millage !== null ? taxable.change * (millage / 1000) : null;
	const startOfYearTax = millage !== null && taxable.startOfYear > 0 ? taxable.startOfYear * (millage / 1000) : null;
	const taxImpactPct = startOfYearTax !== null && startOfYearTax > 0 && estimatedTaxImpact !== null
		? (estimatedTaxImpact / startOfYearTax) * 100
		: null;

	return {
		municipality: currentRecord?.municipality || startRecord?.municipality || '',
		muniCode,
		dataAsOf: currentRecord?.value_as_of_date || '',
		taxable,
		exempt,
		purta,
		millage,
		estimatedTaxImpact,
		taxImpactPct
	};
}
