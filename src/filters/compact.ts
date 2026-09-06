import type { FilterContext, TemplateValue } from '../types';

function inputValue(value: string, context?: FilterContext): TemplateValue {
	if (context && Object.prototype.hasOwnProperty.call(context, 'rawValue')) {
		return context.rawValue;
	}
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}

function isEmpty(value: TemplateValue): boolean {
	return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

export const compact = (
	value: string,
	_param?: string,
	context?: FilterContext,
): TemplateValue => {
	const input = inputValue(value, context);
	if (Array.isArray(input)) return input.filter(item => !isEmpty(item));
	if (input && typeof input === 'object') {
		return Object.fromEntries(Object.entries(input).filter(([, item]) => !isEmpty(item)));
	}
	return input;
};
