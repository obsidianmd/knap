import type { TemplateValue } from '../types';

export interface PropertyResult {
	exists: boolean;
	value: TemplateValue;
}

export function ownPropertyAtPath(value: TemplateValue, path: string): PropertyResult {
	if (!path || path.split('.').some(segment => segment === '')) {
		return { exists: false, value: undefined };
	}

	let current = value;
	for (const segment of path.split('.')) {
		if ((typeof current !== 'object' && typeof current !== 'function') || current === null ||
			!Object.prototype.hasOwnProperty.call(current, segment)) {
			return { exists: false, value: undefined };
		}
		current = (current as Record<string, TemplateValue>)[segment];
	}

	return { exists: true, value: current };
}
