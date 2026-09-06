import { normalizeParamList } from '../parser-utils';

export const remove_tags = (html: string, removeTags: string = ''): string => {
	// If no tags specified, return unchanged
	if (!removeTags) {
		return html;
	}

	const removeTagsList = normalizeParamList(removeTags).filter(Boolean);

	if (removeTagsList.length === 0) {
		return html;
	}

	// Create a regex that matches only the specified tags
	const escapedTags = removeTagsList.map(tag => tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
	const regex = new RegExp(`<\\/?(?:${escapedTags})\\b[^>]*>`, 'gi');

	// Remove only the specified tags while keeping their content
	return html.replace(regex, '');
};
