import type { FilterContext, ParamValidationResult, TemplateValue } from '../types';
import { cleanScalarParam } from '../parser-utils';
import { inputValue, mapStringValues, type StringFormatter } from './value_utils';

function markdownFilter(formatter: StringFormatter) {
	return (value: string, _param?: string, context?: FilterContext): TemplateValue =>
		mapStringValues(inputValue(value, context), formatter);
}

function wrapInline(value: string, open: string, close = open): string {
	if (!value.trim()) return value;
	const content = value.trim();
	const start = value.indexOf(content);
	return `${value.slice(0, start)}${open}${content}${close}${value.slice(start + content.length)}`;
}

function splitBlankLinePadding(value: string): { leading: string; content: string; trailing: string } {
	const leading = value.match(/^(?:[\t ]*\r?\n)+/)?.[0] ?? '';
	const withoutLeading = value.slice(leading.length);
	const trailing = withoutLeading.match(/(?:\r?\n[\t ]*)+$/)?.[0] ?? '';
	return {
		leading,
		content: withoutLeading.slice(0, withoutLeading.length - trailing.length),
		trailing,
	};
}

function isMultiline(value: string): boolean {
	return /[\r\n]/.test(value);
}

function formatHeading(level: number, value: string): string {
	if (value === '') return value;
	const prefix = `${'#'.repeat(level)} `;
	return value.split(/(\r?\n)/).map(part =>
		/^(?:\r?\n)$/.test(part) || !part.trim() ? part : `${prefix}${part}`
	).join('');
}

export const h1 = markdownFilter(value => formatHeading(1, value));
export const h2 = markdownFilter(value => formatHeading(2, value));
export const h3 = markdownFilter(value => formatHeading(3, value));
export const h4 = markdownFilter(value => formatHeading(4, value));
export const h5 = markdownFilter(value => formatHeading(5, value));
export const h6 = markdownFilter(value => formatHeading(6, value));

const markdownPunctuation = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g;

export const escape_md = markdownFilter(value => value.replace(markdownPunctuation, '\\$&'));

export const hard_break = markdownFilter(value => value.replace(
	/^([^\r\n]*\S)[\t ]*(\r?\n)(?=[^\r\n]*\S)/gm,
	'$1  $2',
));

function validateMarkerParam(
	param: string | undefined,
	markers: readonly string[],
): ParamValidationResult {
	const marker = cleanScalarParam(param);
	if (marker === undefined || markers.includes(marker)) return { valid: true };
	return {
		valid: false,
		error: `invalid marker "${marker}". Use ${markers.map(value => `"${value}"`).join(' or ')}`,
	};
}

export const validateBoldParams = (param: string | undefined): ParamValidationResult =>
	validateMarkerParam(param, ['*', '_']);

export const validateItalicParams = (param: string | undefined): ParamValidationResult =>
	validateMarkerParam(param, ['*', '_']);

export const bold = (value: string, param?: string, context?: FilterContext): TemplateValue => {
	const marker = cleanScalarParam(param) ?? '*';
	return mapStringValues(inputValue(value, context), item => wrapInline(item, marker.repeat(2)));
};

export const italic = (value: string, param?: string, context?: FilterContext): TemplateValue => {
	const marker = cleanScalarParam(param) ?? '*';
	return mapStringValues(inputValue(value, context), item => wrapInline(item, marker));
};

export const strike = markdownFilter(value => wrapInline(value, '~~'));

const highlightColorMarkers = {
	red: '🔴',
	orange: '🟠',
	yellow: '🟡',
	green: '🟢',
	blue: '🔵',
	purple: '🟣',
} as const;

const highlightMarkers = new Set<string>(Object.values(highlightColorMarkers));

function resolveHighlightMarker(param: string | undefined): string | undefined {
	const color = cleanScalarParam(param);
	if (color === undefined) return '';
	if (Object.prototype.hasOwnProperty.call(highlightColorMarkers, color)) {
		return highlightColorMarkers[color as keyof typeof highlightColorMarkers];
	}
	return highlightMarkers.has(color) ? color : undefined;
}

export const validateHighlightParams = (param: string | undefined): ParamValidationResult => {
	const color = cleanScalarParam(param);
	if (resolveHighlightMarker(param) !== undefined) {
		return { valid: true };
	}
	return {
		valid: false,
		error: `invalid color "${color}". Use a supported color name or circle emoji`,
	};
};

export const highlight = (value: string, param?: string, context?: FilterContext): TemplateValue => {
	const marker = resolveHighlightMarker(param) ?? '';
	return mapStringValues(inputValue(value, context), item => wrapInline(item, `==${marker}`, '=='));
};

type HrPosition = 'after' | 'before' | 'both';

function appendBlock(value: string, block: string): string {
	if (value === '') return block;
	if (/(?:\r?\n[\t ]*){2,}$/.test(value)) return `${value}${block}`;
	if (/\r?\n[\t ]*$/.test(value)) return `${value}\n${block}`;
	return `${value}\n\n${block}`;
}

function prependBlock(value: string, block: string): string {
	if (value === '') return block;
	if (/^(?:[\t ]*\r?\n){2,}/.test(value)) return `${block}${value}`;
	if (/^[\t ]*\r?\n/.test(value)) return `${block}\n${value}`;
	return `${block}\n\n${value}`;
}

export const validateHrParams = (param: string | undefined): ParamValidationResult => {
	const position = cleanScalarParam(param);
	if (position === undefined || ['after', 'before', 'both'].includes(position)) {
		return { valid: true };
	}
	return { valid: false, error: `invalid position "${position}". Use "after", "before", or "both"` };
};

export const hr = (value: string, param?: string, context?: FilterContext): TemplateValue => {
	const position = (cleanScalarParam(param) ?? 'after') as HrPosition;
	return mapStringValues(inputValue(value, context), item => {
		if (position === 'before') return prependBlock(item, '---');
		if (position === 'both') return appendBlock(prependBlock(item, '---'), '---');
		return appendBlock(item, '---');
	});
};

function longestBacktickRun(value: string): number {
	return Math.max(0, ...Array.from(value.matchAll(/`+/g), match => match[0].length));
}

function formatInlineCode(value: string): string {
	if (!value.trim()) return value;
	const content = value.trim();
	const start = value.indexOf(content);
	const delimiter = '`'.repeat(Math.max(1, longestBacktickRun(content) + 1));
	const padding = content.startsWith('`') || content.endsWith('`') ? ' ' : '';
	return `${value.slice(0, start)}${delimiter}${padding}${content}${padding}${delimiter}${value.slice(start + content.length)}`;
}

function formatCodeBlock(value: string, language = ''): string {
	if (value === '') return value;
	const { leading, content, trailing } = splitBlankLinePadding(value);
	if (content === '') return value;
	const fence = '`'.repeat(Math.max(3, longestBacktickRun(content) + 1));
	return `${leading}${fence}${language}\n${content}\n${fence}${trailing}`;
}

export const validateCodeParams = (param: string | undefined): ParamValidationResult => {
	const language = cleanScalarParam(param);
	if (language === undefined || (!/[\r\n`]/.test(language))) return { valid: true };
	return { valid: false, error: 'language cannot contain newlines or backticks' };
};

export const code = (value: string, param?: string, context?: FilterContext): TemplateValue => {
	const language = cleanScalarParam(param);
	return mapStringValues(inputValue(value, context), item =>
		language !== undefined || isMultiline(item)
			? formatCodeBlock(item, language ?? '')
			: formatInlineCode(item)
	);
};

export const code_block = (value: string, param?: string, context?: FilterContext): TemplateValue => {
	const language = cleanScalarParam(param) ?? '';
	return mapStringValues(inputValue(value, context), item => formatCodeBlock(item, language));
};

function formatMathBlock(value: string): string {
	if (value === '') return value;
	const { leading, content, trailing } = splitBlankLinePadding(value);
	if (content === '') return value;
	return `${leading}$$\n${content}\n$$${trailing}`;
}

export const math = markdownFilter(value =>
	isMultiline(value) ? formatMathBlock(value) : wrapInline(value, '$')
);
export const math_block = markdownFilter(formatMathBlock);

export const comment = markdownFilter(value => {
	if (value === '') return value;
	if (!isMultiline(value)) return wrapInline(value, '%%');
	const { leading, content, trailing } = splitBlankLinePadding(value);
	return content ? `${leading}%%\n${content}\n%%${trailing}` : value;
});
