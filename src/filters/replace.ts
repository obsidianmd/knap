import { TemplateRuntimeError } from '../errors';
import { parseRegexPattern, splitParams, unquoteParamToken, unwrapParamList } from '../parser-utils';
import type { ParamValidationResult } from '../filters';
import type { FilterContext } from '../types';
import { errorMessage, reportFilterWarning } from './warnings';

export const validateReplaceParams = (param: string | undefined): ParamValidationResult => {
	if (!param) {
		return { valid: false, error: 'requires search and replacement (e.g., replace:"old":"new")' };
	}

	const replacements = splitParams(unwrapParamList(param));
	const allValid = replacements.length > 0 && replacements.every(replacement => {
		const pair = splitReplacementPair(replacement);
		if (!pair) return false;
		const [search, replacementValue] = pair;
		const quotedSearch = /^(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')$/.test(search.trim());
		const regexSearch = /^\/(?:\\.|[^/\\])+\/[gimsuy]*$/.test(search.trim());
		const quotedReplacement = replacementValue.trim() === '' ||
			/^(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')$/.test(replacementValue.trim());
		return (quotedSearch || regexSearch) && quotedReplacement;
	});
	const legacyValid = /["'][^"']*["']\s*:\s*["'][^"']*["']/.test(unwrapParamList(param)) ||
		/["'][^"']*["']\s*:/.test(unwrapParamList(param)) ||
		/\/[^/]+\/[gimsuy]*\s*:/.test(unwrapParamList(param));

	if (!allValid && !legacyValid) {
		return {
			valid: false,
			error: 'values must be quoted (e.g., replace:"old":"new" or replace:"text":"")'
		};
	}

	return { valid: true };
};

function splitReplacementPair(value: string): [string, string] | null {
	let quote = '';
	let inRegex = false;
	let escaped = false;
	for (let index = 0; index < value.length; index++) {
		const character = value[index];
		if (escaped) {
			escaped = false;
		} else if (character === '\\') {
			escaped = true;
		} else if (quote) {
			if (character === quote) quote = '';
		} else if (inRegex) {
			if (character === '/') inRegex = false;
		} else if (character === '"' || character === "'") {
			quote = character;
		} else if (character === '/' && value.slice(0, index).trim() === '') {
			inRegex = true;
		} else if (character === ':') {
			return [value.slice(0, index), value.slice(index + 1)];
		}
	}
	return null;
}

export const replace = (str: string, param?: string, context?: FilterContext): string => {
	if (!param) {
		return str;
	}

	const replacements = splitParams(unwrapParamList(param));

	// Apply each replacement in sequence
	return replacements.reduce((acc, replacement) => {
		const legacyPair = replacement.split(/(?<=[^\\]["']):(?=["'])/);
		const pair = splitReplacementPair(replacement) ??
			(legacyPair.length >= 2 ? [legacyPair[0], legacyPair.slice(1).join(':')] : null);
		if (!pair) return acc;
		let [search, replace] = pair.map(unquoteParamToken);

		// Use an empty string if replace is undefined
		replace = replace || '';

		// Check if this is a regex pattern
		const regexInfo = parseRegexPattern(search);
		if (regexInfo) {
			if (context?.allowRegex === false) {
				throw new TemplateRuntimeError('Regex replacements are disabled', 'INVALID_FILTER_ARGUMENTS');
			}
			try {
				// Process escaped sequences in replacement string
				replace = processEscapedCharacters(replace);
				const regex = new RegExp(regexInfo.pattern, regexInfo.flags);
				return boundedReplace(acc, regex, replace, context);
			} catch (error) {
				if (error instanceof TemplateRuntimeError) throw error;
				reportFilterWarning(
					context,
					`Invalid regular expression: ${errorMessage(error)}`,
					'INVALID_FILTER_INPUT',
				);
				return acc;
			}
		}

		// Handle escaped sequences for both search and replace
		search = processEscapedCharacters(search);
		replace = processEscapedCharacters(replace);

		// For | and : characters, use string.split and join
		if (search === '|' || search === ':') {
			const parts = acc.split(search);
			context?.checkLength?.(acc.length + (parts.length - 1) * (replace.length - search.length));
			return parts.join(replace);
		}

		// For literal newlines and other special regex characters, use split and join
		if (search.includes('\n') || search.includes('\r') || search.includes('\t')) {
			const parts = acc.split(search);
			context?.checkLength?.(acc.length + (parts.length - 1) * (replace.length - search.length));
			return parts.join(replace);
		}

		// Escape special regex characters for literal string replacement
		const searchRegex = new RegExp(search.replace(/([.*+?^${}()|[\]\\])/g, '\\$1'), 'g');
		return boundedReplace(acc, searchRegex, replace, context);
	}, str);
};

function processEscapedCharacters(str: string): string {
	return str.replace(/\\([nrt]|[^nrt])/g, (match, char) => {
		switch (char) {
			case 'n': return '\n';
			case 'r': return '\r';
			case 't': return '\t';
			default: return char;
		}
	});
}

/** Preserve native replacement syntax while checking each expansion before joining. */
function boundedReplace(input: string, regex: RegExp, replacement: string, context?: FilterContext): string {
	if (!context?.checkLength) return input.replace(regex, replacement);
	let length = input.length;
	return input.replace(regex, (match, ...args: any[]) => {
		const named = typeof args.at(-1) === 'object' ? args.pop() : undefined;
		args.pop(); // Original input.
		const offset = args.pop() as number;
		const captures = args as (string | undefined)[];
		let expandedLength = replacement.length;
		const expanded = replacement.replace(/\$(\$|&|`|'|\d{1,2}|<[^>]*>)/g, (token, key: string) => {
			const substitute = () => {
				if (key === '$') return '$';
				if (key === '&') return match;
				if (key === '`') return input.slice(0, offset);
				if (key === "'") return input.slice(offset + match.length);
				if (key.startsWith('<')) return named ? named[key.slice(1, -1)] ?? '' : token;
				const index = Number(key);
				if (index > 0 && index <= captures.length) return captures[index - 1] ?? '';
				const first = Number(key[0]);
				if (key.length === 2 && first > 0 && first <= captures.length) return (captures[first - 1] ?? '') + key[1];
				return token;
			};
			const value = substitute();
			expandedLength += value.length - token.length;
			context.checkLength!(length - match.length + expandedLength);
			return value;
		});
		length += expanded.length - match.length;
		context.checkLength!(length);
		return expanded;
	});
}
