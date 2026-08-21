/** Escape Markdown characters used by link and image labels. */
export function escapeMarkdown(value: string): string {
	return value.replace(/([[\]])/g, '\\$1');
}
