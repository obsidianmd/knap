import { escapeMarkdown } from '../string-utils';
import { cleanScalarParam } from '../parser-utils';

export const image = (str: string, param?: string): string | string[] => {
	if (!str.trim()) {
		return str;
	}

	let altText = '';
	if (param) {
		altText = cleanScalarParam(param) ?? altText;
	}

	try {
		const data = JSON.parse(str);

		const processObject = (obj: any): string[] => {
			return Object.entries(obj).map(([key, value]) => {
				if (typeof value === 'object' && value !== null) {
					return processObject(value);
				}
				return `![${escapeMarkdown(String(value))}](${escapeMarkdown(key)})`;
			}).flat();
		};

		if (Array.isArray(data)) {
			return data.map(item => {
				if (typeof item === 'object' && item !== null) {
					return processObject(item);
				}
				return item ? `![${altText}](${escapeMarkdown(String(item))})` : '';
			}).flat();
		} else if (typeof data === 'object' && data !== null) {
			return processObject(data);
		}
	} catch (error) {
		// If parsing fails, treat it as a single URL string
		return `![${altText}](${escapeMarkdown(str)})`;
	}

	return str;
};
