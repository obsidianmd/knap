import type { FilterContext, ParamValidationResult, TemplateValue } from '../types';
import { cleanParamToken, splitParams, unwrapParamList } from '../parser-utils';
import { inputValue, mapStringValues } from './value_utils';

interface TruncateOptions {
	limit: number;
	suffix: string;
}

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

function graphemes(value: string): string[] {
	return [...graphemeSegmenter.segment(value)].map(segment => segment.segment);
}

function paramParts(param: string | undefined): string[] {
	return param
		? splitParams(unwrapParamList(param)).map(cleanParamToken)
		: [];
}

function parseParams(param: string | undefined): TruncateOptions {
	const parts = paramParts(param);
	return {
		limit: Number.parseInt(parts[0] ?? '0', 10),
		suffix: parts[1] ?? '…',
	};
}

function validateParams(param: string | undefined, example: string): ParamValidationResult {
	const parts = paramParts(param);
	if (parts.length === 0 || parts[0] === '') {
		return { valid: false, error: `requires a non-negative limit (e.g., ${example})` };
	}
	if (parts.length > 2) return { valid: false, error: 'accepts at most a limit and suffix' };
	if (!/^\d+$/.test(parts[0])) return { valid: false, error: 'limit must be a non-negative integer' };
	return { valid: true };
}

export const validateTruncateParams = (param: string | undefined): ParamValidationResult =>
	validateParams(param, 'truncate:100');

export const validateTruncatewordsParams = (param: string | undefined): ParamValidationResult =>
	validateParams(param, 'truncatewords:20');

function truncateString(value: string, options: TruncateOptions): string {
	if (options.limit === 0) return '';
	const characters = graphemes(value);
	if (characters.length <= options.limit) return value;

	const suffix = graphemes(options.suffix).slice(0, options.limit);
	const contentLimit = Math.max(0, options.limit - suffix.length);
	return `${characters.slice(0, contentLimit).join('')}${suffix.join('')}`;
}

function truncateWordsString(value: string, options: TruncateOptions): string {
	if (options.limit === 0) return '';
	const words = [...value.matchAll(/\S+/g)];
	if (words.length <= options.limit) return value;
	const finalWord = words[options.limit - 1];
	return `${value.slice(0, finalWord.index + finalWord[0].length)}${options.suffix}`;
}

function truncateValue(
	value: string,
	param: string | undefined,
	context: FilterContext | undefined,
	formatter: (item: string, options: TruncateOptions) => string,
): TemplateValue {
	const options = parseParams(param);
	return mapStringValues(inputValue(value, context), item => formatter(item, options));
}

export const truncate = (
	value: string,
	param?: string,
	context?: FilterContext,
): TemplateValue => truncateValue(value, param, context, truncateString);

export const truncatewords = (
	value: string,
	param?: string,
	context?: FilterContext,
): TemplateValue => truncateValue(value, param, context, truncateWordsString);
