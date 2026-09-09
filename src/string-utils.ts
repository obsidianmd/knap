/** Escape literal text inside Markdown link and image labels. */
export function escapeMarkdown(value: string): string {
	return value.replaceAll('&', '&amp;').replace(/[\\`*_[\]<>]/g, '\\$&').replace(/\r\n?|\n/g, ' ');
}

/** Keep destinations within one Markdown link, preserving relative and app URLs. */
export function markdownDestination(value: string): string {
	// Markdown decodes character references in destinations; keep them literal.
	const normalized = value.replace(/[\x00-\x20\x7f]/g, '');
	if (/^(?:javascript|vbscript|data):/i.test(normalized)) return '';
	return value.replace(/&(?=(?:#\d+|#x[\da-f]+|[a-z][a-z\d]+);)/gi, '%26')
		.replace(/[\x00-\x20\x7f()\[\]<>\\"`]/g,
			character => `%${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`);
}
