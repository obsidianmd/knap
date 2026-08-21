import { html_to_json } from './filters/html_to_json';
import { remove_html } from './filters/remove_html';
import type { FilterContext, FilterRegistry, TemplateFilter } from './types';

function htmlFilter(filter: (value: string, param?: string, context?: FilterContext) => string): TemplateFilter {
	const wrapped: TemplateFilter = (value, param, context) => filter(value, param, context);
	wrapped.metadata = {};
	return wrapped;
}

/** Filters that require browser-compatible DOM globals such as DOMParser. */
export const htmlFilters: Readonly<FilterRegistry> = Object.freeze({
	html_to_json: htmlFilter(html_to_json),
	remove_html: htmlFilter(remove_html),
});
