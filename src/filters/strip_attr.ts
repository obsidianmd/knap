import { normalizeParamList } from '../parser-utils';

export const strip_attr = (html: string, keepAttributes: string = ''): string => {
	const keepAttributesList = normalizeParamList(keepAttributes).filter(Boolean);

	return html.replace(/<(\w+)\s+(?:[^>]*?)>/g, (match, tag) => {
		if (keepAttributesList.length === 0) {
			return `<${tag}>`;
		}

		const keepAttrs = keepAttributesList.map(attr => {
			const escapedAttr = attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const regex = new RegExp(`\\s${escapedAttr}\\s*=\\s*("[^"]*"|'[^']*')`, 'i');
			const attrMatch = match.match(regex);
			return attrMatch ? attrMatch[0].trim() : '';
		}).filter(Boolean).join(' ');

		return keepAttrs ? `<${tag} ${keepAttrs}>` : `<${tag}>`;
	});
};
