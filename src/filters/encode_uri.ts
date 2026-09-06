import type { FilterContext, TemplateValue } from '../types';

function inputValue(value: string, context?: FilterContext): TemplateValue {
	return context && Object.prototype.hasOwnProperty.call(context, 'rawValue')
		? context.rawValue
		: value;
}

function encodeValue(value: TemplateValue): TemplateValue {
	if (typeof value === 'string') {
		try {
			return encodeURIComponent(value);
		} catch {
			return value;
		}
	}
	if (Array.isArray(value)) return value.map(encodeValue);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, encodeValue(item)]),
		);
	}
	return value;
}

export const encode_uri = (
	value: string,
	_param?: string,
	context?: FilterContext,
): TemplateValue => encodeValue(inputValue(value, context));
