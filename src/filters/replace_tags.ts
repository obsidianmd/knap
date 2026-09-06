import { splitParamList, splitParamPair, unquoteParamToken } from '../parser-utils';

const cleanTag = (value: string): string => unquoteParamToken(value).replace(/\\(.)/g, '$1');

export const replace_tags = (html: string, params: string = ''): string => {
	const tokens = splitParamList(params).filter(Boolean);
	const transformations: Array<[string, string]> = [];

	for (const token of tokens) {
		const [rawSource, rawTarget] = splitParamPair(token);
		transformations.push([
			cleanTag(rawSource),
			rawTarget === undefined ? '' : cleanTag(rawTarget),
		]);
	}

	// If no transformations specified, return the original HTML
	if (transformations.length === 0) {
		return html;
	}

	let result = html;

	transformations.forEach(([source, target]) => {
		if (!source) {
			return;
		}

		// Create regex patterns for opening and closing tags
		const openingPattern = new RegExp(`<${source}(\\s+[^>]*?)?>`, 'g');
		const closingPattern = new RegExp(`</${source}>`, 'g');

		// Replace opening and closing tags
		result = result
			.replace(openingPattern, (match, attributes) => {
				return target ? `<${target}${attributes || ''}>` : '';
			})
			.replace(closingPattern, target ? `</${target}>` : '');
	});

	return result;
};
