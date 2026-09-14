import type { ParamValidationResult } from '../filters';
import type { FilterContext, TemplateValue } from '../types';
import { cleanScalarParam } from '../parser-utils';
import { errorMessage, reportFilterWarning } from './warnings';
import { finiteNumber } from './value_utils';

export const validateCalcParams = (param: string | undefined): ParamValidationResult => {
	if (!param) {
		return { valid: false, error: 'requires an operation (e.g., calc:"+10", calc:"*2")' };
	}

	// Remove outer quotes if present
	const operation = (cleanScalarParam(param) ?? '').trim();

	if (!operation) {
		return { valid: false, error: 'operation cannot be empty' };
	}

	// Check for valid operator
	const validOperators = ['+', '-', '*', '/', '^', '**'];
	const operator = operation.slice(0, 2) === '**' ? '**' : operation.charAt(0);

	if (!validOperators.includes(operator)) {
		return { valid: false, error: `invalid operator "${operator}". Use +, -, *, /, ^ or **` };
	}

	// Check that there's a number after the operator
	const valueStr = operation.slice(operator === '**' ? 2 : 1);
	if (!valueStr || isNaN(Number(valueStr))) {
		return { valid: false, error: 'requires a number after the operator (e.g., "+10")' };
	}

	return { valid: true };
};

export const calc = (str: string, param?: string, context?: FilterContext): TemplateValue => {
	const hasRawValue = Boolean(context && Object.prototype.hasOwnProperty.call(context, 'rawValue'));
	const originalValue = hasRawValue
		? context?.rawValue
		: str;

	if (!param) {
		return originalValue;
	}
	if (hasRawValue && (originalValue === null || originalValue === undefined)) {
		return originalValue;
	}

	try {
		// calc remains a scalar filter, so use the renderer's string input. This
		// preserves the deliberate singleton-primitive array unwrapping behavior.
		const num = finiteNumber(str);
		if (num === undefined) {
			reportFilterWarning(context, `Could not parse "${str}" as a number`, 'INVALID_FILTER_INPUT');
			return originalValue;
		}

		// Remove outer quotes if present
		const operation = (cleanScalarParam(param) ?? '').trim();

		// Parse the operation
		const operator = operation.slice(0, 2) === '**' ? '**' : operation.charAt(0);
		const value = Number(operation.slice(operator === '**' ? 2 : 1));

		if (isNaN(value)) {
			return originalValue;
		}

		let result: number;
		switch (operator) {
			case '+':
				result = num + value;
				break;
			case '-':
				result = num - value;
				break;
			case '*':
				result = num * value;
				break;
			case '/':
				result = num / value;
				break;
			case '**':
			case '^':
				result = Math.pow(num, value);
				break;
			default:
				return originalValue;
		}

		if (!Number.isFinite(result)) {
			reportFilterWarning(context, `Calculation produced a non-finite result for "${str}"`, 'INVALID_FILTER_INPUT');
			return originalValue;
		}

		// Keep the existing floating-point cleanup, but preserve the numeric type.
		return Number(result.toFixed(10));
	} catch (error) {
		reportFilterWarning(context, `Could not calculate value: ${errorMessage(error)}`);
		return originalValue;
	}
};
