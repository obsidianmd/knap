import type { TemplateResult } from '../types';

export function reportDiagnostics(result: TemplateResult, label: string): void {
	for (const warning of result.warnings) {
		process.stderr.write(`${label}:${warning.line}:${warning.column}: warning ${warning.code} (${warning.filter}): ${warning.message}\n`);
	}
	for (const error of result.errors) {
		process.stderr.write(`${label}:${error.line}:${error.column}: error ${error.code}: ${error.message}\n`);
	}
}
