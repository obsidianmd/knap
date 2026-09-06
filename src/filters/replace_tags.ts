import { splitParamPair, splitParams, unquoteParamToken, unwrapParamList } from '../parser-utils';

const cleanTag = (value: string): string => unquoteParamToken(value).replace(/\\(.)/g, '$1');

export const replace_tags = (html: string, params: string = ''): string => {
	const tokens = splitParams(unwrapParamList(params)).filter(Boolean);
	const transformations: Array<[string, string]> = [];

	for (let index = 0; index < tokens.length; index++) {
		const [rawSource, rawTarget] = splitParamPair(tokens[index]);
		if (rawTarget !== undefined) {
			transformations.push([
				cleanTag(rawSource),
				cleanTag(rawTarget),
			]);
		} else if (index + 1 < tokens.length) {
			transformations.push([cleanTag(rawSource), cleanTag(tokens[++index])]);
		} else {
			transformations.push([cleanTag(rawSource), '']);
		}
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
