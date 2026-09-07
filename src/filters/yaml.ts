import type { FilterContext, ParamValidationResult } from '../types';
import { cleanParamToken, cleanScalarParam, splitParams, unwrapParamList } from '../parser-utils';
import { isPlainObject } from './value_utils';
import { reportFilterWarning } from './warnings';

export const validateYamlParams = (param: string | undefined): ParamValidationResult => {
	return !param || cleanScalarParam(param) === 'flow'
		? { valid: true }
		: { valid: false, error: 'accepts only "flow"; omit the parameter for block YAML' };
};

function propertyKey(param: string | undefined): string | undefined {
	if (!param) return undefined;
	const parts = splitParams(unwrapParamList(param));
	return parts.length === 1 ? cleanParamToken(parts[0]) : undefined;
}

export const validateYamlPropertyParams = (param: string | undefined): ParamValidationResult => {
	return propertyKey(param)?.trim()
		? { valid: true }
		: { valid: false, error: 'requires one non-empty property name (e.g., yaml_property:"director")' };
};

// JSON quoting is YAML-compatible, but YAML also treats these Unicode
// characters as line breaks or disallows them in literal form.
function flow(value: YamlValue): string {
	return JSON.stringify(value).replace(/[\u007f-\u009f\u2028\u2029]/g,
		character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

type YamlValue = string | number | boolean | null | YamlValue[] | { [key: string]: YamlValue };

function keyText(key: string): string {
	return /^[a-z_][\w-]*$/i.test(key) && !/^(?:true|false|null|yes|no|on|off|y|n)$/i.test(key)
		? key
		: flow(key);
}

function isBlock(value: YamlValue): boolean {
	return value !== null && typeof value === 'object' && Object.keys(value).length > 0;
}

function block(value: YamlValue): string {
	if (Array.isArray(value)) {
		return value.length === 0 ? '[]'
			: value.map(item => `- ${block(item).replace(/\n/g, '\n  ')}`).join('\n');
	}
	if (value !== null && typeof value === 'object') {
		const entries = Object.entries(value);
		return entries.length === 0 ? '{}'
			: entries.map(([key, item]) => isBlock(item)
				? `${keyText(key)}:\n  ${block(item).replace(/\n/g, '\n  ')}`
				: `${keyText(key)}: ${block(item)}`).join('\n');
	}
	return flow(value);
}

function containsNonFiniteNumber(value: unknown): boolean {
	if (typeof value === 'number') return !Number.isFinite(value);
	if (Array.isArray(value)) return value.some(containsNonFiniteNumber);
	if (value !== null && typeof value === 'object') {
		return Object.values(value).some(containsNonFiniteNumber);
	}
	return false;
}

function collection(value: string, context?: FilterContext): YamlValue[] | { [key: string]: YamlValue } | undefined {
	try {
		if ((Array.isArray(context?.rawValue) || isPlainObject(context?.rawValue)) &&
			containsNonFiniteNumber(context.rawValue)) {
			reportFilterWarning(
				context,
				'Could not serialize a collection containing a number outside the finite JavaScript range',
				'INVALID_FILTER_INPUT',
			);
			return undefined;
		}
		// The renderer's string argument unwraps singleton primitive arrays.
		const parsed = JSON.parse(Array.isArray(context?.rawValue) ? JSON.stringify(context.rawValue) : value);
		if (parsed !== null && typeof parsed === 'object') {
			if (containsNonFiniteNumber(parsed)) {
				reportFilterWarning(
					context,
					'Could not serialize a JSON collection containing a number outside the finite JavaScript range',
					'INVALID_FILTER_INPUT',
				);
				return undefined;
			}
			return parsed;
		}
	} catch {
		// Non-collection text retains the existing scalar behavior.
	}
	return undefined;
}

function scalar(value: string, context?: FilterContext): string {
	if (context?.rawValue === null) return 'null';

	const trimmed = value.trim();
	if (/^(?:true|false|null)$/iu.test(trimmed)) return trimmed;

	// Preserve only canonical finite numbers. Quote strings YAML could
	// reinterpret, such as 007, 0x1F, or 1e5.
	const number = Number(trimmed);
	if (Number.isFinite(number) && String(number) === trimmed) return trimmed;

	// JSON strings are valid YAML double-quoted scalars.
	return flow(value);
}

/** Serialize scalars or JSON collections as YAML, using block collections by default. */
export const yaml = (value: string, param?: string, context?: FilterContext): string => {
	const parsed = collection(value, context);
	return parsed
		? cleanScalarParam(param) === 'flow' ? flow(parsed) : block(parsed)
		: scalar(value, context);
};

/** Serialize a complete property, nesting non-empty collections beneath its key. */
export const yaml_property = (value: string, param?: string, context?: FilterContext): string => {
	const key = propertyKey(param);
	if (!key?.trim()) return value;
	const parsed = collection(value, context);
	return parsed ? block({ [key]: parsed }) : `${keyText(key)}: ${scalar(value, context)}`;
};
