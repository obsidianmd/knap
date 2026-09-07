import type { FilterContext } from '../types';
import { splitParamList, unquoteParamToken } from '../parser-utils';
import { errorMessage, reportFilterWarning } from './warnings';

export const merge = (str: string, param?: string, context?: FilterContext): string => {
	// Return early if input is empty or invalid
	if (!str || str === 'undefined' || str === 'null') {
		return '[]';
	}

	let array = context?.rawValue;
	if (!Array.isArray(array)) {
		try {
			array = JSON.parse(str);
		} catch {
			array = [str];
		}
	}

	const values = Array.isArray(array) ? array : [str];

	if (!param) {
		return JSON.stringify(values);
	}

	try {
		const singleArgument = context?.rawArguments?.length === 1 ? context.rawArguments[0] : undefined;
		const list = typeof singleArgument === 'string' && singleArgument.includes(',') ? singleArgument : param;
		const processedItems = splitParamList(list).map(unquoteParamToken);

		return JSON.stringify([...values, ...processedItems]);
	} catch (error) {
		reportFilterWarning(context, `Could not merge values: ${errorMessage(error)}`);
		return JSON.stringify(values);
	}
};
