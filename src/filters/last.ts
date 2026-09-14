import type { FilterContext, TemplateValue } from '../types';
import { arrayInputValue } from './value_utils';

export const last = (str: string, _param?: string, context?: FilterContext): TemplateValue => {
	const value = arrayInputValue(str, context);
	if (!Array.isArray(value)) return value;
	return value.length > 0 ? value[value.length - 1] : null;
};
