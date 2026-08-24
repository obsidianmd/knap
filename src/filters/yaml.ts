/** Serialize template text as a YAML-safe scalar. */
export const yaml = (value: string): string => {
	const trimmed = value.trim();
	if (/^(?:true|false|null)$/iu.test(trimmed)) return trimmed;

	// Preserve only canonical finite numbers. Quote strings YAML could
	// reinterpret, such as 007, 0x1F, or 1e5.
	const number = Number(trimmed);
	if (Number.isFinite(number) && String(number) === trimmed) return trimmed;

	// JSON strings are valid YAML double-quoted scalars.
	return JSON.stringify(value);
};
