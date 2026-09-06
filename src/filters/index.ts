import { createParserState, processCharacter } from '../parser-utils';
import type {
	FilterMetadata,
	FilterContext,
	FilterRegistry,
	ParamValidationResult,
	ParamValidator,
	TemplateFilter,
	TemplateValue,
} from '../types';
export type { FilterMetadata, ParamValidationResult, ParamValidator } from '../types';

import { blockquote } from './blockquote';
import {
	bold,
	code,
	code_block,
	comment,
	escape_md,
	hard_break,
	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	highlight,
	hr,
	italic,
	math,
	math_block,
	strike,
	validateBoldParams,
	validateCodeParams,
	validateHighlightParams,
	validateHrParams,
	validateItalicParams,
} from './markdown';
import { calc, validateCalcParams } from './calc';
import { callout } from './callout';
import { camel } from './camel';
import { capitalize } from './capitalize';
import { compact } from './compact';
import { date } from './date';
import { date_modify, validateDateModifyParams } from './date_modify';
import { decode_uri } from './decode_uri';
import { encode_uri } from './encode_uri';
import { first } from './first';
import { footnote } from './footnote';
import { fragment_link } from './fragment_link';
import { image } from './image';
import { join } from './join';
import { kebab } from './kebab';
import { last } from './last';
import { list, validateListParams } from './list';
import { link } from './link';
import { length } from './length';
import { lower } from './lower';
import { map, validateMapParams } from './map';
import { merge } from './merge';
import { nth, validateNthParams } from './nth';
import { number_format } from './number_format';
import { object, validateObjectParams } from './object';
import { pascal } from './pascal';
import { parse_json } from './parse_json';
import { reverse } from './reverse';
import { remove_attr } from './remove_attr';
import { remove_tags } from './remove_tags';
import { replace, validateReplaceParams } from './replace';
import { replace_tags } from './replace_tags';
import { round, validateRoundParams } from './round';
import { safe_name, validateSafeNameParams } from './safe_name';
import { slice, validateSliceParams } from './slice';
import { snake } from './snake';
import { sort, validateSortParams } from './sort';
import { split } from './split';
import { strip_attr } from './strip_attr';
import { strip_md } from './strip_md';
import { strip_tags } from './strip_tags';
import { table, table_pretty } from './table';
import { template, validateTemplateParams } from './template';
import { title } from './title';
import { trim } from './trim';
import { truncate, validateTruncateParams } from './truncate';
import { uncamel } from './uncamel';
import { unescape } from './unescape';
import { unique } from './unique';
import { upper } from './upper';
import { embed, wikilink } from './wikilink';
import { duration } from './duration';
import { yaml } from './yaml';

type FilterFunction = (
	value: string,
	param?: string,
	context?: FilterContext,
) => TemplateValue;

// ============================================================================
// Filter Metadata for Validation
// ============================================================================

const filterMetadata: Record<string, FilterMetadata> = {
	// Filters with validators
	calc: { example: 'calc:"+10"', validateParams: validateCalcParams },
	code: { example: 'code:"typescript"', validateParams: validateCodeParams },
	code_block: { example: 'code_block:"typescript"', validateParams: validateCodeParams },
	date_modify: { example: 'date_modify:"+1 day"', validateParams: validateDateModifyParams },
	hr: { example: 'hr:before', validateParams: validateHrParams },
	highlight: { example: 'highlight:blue', validateParams: validateHighlightParams },
	map: { example: 'map:x => x.name', validateParams: validateMapParams },
	replace: { example: 'replace:"old":"new"', validateParams: validateReplaceParams },
	slice: { example: 'slice:0,5', validateParams: validateSliceParams },
	sort: { example: 'sort:("name", "desc")', validateParams: validateSortParams },
	template: { example: 'template:"${name}"', validateParams: validateTemplateParams },
	truncate: { example: 'truncate:(100, "words")', validateParams: validateTruncateParams },

	// Filters with optional parameters (examples for documentation)
	blockquote: {},
	bold: { example: 'bold:_', validateParams: validateBoldParams },
	callout: { example: 'callout:info' },
	camel: {},
	capitalize: {},
	compact: {},
	comment: {},
	date: { example: 'date:"YYYY-MM-DD"' },
	decode_uri: {},
	duration: {},
	embed: { example: 'embed:"Preview"' },
	encode_uri: {},
	escape_md: {},
	first: {},
	footnote: {},
	fragment_link: {},
	h1: {},
	h2: {},
	h3: {},
	h4: {},
	h5: {},
	h6: {},
	hard_break: {},
	image: {},
	italic: { example: 'italic:_', validateParams: validateItalicParams },
	join: { example: 'join:", "' },
	kebab: {},
	last: {},
	length: {},
	link: {},
	list: { example: 'list:numbered', validateParams: validateListParams },
	lower: {},
	math: {},
	math_block: {},
	merge: {},
	nth: { example: 'nth:2', validateParams: validateNthParams },
	number_format: {},
	object: { example: 'object:"keys"', validateParams: validateObjectParams },
	pascal: {},
	parse_json: {},
	remove_attr: {},
	remove_tags: {},
	replace_tags: {},
	reverse: {},
	round: { example: 'round:2', validateParams: validateRoundParams },
	safe_name: { example: 'safe_name:windows', validateParams: validateSafeNameParams },
	snake: {},
	split: { example: 'split:","' },
	strip_attr: {},
	strip_md: {},
	strip_tags: {},
	stripmd: {},
	strike: {},
	table: {},
	table_pretty: {},
	title: {},
	trim: {},
	uncamel: {},
	unescape: {},
	unique: {},
	upper: {},
	wikilink: {},
	yaml: {},
};

export const standardFilterMetadata: Readonly<Record<string, FilterMetadata>> = Object.freeze(
	Object.fromEntries(
		Object.entries(filterMetadata).map(([name, metadata]) => [name, Object.freeze({ ...metadata })]),
	),
);

const filters: Record<string, FilterFunction> = {
	blockquote,
	bold,
	calc,
	callout,
	camel,
	capitalize,
	compact,
	code,
	code_block,
	comment,
	date_modify,
	date,
	decode_uri,
	duration,
	embed,
	encode_uri,
	escape_md,
	first,
	footnote,
	fragment_link,
	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	hard_break,
	highlight,
	hr,
	image,
	italic,
	join,
	kebab,
	last,
	length,
	link,
	list,
	lower,
	map,
	math,
	math_block,
	merge,
	number_format,
	nth,
	object,
	pascal,
	parse_json,
	reverse,
	remove_attr,
	remove_tags,
	replace,
	replace_tags,
	round,
	safe_name,
	slice,
	snake,
	sort,
	split,
	strip_attr,
	strip_md,
	strip_tags,
	stripmd: strip_md, // an alias for strip_md
	strike,
	table,
	table_pretty,
	template,
	title,
	trim,
	truncate,
	uncamel,
	unescape,
	unique,
	upper,
	wikilink,
	yaml,
};

function asTemplateFilter(name: string, filter: FilterFunction): TemplateFilter {
	const wrapped: TemplateFilter = (value, param, context) =>
		filter(value, param === '' ? undefined : param, context);
	wrapped.metadata = standardFilterMetadata[name] ?? {};
	return wrapped;
}

/** Environment-neutral filters included in the default Knap preset. */
export const standardFilters: Readonly<FilterRegistry> = Object.freeze(
	Object.fromEntries(
		Object.entries(filters).map(([name, filter]) => [name, asTemplateFilter(name, filter)]),
	),
);

// Split individual filters
function splitFilterString(filterString: string): string[] {
	const filters: string[] = [];
	const state = createParserState();

	// Iterate through each character in the filterString
	for (let i = 0; i < filterString.length; i++) {
		const char = filterString[i];

		// Split filters on pipe character when not in quotes, regex, or parentheses
		if (char === '|' && !state.escapeNext && !state.inQuote && !state.inRegex &&
			state.curlyDepth === 0 && state.parenDepth === 0) {
			filters.push(state.current.trim());
			state.current = '';
		} else {
			// For any other character, add it to the current filter
			processCharacter(char, state);
		}
	}

	if (state.current) {
		filters.push(state.current.trim());
	}

	return filters;
}

// Parse the filter into name and parameters
function parseFilterString(filterString: string): string[] {
	const parts: string[] = [];
	const state = createParserState();

	// Iterate through each character in the filterString
	for (let i = 0; i < filterString.length; i++) {
		const char = filterString[i];

		if (char === ':' && !state.escapeNext && !state.inQuote && !state.inRegex &&
			state.parenDepth === 0 && parts.length === 0) {
			parts.push(state.current.trim());
			state.current = '';
		} else {
			processCharacter(char, state);
		}
	}

	if (state.current) {
		parts.push(state.current.trim());
	}

	return parts;
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
	return value !== null
		&& (typeof value === 'object' || typeof value === 'function')
		&& typeof (value as { then?: unknown }).then === 'function';
}

/**
 * Apply a synchronous filter chain against an application-provided registry.
 * This supports host adapters that need filter syntax outside a full render,
 * while keeping parsing and chaining semantics in Knap.
 */
export function applyFiltersWithRegistry<TContext = unknown>(
	value: unknown,
	filterString: string,
	registry: Readonly<FilterRegistry<TContext>>,
	context: FilterContext<TContext>,
): string {
	if (!filterString) {
		return typeof value === 'string' ? value : JSON.stringify(value) ?? '';
	}

	let processedValue: unknown = value;

	for (const filterExpression of splitFilterString(filterString)) {
		const [name, ...params] = parseFilterString(filterExpression);
		const filter = registry[name];

		if (!filter) continue;

		const stringInput = typeof processedValue === 'string'
			? processedValue
			: JSON.stringify(processedValue) ?? '';
		const output = filter(stringInput, params.join(':'), {
			...context,
			rawValue: processedValue,
		});
		if (isThenable(output)) {
			throw new TypeError(`Filter "${name}" is asynchronous; use engine.render() for async filters`);
		}

		if (typeof output === 'string' && (output.startsWith('[') || output.startsWith('{'))) {
			try {
				processedValue = JSON.parse(output);
				continue;
			} catch {
				// Preserve non-JSON strings that merely start with a bracket or brace.
			}
		}

		processedValue = output;
	}

	return typeof processedValue === 'string'
		? processedValue
		: JSON.stringify(processedValue) ?? '';
}
