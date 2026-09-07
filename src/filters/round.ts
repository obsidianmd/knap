import type { ParamValidationResult } from '../filters';
import type { FilterContext } from '../types';
import { cleanScalarParam } from '../parser-utils';
import { errorMessage, reportFilterWarning } from './warnings';

export const validateRoundParams = (param: string | undefined): ParamValidationResult => {
	// Param is optional - no param means round to integer
	if (!param) {
		return { valid: true };
	}

	const num = parseInt(cleanScalarParam(param) ?? '', 10);
	if (isNaN(num)) {
		return { valid: false, error: 'decimal places must be a number (e.g., round:2)' };
	}

	if (num < 0) {
		return { valid: false, error: 'decimal places must be non-negative (e.g., round:2)' };
	}

	return { valid: true };
};

export const round = (input: string, param?: string, context?: FilterContext): string => {
	const roundNumber = (num: number, decimalPlaces?: number): number => {
		if (decimalPlaces === undefined) {
			return Math.round(num);
		}
		const factor = Math.pow(10, decimalPlaces);
		return Math.round(num * factor) / factor;
	};

	const processValue = (value: any, decimalPlaces?: number): any => {
		if (typeof value === 'number') {
			return roundNumber(value, decimalPlaces);
		} else if (typeof value === 'string') {
			const num = parseFloat(value);
			return isNaN(num) ? value : roundNumber(num, decimalPlaces).toString();
		} else if (Array.isArray(value)) {
			return value.map(item => processValue(item, decimalPlaces));
		} else if (typeof value === 'object' && value !== null) {
			const result: {[key: string]: any} = {};
			for (const [key, val] of Object.entries(value)) {
				result[key] = processValue(val, decimalPlaces);
			}
			return result;
		}
		return value;
	};

	try {
		const cleanParam = cleanScalarParam(param);
		const decimalPlaces = cleanParam ? parseInt(cleanParam, 10) : undefined;
		if (cleanParam !== undefined && isNaN(Number(cleanParam))) {
			return input; // Return the original input if the parameter is not a valid number
		}

		let parsedInput: any;
		try {
			parsedInput = JSON.parse(input);
		} catch {
			// If JSON parsing fails, treat input as a single value
			parsedInput = input;
		}

		const result = processValue(parsedInput, decimalPlaces);
		return typeof result === 'string' ? result : JSON.stringify(result);
	} catch (error) {
		reportFilterWarning(context, `Could not round value: ${errorMessage(error)}`);
		return input; // Return original input if any unexpected error occurs
	}
};
