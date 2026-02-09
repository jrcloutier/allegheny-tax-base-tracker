import type { EntryGenerator } from './$types';

const DATA_URL = 'https://raw.githubusercontent.com/PittsburghPG/scraper-allegheny-county-muni-profiles/main/data/muni-real-estate-time-series.csv';

export const entries: EntryGenerator = async () => {
	const response = await fetch(DATA_URL);
	const text = await response.text();

	// Parse CSV to get unique muni_codes
	const lines = text.trim().split('\n');
	const headers = lines[0].split(',');
	const muniCodeIndex = headers.indexOf('muni_code');

	const muniCodes = new Set<string>();
	for (let i = 1; i < lines.length; i++) {
		const values = lines[i].split(',');
		const code = values[muniCodeIndex]?.trim();
		if (code) {
			muniCodes.add(code);
		}
	}

	return Array.from(muniCodes).map(code => ({ code }));
};

export const prerender = true;
