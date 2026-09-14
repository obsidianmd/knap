import type { FilterContext, TemplateValue } from '../types';
import { arrayInputValue } from './value_utils';

export const first = (str: string, _param?: string, context?: FilterContext): TemplateValue => {
	const value = arrayInputValue(str, context);
	if (!Array.isArray(value)) return value;
	return value.length > 0 ? value[0] : null;
};
