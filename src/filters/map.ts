import type { FilterContext, ParamValidationResult, TemplateValue } from '../types';
import { splitParamPair, splitParams, unquoteParamToken, unwrapParamList } from '../parser-utils';
import { ownPropertyAtPath } from './property_utils';
import { collectionInputValue } from './value_utils';

export const validateMapParams = (param: string | undefined): ParamValidationResult => {
	if (!param) {
		return { valid: false, error: 'requires a property path or arrow function (e.g., map:"name")' };
	}

	const match = param.match(/^\s*(\w+)\s*=>\s*(.+)$/);
	if (match) return { valid: true };

	const parts = splitParams(unwrapParamList(param));
	if (parts.length !== 1 || unquoteParamToken(parts[0]) === '') {
		return { valid: false, error: 'requires a property path or arrow function (e.g., map:"name")' };
	}
	if (unquoteParamToken(parts[0]).split('.').some(segment => segment === '')) {
		return { valid: false, error: 'property path cannot contain empty segments' };
	}
	return { valid: true };
};

function mapWithArrow(str: string, param: string): string {
	let array;
	try {
		array = JSON.parse(str);
	} catch {
		array = [str];
	}

	if (Array.isArray(array) && param) {
		const match = param.match(/^\s*(\w+)\s*=>\s*(.+)$/);
		if (!match) {
			return str;
		}
		const [, argName, expression] = match;

		const mappedArray = array.map((item) => {
			// Strip outer parentheses for object literal syntax: ({key: value})
			let expr = expression.trim();
			if (expr.startsWith('(') && expr.endsWith(')')) {
				expr = expr.slice(1, -1).trim();
			}

			// Check if the expression is an object literal or a string literal
			if ((expr.startsWith('{') && expr.endsWith('}')) ||
				(expr.startsWith('"') && expr.endsWith('"')) ||
				(expr.startsWith("'") && expr.endsWith("'"))) {
				// Use a simple object to store the mapped properties
				const mappedItem: { [key: string]: any } = {};

				// Parse the expression to extract property assignments or string literal
				if (expr.startsWith('{')) {
					const assignments = splitParams(expr.slice(1, -1));

					assignments.forEach((assignment) => {
						const [key, value] = splitParamPair(assignment);
						if (value === undefined) return;
						// Remove any surrounding quotes from the key
						const cleanKey = key.replace(/^['"](.+)['"]$/, '$1');
						// Evaluate the value expression
						const cleanValue = evaluateExpression(value, item, argName);
						mappedItem[cleanKey] = cleanValue;
					});
				} else {
					// Handle string literal — return plain string
					const stringLiteral = expr.slice(1, -1);
					return stringLiteral.replace(new RegExp(`\\$\\{${argName}\\}`, 'g'), item);
				}

				return mappedItem;
			} else {
				// If it's not an object literal or string literal, treat it as a simple expression
				return evaluateExpression(expression, item, argName);
				}
			});

		return JSON.stringify(mappedArray);
	}
	return str;
}

function propertyPath(param: string, context?: FilterContext): string | undefined {
	const argument = context?.rawArguments?.[0];
	if (argument !== undefined) return typeof argument === 'string' ? argument : undefined;
	return unquoteParamToken(unwrapParamList(param));
}

export const map = (str: string, param?: string, context?: FilterContext): TemplateValue => {
	if (!param) return str;
	if (/^\s*\w+\s*=>\s*(.+)$/.test(param)) return mapWithArrow(str, param);

	const path = propertyPath(param, context);
	if (!path) return collectionInputValue(str, context);
	const input = collectionInputValue(str, context);
	if (!Array.isArray(input)) return input;
	return input.map(item => {
		const property = ownPropertyAtPath(item, path);
		return property.exists ? property.value : null;
	});
};

function evaluateExpression(expression: string, item: any, argName: string): any {
	if (typeof item === 'string') {
		// For simple string arrays, return the item directly
		return item;
	}
	const result = expression.replace(new RegExp(`${argName}\\.([\\w.\\[\\]]+)`, 'g'), (_, prop) => {
		const value = getNestedProperty(item, prop);
		return JSON.stringify(value);
	});
	try {
		return JSON.parse(result);
	} catch {
		return result.replace(/^["'](.+)["']$/, '$1');
	}
}

function getNestedProperty(obj: any, path: string): any {
	return path.split(/[\.\[\]]/).filter(Boolean).reduce((current, key) => {
		if (current && Array.isArray(current) && /^\d+$/.test(key)) {
			return current[parseInt(key, 10)];
		}
		return current && current[key] !== undefined ? current[key] : undefined;
	}, obj);
}
