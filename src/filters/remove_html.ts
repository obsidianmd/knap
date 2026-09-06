import { normalizeParamList } from '../parser-utils';

export const remove_html = (html: string, params: string = ''): string => {
	const elementsToRemove = normalizeParamList(params).filter(Boolean);

	// If no elements specified, return the original HTML
	if (elementsToRemove.length === 0) {
		return html;
	}

	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');

	elementsToRemove.forEach(elem => {
		let elements: NodeListOf<Element> | HTMLCollectionOf<Element> = doc.querySelectorAll(elem);

		// Convert HTMLCollection to Array if necessary
		Array.from(elements).forEach(el => el.parentNode?.removeChild(el));
	});

	// Serialize back to HTML
	const serializer = new XMLSerializer();
	let result = '';
	Array.from(doc.body.childNodes).forEach(node => {
		if (node.nodeType === Node.ELEMENT_NODE) {
			result += serializer.serializeToString(node);
		} else if (node.nodeType === Node.TEXT_NODE) {
			result += node.textContent;
		}
	});
	return result;
};
