import type { FilterContext, ParamValidationResult, TemplateValue } from '../types';
import { cleanParamToken, splitParams, unwrapParamList } from '../parser-utils';
import { inputValue } from './value_utils';

type SortDirection = 'asc' | 'desc';

function parseParams(param: string | undefined): { property?: string; direction: SortDirection } {
	if (!param) return { direction: 'asc' };
	const parts = splitParams(unwrapParamList(param)).map(cleanParamToken);
	if (parts.length === 1 && (parts[0] === 'asc' || parts[0] === 'desc')) {
		return { direction: parts[0] };
	}
	return {
		property: parts[0] || undefined,
		direction: (parts[1] || 'asc') as SortDirection,
	};
}

export const validateSortParams = (param: string | undefined): ParamValidationResult => {
	if (!param) return { valid: true };
	const parts = splitParams(unwrapParamList(param)).map(cleanParamToken);
	if (parts.length > 2) return { valid: false, error: 'accepts at most a property and direction' };
	if (parts.length === 2 && !parts[0]) return { valid: false, error: 'property cannot be empty' };
	const direction = parts.length === 1 && (parts[0] === 'asc' || parts[0] === 'desc')
		? parts[0]
		: parts[1] || 'asc';
	if (direction !== 'asc' && direction !== 'desc') {
		return { valid: false, error: `invalid direction "${direction}". Use "asc" or "desc"` };
	}
	return { valid: true };
};

function propertyValue(value: TemplateValue, property: string | undefined): TemplateValue {
	if (!property) return value;
	return property.split('.').reduce<TemplateValue>((current, key) =>
		current && typeof current === 'object'
			? (current as Record<string, TemplateValue>)[key]
			: undefined,
	value);
}

function compareValues(left: TemplateValue, right: TemplateValue): number {
	if (left === right) return 0;
	if (left === null || left === undefined) return 1;
	if (right === null || right === undefined) return -1;
	if (typeof left === 'number' && typeof right === 'number') return left - right;
	const leftText = typeof left === 'string' ? left : JSON.stringify(left);
	const rightText = typeof right === 'string' ? right : JSON.stringify(right);
	return leftText < rightText ? -1 : leftText > rightText ? 1 : 0;
}

export const sort = (
	value: string,
	param?: string,
	context?: FilterContext,
): TemplateValue => {
	const input = inputValue(value, context);
	if (!Array.isArray(input)) return input;
	const { property, direction } = parseParams(param);
	return [...input].sort((left, right) => {
		const leftValue = propertyValue(left, property);
		const rightValue = propertyValue(right, property);
		const comparison = compareValues(leftValue, rightValue);
		if (leftValue === null || leftValue === undefined || rightValue === null || rightValue === undefined) {
			return comparison;
		}
		return direction === 'desc' ? -comparison : comparison;
	});
};
