import type { TemplateVariables } from '../types';

export function parseJson(text: string, source: string): unknown {
	try { return JSON.parse(text.replace(/^\uFEFF/, '')); }
	catch { throw new Error(`Invalid JSON in ${source}. Expected a JSON object or array of objects containing template variables.`); }
}

export function requireObject(data: unknown, source: string): TemplateVariables {
	if (data === null || typeof data !== 'object' || Array.isArray(data)) {
		throw new Error(`Data in ${source} must be a JSON object containing template variables.`);
	}
	return data as TemplateVariables;
}

export function parseData(text: string, source: string): TemplateVariables {
	return requireObject(parseJson(text, source), source);
}
