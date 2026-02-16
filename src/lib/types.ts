export interface MuniRecord {
	municipality: string;
	muni_code: string;
	taxable_value: number;
	exempt_value: number;
	purta_value: number;
	value_as_of_date: string;
	scraped_at: string;
	scrape_week: string;
	taxable_value_wow_change: number | null;
	taxable_value_wow_pct: number | null;
	year: number;
	taxable_value_ytd_change: number | null;
	taxable_value_ytd_pct: number | null;
}

export interface ValueCategory {
	startOfYear: number;
	current: number;
	change: number;
	pctChange: number;
	weeklyChange: number;
	weeklyPctChange: number;
}

export interface MuniSummary {
	municipality: string;
	muniCode: string;
	dataAsOf: string;
	taxable: ValueCategory;
	exempt: ValueCategory;
	purta: ValueCategory;
	millage: number | null;
	estimatedTaxImpact: number | null;
	taxImpactPct: number | null;
	weeklyTaxImpact: number | null;
	weeklyTaxImpactPct: number | null;
}

export interface MillageRecord {
	municipality: string;
	muni_code: string;
	tax_year: number;
	millage: number;
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
