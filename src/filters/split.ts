import type { FilterContext } from '../types';
import { unquoteScalarParam } from '../parser-utils';

export const split = (str: string, param?: string, context?: FilterContext): string => {
	// If no param is provided or param is empty string, split every character
	if (!param || param === '') {
		return JSON.stringify(str.split(''));
	}

	param = unquoteScalarParam(param) ?? '';

	// If param is a single character, use it directly
	const separator = param.length === 1 || context?.allowRegex === false ? param : new RegExp(param);

	// Split operation
	const result = str.split(separator);

	return JSON.stringify(result);
};
