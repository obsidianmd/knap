import type { TemplateResult } from '../types';
import { standardFilterMetadata } from '../filters';

export function reportDiagnostics(result: Pick<TemplateResult, 'errors' | 'warnings'>, label: string): void {
	for (const warning of result.warnings) {
		process.stderr.write(`${label}:${warning.line}:${warning.column}: warning ${warning.code} (${warning.filter}): ${warning.message}\n`);
	}
	for (const error of result.errors) {
		process.stderr.write(`${label}:${error.line}:${error.column}: error ${error.code}: ${error.message}\n`);
		if (error.code === 'UNKNOWN_FILTER' || error.code === 'INVALID_FILTER_ARGUMENTS') {
			const name = error.code === 'UNKNOWN_FILTER'
				? error.message.match(/Did you mean "([^"]+)"/)?.[1]
				: error.message.match(/^Filter "([^"]+)"/)?.[1];
			const command = name && Object.hasOwn(standardFilterMetadata, name) ? `filter ${name}` : 'filters';
			process.stderr.write(`  Help: knap help ${command}\n`);
		}
		else if (error.code === 'PARSE_ERROR') {
			process.stderr.write(`  Help: knap help ${error.message.includes('tag') || error.message.includes('{%') ? 'tags' : 'syntax'}\n`);
		}
	}
}
