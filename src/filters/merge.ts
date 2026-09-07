import type { FilterContext } from '../types';
import { splitParams, unquoteParamToken, unwrapParamList } from '../parser-utils';
import { errorMessage, reportFilterWarning } from './warnings';

export const merge = (str: string, param?: string, context?: FilterContext): string => {
	// Return early if input is empty or invalid
	if (!str || str === 'undefined' || str === 'null') {
		return '[]';
	}

	let array;
	try {
		array = JSON.parse(str);
	} catch {
		return str;
	}

	if (!Array.isArray(array)) {
		array = [str];
	}

	if (!param) {
		return JSON.stringify(array);
	}

	try {
		const processedItems = splitParams(unwrapParamList(param)).map(unquoteParamToken);

		return JSON.stringify([...array, ...processedItems]);
	} catch (error) {
		reportFilterWarning(context, `Could not merge values: ${errorMessage(error)}`);
		return JSON.stringify(array);
	}
};
