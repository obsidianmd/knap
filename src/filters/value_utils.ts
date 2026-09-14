import type { FilterContext, TemplateValue } from '../types';

export type StringFormatter = (value: string) => string;

export function finiteNumber(value: TemplateValue): number | undefined {
	if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
	if (typeof value !== 'string' || value.trim() === '') return undefined;
	const number = Number(value.trim());
	return Number.isFinite(number) ? number : undefined;
}

export function isPlainObject(value: TemplateValue): value is Record<string, TemplateValue> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

export function inputValue(
	value: string,
	context?: FilterContext,
	allowLeadingWhitespace = false,
): TemplateValue {
	if (context && Object.prototype.hasOwnProperty.call(context, 'rawValue')) {
		if (Array.isArray(context.rawValue) || isPlainObject(context.rawValue)) {
			return context.rawValue;
		}
	}

	const collectionText = allowLeadingWhitespace ? value.trimStart() : value;
	if (collectionText.startsWith('[') || collectionText.startsWith('{')) {
		try {
			const parsed: TemplateValue = JSON.parse(value);
			if (Array.isArray(parsed) || isPlainObject(parsed)) return parsed;
		} catch {
			// Use the string input when it is not a serialized collection.
		}
	}

	return value;
}

/** Read typed collection input while preserving non-collection values unchanged. */
export function collectionInputValue(
	value: string,
	context?: FilterContext,
	allowLeadingWhitespace = false,
): TemplateValue {
	if (context && Object.prototype.hasOwnProperty.call(context, 'rawValue')) {
		const rawValue = context.rawValue;
		if (Array.isArray(rawValue) || isPlainObject(rawValue)) return rawValue;
		if (typeof rawValue !== 'string') return rawValue;
	}

	const collectionText = allowLeadingWhitespace ? value.trimStart() : value;
	if (collectionText.startsWith('[') || collectionText.startsWith('{')) {
		try {
			const parsed: TemplateValue = JSON.parse(value);
			if (Array.isArray(parsed) || isPlainObject(parsed)) return parsed;
		} catch {
			// Use the string input when it is not a serialized collection.
		}
	}

	return value;
}

/** Read an array input without coercing non-array JSON strings into typed values. */
export function arrayInputValue(
	value: string,
	context?: FilterContext,
): TemplateValue {
	if (context && Object.prototype.hasOwnProperty.call(context, 'rawValue')) {
		const rawValue = context.rawValue;
		if (Array.isArray(rawValue)) return rawValue;
		if (typeof rawValue !== 'string') return rawValue;
	}

	if (value.trimStart().startsWith('[')) {
		try {
			const parsed: TemplateValue = JSON.parse(value);
			if (Array.isArray(parsed)) return parsed;
		} catch {
			// Use the string input when it is not a serialized array.
		}
	}

	return value;
}

export function mapStringValues(value: TemplateValue, formatter: StringFormatter): TemplateValue {
	if (typeof value === 'string') return formatter(value);
	if (Array.isArray(value)) return value.map(item => mapStringValues(item, formatter));
	if (isPlainObject(value)) {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, mapStringValues(item, formatter)]),
		);
	}
	return value;
}
