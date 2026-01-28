export interface MuniRecord {
	municipality: string;
	muni_code: string;
	taxable_value: number;
	value_as_of_date: string;
	scraped_at: string;
	scrape_week: string;
	taxable_value_wow_change: number | null;
	taxable_value_wow_pct: number | null;
	year: number;
	taxable_value_ytd_change: number | null;
	taxable_value_ytd_pct: number | null;
}

export interface MuniSummary {
	municipality: string;
	startOfYearValue: number;
	currentValue: number;
	change: number;
	pctChange: number;
	dataAsOf: string;
}

export interface ChartDataset {
	label: string;
	data: { x: string; y: number }[];
	borderColor: string;
	backgroundColor: string;
	tension: number;
	pointRadius: number;
	borderWidth: number;
}
