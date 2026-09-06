import { parseTypedParams, splitParams, unquoteParamToken, unwrapParamList } from '../parser-utils';
import type { FilterContext, ParamValidationResult, TemplateValue } from '../types';
import { ownPropertyAtPath } from './property_utils';
import { collectionInputValue } from './value_utils';

export const validateSumParams = (param: string | undefined): ParamValidationResult => {
	if (!param) return { valid: true };
	const parts = splitParams(unwrapParamList(param));
	if (parts.length !== 1) return { valid: false, error: 'accepts at most one property path' };
	const path = unquoteParamToken(parts[0]);
	if (!path) return { valid: false, error: 'property path cannot be empty' };
	if (path.split('.').some(segment => segment === '')) {
		return { valid: false, error: 'property path cannot contain empty segments' };
	}
	return { valid: true };
};

function finiteNumber(value: TemplateValue): number | undefined {
	if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
	if (typeof value !== 'string' || value.trim() === '') return undefined;
	const number = Number(value.trim());
	return Number.isFinite(number) ? number : undefined;
}

export const sum = (
	value: string,
	param?: string,
	context?: FilterContext,
): TemplateValue => {
	const input = collectionInputValue(value, context);
	if (!Array.isArray(input)) return input;

	const args = context?.rawArguments ?? parseTypedParams(param) ?? [];
	const path = args[0];
	if (path !== undefined && (typeof path !== 'string' || !path)) return input;

	let total = 0;
	for (const item of input) {
		let candidate = item;
		if (typeof path === 'string') {
			const property = ownPropertyAtPath(item, path);
			if (!property.exists) continue;
			candidate = property.value;
		}
		const number = finiteNumber(candidate);
		if (number !== undefined) total += number;
	}
	return total;
};
