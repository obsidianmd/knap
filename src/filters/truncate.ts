import type { FilterContext, ParamValidationResult, TemplateValue } from '../types';

type TruncateMode = 'chars' | 'words';

interface TruncateOptions {
	limit: number;
	mode: TruncateMode;
	suffix: string;
}

function cleanToken(value: string): string {
	return value.trim().replace(/^(["'])([\s\S]*)\1$/, '$2');
}

function splitParams(value: string): string[] {
	const parts: string[] = [];
	let current = '';
	let quote = '';
	let escaped = false;
	for (const character of value) {
		if (escaped) {
			current += character;
			escaped = false;
		} else if (character === '\\') {
			current += character;
			escaped = true;
		} else if (quote) {
			current += character;
			if (character === quote) quote = '';
		} else if (character === '"' || character === "'") {
			current += character;
			quote = character;
		} else if (character === ',') {
			parts.push(cleanToken(current));
			current = '';
		} else {
			current += character;
		}
	}
	parts.push(cleanToken(current));
	return parts;
}

function paramParts(param: string | undefined): string[] {
	return param
		? splitParams(param.replace(/^\(([\s\S]*)\)$/, '$1'))
		: [];
}

function parseParams(param: string | undefined): TruncateOptions {
	const parts = paramParts(param);
	return {
		limit: Number.parseInt(parts[0] ?? '0', 10),
		mode: (parts[1] || 'chars') as TruncateMode,
		suffix: parts[2] ?? '…',
	};
}

export const validateTruncateParams = (param: string | undefined): ParamValidationResult => {
	const parts = paramParts(param);
	if (parts.length === 0 || parts[0] === '') {
		return { valid: false, error: 'requires a non-negative limit (e.g., truncate:100)' };
	}
	if (parts.length > 3) return { valid: false, error: 'accepts at most a limit, mode, and suffix' };
	if (!/^\d+$/.test(parts[0])) return { valid: false, error: 'limit must be a non-negative integer' };
	if (parts[1] && parts[1] !== 'chars' && parts[1] !== 'words') {
		return { valid: false, error: `invalid mode "${parts[1]}". Use "chars" or "words"` };
	}
	return { valid: true };
};

function truncateString(value: string, options: TruncateOptions): string {
	if (options.limit === 0) return value ? '' : value;
	if (options.mode === 'words') {
		const words = [...value.matchAll(/\S+/g)];
		if (words.length <= options.limit) return value;
		const finalWord = words[options.limit - 1];
		return `${value.slice(0, finalWord.index + finalWord[0].length).trimEnd()}${options.suffix}`;
	}
	const characters = Array.from(value);
	return characters.length <= options.limit
		? value
		: `${characters.slice(0, options.limit).join('')}${options.suffix}`;
}

function inputValue(value: string, context?: FilterContext): TemplateValue {
	return context && Object.prototype.hasOwnProperty.call(context, 'rawValue')
		? context.rawValue
		: value;
}

function truncateValue(value: TemplateValue, options: TruncateOptions): TemplateValue {
	if (typeof value === 'string') return truncateString(value, options);
	if (Array.isArray(value)) return value.map(item => truncateValue(item, options));
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, truncateValue(item, options)]),
		);
	}
	return value;
}

export const truncate = (
	value: string,
	param?: string,
	context?: FilterContext,
): TemplateValue => truncateValue(inputValue(value, context), parseParams(param));
