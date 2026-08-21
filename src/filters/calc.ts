import type { ParamValidationResult } from '../filters';
import type { FilterContext } from '../types';
import { errorMessage, reportFilterWarning } from './warnings';

export const validateCalcParams = (param: string | undefined): ParamValidationResult => {
	if (!param) {
		return { valid: false, error: 'requires an operation (e.g., calc:"+10", calc:"*2")' };
	}

	// Remove outer quotes if present
	const operation = param.replace(/^['"](.*)['"]$/, '$1').trim();

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

export const calc = (str: string, param?: string, context?: FilterContext): string => {
	if (!param) {
		return str;
	}

	try {
		// Convert input to number
		const num = Number(str);
		if (isNaN(num)) {
			reportFilterWarning(context, `Could not parse "${str}" as a number`, 'INVALID_FILTER_INPUT');
			return str;
		}

		// Remove outer quotes if present
		const operation = param.replace(/^['"](.*)['"]$/, '$1').trim();

		// Parse the operation
		const operator = operation.slice(0, 2) === '**' ? '**' : operation.charAt(0);
		const value = Number(operation.slice(operator === '**' ? 2 : 1));

		if (isNaN(value)) {
			return str;
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
				return str;
		}

		// Convert to string and remove trailing zeros after decimal
		return Number(result.toFixed(10)).toString();
	} catch (error) {
		reportFilterWarning(context, `Could not calculate value: ${errorMessage(error)}`);
		return str;
	}
};
