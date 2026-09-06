import type { FilterContext, TemplateValue } from '../types';
import { inputValue, isPlainObject } from './value_utils';

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
	if (isPlainObject(input)) {
		return Object.fromEntries(Object.entries(input).filter(([, item]) => !isEmpty(item)));
	}
	return input;
};
