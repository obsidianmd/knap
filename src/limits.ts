import { TemplateRuntimeError } from './errors';
import type { RenderLimits } from './types';

export const defaultRenderLimits: Readonly<Required<RenderLimits>> = Object.freeze({
	maxTemplateLength: 1_000_000,
	maxOutputLength: 5_000_000,
	maxValueLength: 5_000_000,
	maxOperations: 100_000,
	maxDepth: 100,
});

export function resolveLimits(limits: RenderLimits = {}): Required<RenderLimits> {
	const result = { ...defaultRenderLimits, ...limits };
	for (const [name, value] of Object.entries(result)) {
		if (!Number.isSafeInteger(value) || value < 1 || (name === 'maxDepth' && value > 256)) {
			throw new TemplateRuntimeError(`Invalid ${name} limit`, 'LIMIT_EXCEEDED');
		}
	}
	return result;
}

export function limitError(name: string): never {
	throw new TemplateRuntimeError(`Template exceeded ${name}`, 'LIMIT_EXCEEDED');
}

/** One budget is shared by every branch, loop, and filter of a render. */
export class RenderBudget {
	readonly limits: Required<RenderLimits>;
	private operations = 0;

	constructor(limits: RenderLimits = {}) {
		this.limits = resolveLimits(limits);
	}

	step() {
		if (++this.operations > this.limits.maxOperations) limitError('maxOperations');
	}

	output(length: number) {
		if (length > this.limits.maxOutputLength) limitError('maxOutputLength');
	}

	length(length: number) {
		if (length > this.limits.maxValueLength) limitError('maxValueLength');
	}

	value(value: unknown) {
		const pending = [{ value, depth: 0 }];
		let size = 0;
		let entries = 0;
		while (pending.length) {
			this.step();
			const { value, depth } = pending.pop()!;
			if (++entries > this.limits.maxOperations) limitError('maxOperations');
			if (depth > this.limits.maxDepth) limitError('maxDepth');
			if (typeof value === 'string') size += value.length;
			else if (value !== null && typeof value === 'object') {
				// Count repeated references too, since serialization duplicates them.
				for (const key of Object.keys(value)) {
					size += key.length + 4;
					if (pending.length + entries >= this.limits.maxOperations) limitError('maxOperations');
					const property = Object.getOwnPropertyDescriptor(value, key)!;
					if ('value' in property) pending.push({ value: property.value, depth: depth + 1 });
				}
			} else size += 8;
			if (size > this.limits.maxValueLength) limitError('maxValueLength');
		}
	}
}
