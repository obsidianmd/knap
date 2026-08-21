import type { TemplateWarningCode } from '../errors';
import type { FilterContext } from '../types';

export function reportFilterWarning(
	context: FilterContext | undefined,
	message: string,
	code: TemplateWarningCode = 'FILTER_WARNING',
): void {
	context?.reportWarning?.({ message, code });
}

export function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
