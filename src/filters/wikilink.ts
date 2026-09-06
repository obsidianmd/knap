import { unquoteScalarParam } from '../parser-utils';

const wikiReference = (str: string, param: string | undefined, prefix: string): string => {
	if (!str.trim()) {
		return str;
	}

	let alias = '';
	if (param) {
		alias = unquoteScalarParam(param) ?? alias;
	}

	try {
		const data = JSON.parse(str);

		const processObject = (obj: any): string[] => {
			return Object.entries(obj).map(([key, value]) => {
				if (typeof value === 'object' && value !== null) {
					return processObject(value);
				}
				return `${prefix}[[${key}|${value}]]`;
			}).flat();
		};

		if (Array.isArray(data)) {
			const result = data.flatMap(item => {
				if (typeof item === 'object' && item !== null) {
					return processObject(item);
				}
				return item ? (alias ? `${prefix}[[${item}|${alias}]]` : `${prefix}[[${item}]]`) : '';
			});
			return JSON.stringify(result);
		} else if (typeof data === 'object' && data !== null) {
			return JSON.stringify(processObject(data));
		}
	} catch (error) {
		// If parsing fails, treat it as a single string
		return alias ? `${prefix}[[${str}|${alias}]]` : `${prefix}[[${str}]]`;
	}
	return str;
};

export const wikilink = (str: string, param?: string): string => wikiReference(str, param, '');

export const embed = (str: string, param?: string): string => wikiReference(str, param, '!');
