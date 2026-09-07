import type { ParamValidationResult } from '../types';
import { cleanScalarParam } from '../parser-utils';

const MAX_INDENT_WIDTH = 1000;

export const validateIndentParams = (param: string | undefined): ParamValidationResult => {
	if (!param) return { valid: true };
	const width = cleanScalarParam(param) ?? '';
	const numericWidth = Number(width);
	return /^\d+$/.test(width) && Number.isSafeInteger(numericWidth) && numericWidth <= MAX_INDENT_WIDTH
		? { valid: true }
		: { valid: false, error: `requires an integer from 0 to ${MAX_INDENT_WIDTH} spaces (e.g., indent:2)` };
};

/** Indent every non-empty line, preserving line endings and empty lines. */
export const indent = (value: string, param?: string): string => {
	if (!validateIndentParams(param).valid) return value;
	const width = param ? Number(cleanScalarParam(param)) : 2;
	const prefix = ' '.repeat(width);
	return value.replace(/[^\r\n]+/g, line => prefix + line);
};
