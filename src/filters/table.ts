import type { FilterContext } from '../types';
import { splitParams, unquoteParamToken, unwrapParamList } from '../parser-utils';
import { reportFilterWarning } from './warnings';

function parseHeaders(params: string | undefined): string[] {
	if (!params) return [];
	return splitParams(unwrapParamList(params))
		.map(unquoteParamToken);
}

const escapeCell = (cell: string) => cell.replace(/\|/g, '\\|');
const cellWidth = (cell: string) => Array.from(cell).length;
const padCell = (cell: string, width: number) => `${cell}${' '.repeat(width - cellWidth(cell))}`;

function widestCell(rows: string[][], column: number, minimum: number): number {
	let width = minimum;
	for (const row of rows) {
		width = Math.max(width, cellWidth(row[column]));
	}
	return width;
}

function widestRow(rows: unknown[][]): number {
	let width = 0;
	for (const row of rows) {
		width = Math.max(width, row.length);
	}
	return width;
}

function renderTable(headers: unknown[], rows: unknown[][], pretty: boolean): string {
	const columnCount = headers.length;
	const normalizedHeaders = headers.map(value => escapeCell(String(value)));
	const normalizedRows = rows.map(row =>
		[...row, ...Array(Math.max(0, columnCount - row.length)).fill('')]
			.slice(0, columnCount)
			.map(value => escapeCell(String(value))),
	);

	if (!pretty) {
		return [
			`| ${normalizedHeaders.join(' | ')} |`,
			`| ${normalizedHeaders.map(() => '-').join(' | ')} |`,
			...normalizedRows.map(row => `| ${row.join(' | ')} |`),
		].join('\n');
	}

	const widths = normalizedHeaders.map((header, column) =>
		widestCell(normalizedRows, column, Math.max(3, cellWidth(header))));
	const formatRow = (row: string[]) =>
		`| ${row.map((cell, column) => padCell(cell, widths[column])).join(' | ')} |`;

	return [
		formatRow(normalizedHeaders),
		`| ${widths.map(width => '-'.repeat(width)).join(' | ')} |`,
		...normalizedRows.map(formatRow),
	].join('\n');
}

const formatTable = (
	str: string,
	params: string | undefined,
	context: FilterContext | undefined,
	pretty: boolean,
): string => {
	if (!str || str === 'undefined' || str === 'null') return str;

	try {
		const data = JSON.parse(str);
		const customHeaders = parseHeaders(params);

		if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
			const entries = Object.entries(data);
			if (entries.length === 0) return str;
			return renderTable(entries[0], entries.slice(1), pretty);
		}

		if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
			const maxColumns = widestRow(data);
			const headers = customHeaders.length > 0
				? [...customHeaders, ...Array(Math.max(0, maxColumns - customHeaders.length)).fill('')]
				: Array(maxColumns).fill('');
			return renderTable(headers, data, pretty);
		}

		if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
			const headers = customHeaders.length > 0 ? customHeaders : Object.keys(data[0]);
			const rows = data.map(row => headers.map(header => row[header] ?? ''));
			return renderTable(headers, rows, pretty);
		}

		if (Array.isArray(data)) {
			if (customHeaders.length > 0) {
				const rows: unknown[][] = [];
				for (let index = 0; index < data.length; index += customHeaders.length) {
					rows.push(data.slice(index, index + customHeaders.length));
				}
				return renderTable(customHeaders, rows, pretty);
			}
			return renderTable(['Value'], data.map(item => [item]), pretty);
		}

		return str;
	} catch {
		reportFilterWarning(context, 'Could not parse value as JSON table data', 'INVALID_FILTER_INPUT');
		return str;
	}
};

export const table = (str: string, params?: string, context?: FilterContext): string =>
	formatTable(str, params, context, false);

export const table_pretty = (str: string, params?: string, context?: FilterContext): string =>
	formatTable(str, params, context, true);
