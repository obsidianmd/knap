import type { FilterContext, TemplateValue } from '../types';
import { inputValue, mapStringValues } from './value_utils';

function encodeValue(value: string): string {
	try {
		return encodeURIComponent(value);
	} catch {
		return value;
	}
}

export const encode_uri = (
	value: string,
	_param?: string,
	context?: FilterContext,
): TemplateValue => mapStringValues(inputValue(value, context), encodeValue);
