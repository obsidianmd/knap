import type { ParamValidationResult } from '../filters';
import type { FilterContext, TemplateValue } from '../types';
import { cleanScalarParam } from '../parser-utils';
import { errorMessage, reportFilterWarning } from './warnings';
import { collectionInputValue, finiteNumber, isPlainObject } from './value_utils';

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

export const round = (input: string, param?: string, context?: FilterContext): TemplateValue => {
	const roundNumber = (num: number, decimalPlaces?: number): number | undefined => {
		if (decimalPlaces === undefined) {
			const result = Math.round(num);
			return Number.isFinite(result) ? result : undefined;
		}
		const factor = Math.pow(10, decimalPlaces);
		const result = Math.round(num * factor) / factor;
		return Number.isFinite(result) ? result : undefined;
	};

	let encounteredNonFinite = false;
	const processCollectionValue = (value: TemplateValue, decimalPlaces?: number): TemplateValue => {
		if (typeof value === 'number') {
			if (!Number.isFinite(value)) {
				encounteredNonFinite = true;
				return value;
			}
			const result = roundNumber(value, decimalPlaces);
			if (result === undefined) {
				encounteredNonFinite = true;
				return value;
			}
			return result;
		} else if (typeof value === 'string') {
			const num = finiteNumber(value);
			if (num === undefined) return value;
			const result = roundNumber(num, decimalPlaces);
			if (result === undefined) {
				encounteredNonFinite = true;
				return value;
			}
			return result;
		} else if (Array.isArray(value)) {
			return value.map(item => processCollectionValue(item, decimalPlaces));
		} else if (isPlainObject(value)) {
			const result: Record<string, TemplateValue> = {};
			for (const [key, val] of Object.entries(value)) {
				result[key] = processCollectionValue(val, decimalPlaces);
			}
			return result;
		}
		return value;
	};

	try {
		const cleanParam = cleanScalarParam(param);
		const decimalPlaces = cleanParam ? parseInt(cleanParam, 10) : undefined;
		if (cleanParam !== undefined && isNaN(Number(cleanParam))) {
			return collectionInputValue(input, context, true);
		}

		const value = collectionInputValue(input, context, true);
		if (value === null || value === undefined) return value;
		if (!Array.isArray(value) && !isPlainObject(value)) {
			const num = finiteNumber(value);
			if (num === undefined) {
				reportFilterWarning(context, `Could not parse "${input}" as a number`, 'INVALID_FILTER_INPUT');
				return value;
			}
			const result = roundNumber(num, decimalPlaces);
			if (result === undefined) {
				reportFilterWarning(context, `Rounding produced a non-finite result for "${input}"`, 'INVALID_FILTER_INPUT');
				return value;
			}
			return result;
		}

		const result = processCollectionValue(value, decimalPlaces);
		if (encounteredNonFinite) {
			reportFilterWarning(context, 'Could not round one or more non-finite collection values', 'INVALID_FILTER_INPUT');
		}
		return result;
	} catch (error) {
		reportFilterWarning(context, `Could not round value: ${errorMessage(error)}`);
		return collectionInputValue(input, context, true);
	}
};
