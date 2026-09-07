import type { FilterContext, TemplateValue } from '../types';
import { inputValue, mapStringValues } from './value_utils';

function decodeValue(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

export const decode_uri = (
	value: string,
	_param?: string,
	context?: FilterContext,
): TemplateValue => mapStringValues(inputValue(value, context), decodeValue);
