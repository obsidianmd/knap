import type { FilterContext, TemplateValue } from '../types';

export type StringFormatter = (value: string) => string;

export function isPlainObject(value: TemplateValue): value is Record<string, TemplateValue> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

export function inputValue(
	value: string,
	context?: FilterContext,
	parseSerialized = false,
): TemplateValue {
	if (context && Object.prototype.hasOwnProperty.call(context, 'rawValue')) {
		return Array.isArray(context.rawValue) || isPlainObject(context.rawValue)
			? context.rawValue
			: value;
	}
	if (parseSerialized) {
		try {
			return JSON.parse(value);
		} catch {
			// Use the filter's string input when it is not serialized JSON.
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
