import { createParserState, processCharacter } from '../parser-utils';
import type {
	FilterMetadata,
	FilterContext,
	FilterRegistry,
	ParamValidationResult,
	ParamValidator,
	TemplateFilter,
} from '../types';
export type { FilterMetadata, ParamValidationResult, ParamValidator } from '../types';

import { blockquote } from './blockquote';
import { calc, validateCalcParams } from './calc';
import { callout } from './callout';
import { camel } from './camel';
import { capitalize } from './capitalize';
import { date } from './date';
import { date_modify, validateDateModifyParams } from './date_modify';
import { decode_uri } from './decode_uri';
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
import { reverse } from './reverse';
import { remove_attr } from './remove_attr';
import { remove_tags } from './remove_tags';
import { replace, validateReplaceParams } from './replace';
import { replace_tags } from './replace_tags';
import { round, validateRoundParams } from './round';
import { safe_name, validateSafeNameParams } from './safe_name';
import { slice, validateSliceParams } from './slice';
import { snake } from './snake';
import { split } from './split';
import { strip_attr } from './strip_attr';
import { strip_md } from './strip_md';
import { strip_tags } from './strip_tags';
import { table } from './table';
import { template, validateTemplateParams } from './template';
import { title } from './title';
import { trim } from './trim';
import { uncamel } from './uncamel';
import { unescape } from './unescape';
import { unique } from './unique';
import { upper } from './upper';
import { wikilink } from './wikilink';
import { duration } from './duration';

type FilterFunction = (
	value: string,
	param?: string,
	context?: FilterContext,
) => string | any[];

// ============================================================================
// Filter Metadata for Validation
// ============================================================================

const filterMetadata: Record<string, FilterMetadata> = {
	// Filters with validators
	calc: { example: 'calc:"+10"', validateParams: validateCalcParams },
	date_modify: { example: 'date_modify:"+1 day"', validateParams: validateDateModifyParams },
	map: { example: 'map:x => x.name', validateParams: validateMapParams },
	replace: { example: 'replace:"old":"new"', validateParams: validateReplaceParams },
	slice: { example: 'slice:0,5', validateParams: validateSliceParams },
	template: { example: 'template:"${name}"', validateParams: validateTemplateParams },

	// Filters with optional parameters (examples for documentation)
	blockquote: {},
	callout: { example: 'callout:info' },
	camel: {},
	capitalize: {},
	date: { example: 'date:"YYYY-MM-DD"' },
	decode_uri: {},
	duration: {},
	first: {},
	footnote: {},
	fragment_link: {},
	image: {},
	join: { example: 'join:", "' },
	kebab: {},
	last: {},
	length: {},
	link: {},
	list: { example: 'list:numbered', validateParams: validateListParams },
	lower: {},
	merge: {},
	nth: { example: 'nth:2', validateParams: validateNthParams },
	number_format: {},
	object: { example: 'object:keys', validateParams: validateObjectParams },
	pascal: {},
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
	table: {},
	title: {},
	trim: {},
	uncamel: {},
	unescape: {},
	unique: {},
	upper: {},
	wikilink: {},
};

export const standardFilterMetadata: Readonly<Record<string, FilterMetadata>> = Object.freeze(
	Object.fromEntries(
		Object.entries(filterMetadata).map(([name, metadata]) => [name, Object.freeze({ ...metadata })]),
	),
);

const filters: Record<string, FilterFunction> = {
	blockquote,
	calc,
	callout,
	camel,
	capitalize,
	date_modify,
	date,
	decode_uri,
	duration,
	first,
	footnote,
	fragment_link,
	image,
	join,
	kebab,
	last,
	length,
	link,
	list,
	lower,
	map,
	merge,
	number_format,
	nth,
	object,
	pascal,
	reverse,
	remove_attr,
	remove_tags,
	replace,
	replace_tags,
	round,
	safe_name,
	slice,
	snake,
	split,
	strip_attr,
	strip_md,
	strip_tags,
	stripmd: strip_md, // an alias for strip_md
	table,
	template,
	title,
	trim,
	uncamel,
	unescape,
	unique,
	upper,
	wikilink
};

function asTemplateFilter(name: string, filter: FilterFunction): TemplateFilter {
	const wrapped: TemplateFilter = (value, param, context) => filter(value, param, context);
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

	// Remove all spaces before and after | that are not within quotes or parentheses
	filterString = filterString.replace(/\s*\|\s*(?=(?:[^"'()]*["'][^"'()]*["'])*[^"'()]*$)/g, '|');

	// Iterate through each character in the filterString
	for (let i = 0; i < filterString.length; i++) {
		const char = filterString[i];

		// Split filters on pipe character when not in quotes, regex, or parentheses
		if (char === '|' && !state.inQuote && !state.inRegex &&
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

		if (char === ':' && !state.inQuote && !state.inRegex &&
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

/**
 * Apply a synchronous filter chain against an application-provided registry.
 * This supports host adapters that need filter syntax outside a full render,
 * while keeping parsing and chaining semantics in Knap.
 */
export function applyFiltersWithRegistry<TContext = unknown>(
	value: string | any[],
	filterString: string,
	registry: Readonly<FilterRegistry<TContext>>,
	context: FilterContext<TContext>,
): string {
	if (!filterString) {
		return typeof value === 'string' ? value : JSON.stringify(value);
	}

	let processedValue: unknown = value;

	for (const filterExpression of splitFilterString(filterString)) {
		const [name, ...params] = parseFilterString(filterExpression);
		const filter = registry[name];

		if (!filter) continue;

		const stringInput = typeof processedValue === 'string'
			? processedValue
			: JSON.stringify(processedValue);
		const output = filter(stringInput, params.join(':'), context);
		if (output instanceof Promise) {
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
