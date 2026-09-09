import type { TemplateValue } from '../types';

export interface PropertyResult {
	exists: boolean;
	value: TemplateValue;
}

/** Read data properties without traversing prototypes or invoking accessors. */
export function ownProperty(value: unknown, key: unknown): PropertyResult {
	if (value === null || value === undefined || typeof value === 'function' ||
		(typeof key !== 'string' && typeof key !== 'number')) {
		return { exists: false, value: undefined };
	}
	const descriptor = Object.getOwnPropertyDescriptor(Object(value), key);
	return descriptor && 'value' in descriptor
		? { exists: true, value: descriptor.value }
		: { exists: false, value: undefined };
}

export function ownPropertyAtPath(value: TemplateValue, path: string): PropertyResult {
	if (!path || path.split('.').some(segment => segment === '')) {
		return { exists: false, value: undefined };
	}

	let current = value;
	for (const segment of path.split('.')) {
		const property = ownProperty(current, segment);
		if (!property.exists) return property;
		current = property.value;
	}

	return { exists: true, value: current };
}
