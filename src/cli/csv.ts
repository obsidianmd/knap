import type { TemplateVariables } from '../types';

// Comma-delimited CSV with quoted fields, escaped quotes, and embedded newlines.
// Keep every value as text, including identifiers with leading zeroes.
export function parseCsv(input: string, source: string): TemplateVariables[] {
	const text = input.replace(/^\uFEFF/, '');
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;
	let closedQuote = false;
	let started = false;
	let line = 1;
	const fail = (message: string): never => { throw new Error(`${source}:${line}: Invalid CSV: ${message}`); };
	const endField = () => {
		row.push(field);
		field = '';
		closedQuote = false;
	};
	const endRow = () => {
		// Ignore empty lines, but retain quoted empty values and comma-only rows.
		if (started || row.length) {
			endField();
			rows.push(row);
		}
		row = [];
		started = false;
	};
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (quoted) {
			if (char === '"') {
				if (text[i + 1] === '"') { field += '"'; i++; }
				else { quoted = false; closedQuote = true; }
			}
			else {
				field += char;
				if (char === '\n' || (char === '\r' && text[i + 1] !== '\n')) line++;
			}
			continue;
		}
		if (char === ',') {
			endField();
			started = true;
		}
		else if (char === '\n' || char === '\r') {
			endRow();
			if (char === '\r' && text[i + 1] === '\n') i++;
			line++;
		}
		else if (closedQuote) fail('Unexpected character after a closing quote.');
		else if (char === '"') {
			if (field.length) fail('Quote inside an unquoted field.');
			quoted = true;
			started = true;
		}
		else { field += char; started = true; }
	}
	if (quoted) fail('Unclosed quoted field.');
	endRow();
	const headers = rows.shift();
	if (!headers?.length || headers.some(header => !header.trim())) {
		throw new Error(`${source}: CSV requires nonempty column headers.`);
	}
	if (new Set(headers).size !== headers.length) {
		throw new Error(`${source}: CSV column headers must be unique.`);
	}
	return rows.map((values, index) => {
		if (values.length !== headers.length) {
			throw new Error(`${source}: CSV record ${index + 1} has ${values.length} fields; expected ${headers.length}.`);
		}
		return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
	});
}
