import type { FilterContext, TemplateValue } from '../types';
import { mapStringValues, recursiveInput } from './value_utils';

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
): TemplateValue => mapStringValues(recursiveInput(value, context), encodeValue);
