import type { FilterContext, ParamValidationResult, TemplateValue } from '../types';
import { cleanParamToken, splitParams } from '../parser-utils';
import { inputValue, mapStringValues } from './value_utils';

type TruncateMode = 'chars' | 'words';

interface TruncateOptions {
	limit: number;
	mode: TruncateMode;
	suffix: string;
}

function paramParts(param: string | undefined): string[] {
	return param
		? splitParams(param.replace(/^\(([\s\S]*)\)$/, '$1')).map(cleanParamToken)
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
	if (options.limit === 0) return '';
	if (options.mode === 'words') {
		const words = [...value.matchAll(/\S+/g)];
		if (words.length <= options.limit) return value;
		const finalWord = words[options.limit - 1];
		return `${value.slice(0, finalWord.index + finalWord[0].length).trimEnd()}${options.suffix}`;
	}
	const characters = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)]
		.map(segment => segment.segment);
	return characters.length <= options.limit
		? value
		: `${characters.slice(0, options.limit).join('')}${options.suffix}`;
}

export const truncate = (
	value: string,
	param?: string,
	context?: FilterContext,
): TemplateValue => {
	const options = parseParams(param);
	return mapStringValues(inputValue(value, context), item => truncateString(item, options));
};
