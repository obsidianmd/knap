export type TemplateErrorCode =
	| 'PARSE_ERROR'
	| 'UNKNOWN_FILTER'
	| 'INVALID_FILTER_ARGUMENTS'
	| 'RESOLVE_ERROR'
	| 'FILTER_ERROR'
	| 'RENDER_ERROR';

export interface TemplateError {
	message: string;
	line: number;
	column: number;
	code: TemplateErrorCode;
}

export class TemplateRuntimeError extends Error {
	constructor(
		message: string,
		readonly code: TemplateErrorCode = 'RENDER_ERROR',
	) {
		super(message);
		this.name = 'TemplateRuntimeError';
	}
}

export class TemplateRenderError extends Error {
	constructor(readonly errors: TemplateError[]) {
		super(errors.map(error => error.message).join('; ') || 'Template rendering failed');
		this.name = 'TemplateRenderError';
	}
}
