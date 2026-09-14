import type { FilterContext } from '../types';
import { inputValue, isPlainObject } from './value_utils';

export const length = (str: string, _param?: string, context?: FilterContext): number => {
	const value = inputValue(str, context, true);
	if (Array.isArray(value)) return value.length;
	if (isPlainObject(value)) return Object.keys(value).length;
	return str.length;
};
