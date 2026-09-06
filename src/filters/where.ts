import { parseTypedParams, splitParams, unquoteParamToken, unwrapParamList } from '../parser-utils';
import type { FilterContext, ParamValidationResult, TemplateValue } from '../types';
import { ownPropertyAtPath } from './property_utils';
import { collectionInputValue } from './value_utils';

export const validateWhereParams = (param: string | undefined): ParamValidationResult => {
	if (!param) return { valid: false, error: 'requires a property path and value' };
	const parts = splitParams(unwrapParamList(param));
	if (parts.length !== 2) return { valid: false, error: 'requires exactly a property path and value' };
	const path = unquoteParamToken(parts[0]);
	if (!path) return { valid: false, error: 'property path cannot be empty' };
	if (path.split('.').some(segment => segment === '')) {
		return { valid: false, error: 'property path cannot contain empty segments' };
	}
	return { valid: true };
};

function isScalar(value: TemplateValue): value is string | number | boolean | null {
	return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

export const where = (
	value: string,
	param?: string,
	context?: FilterContext,
): TemplateValue => {
	const input = collectionInputValue(value, context);
	if (!Array.isArray(input)) return input;

	const args = context?.rawArguments ?? parseTypedParams(param) ?? [];
	const [path, expected] = args;
	if (typeof path !== 'string' || !path || !isScalar(expected)) return input;

	return input.filter(item => {
		const property = ownPropertyAtPath(item, path);
		return property.exists && property.value === expected;
	});
};
