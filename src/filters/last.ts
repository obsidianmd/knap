export const last = (str: string): string => {
	// Return empty string as-is without attempting to parse
	if (str === '') {
		return str;
	}

	try {
		const array = JSON.parse(str);
		if (Array.isArray(array) && array.length > 0) {
			const value = array[array.length - 1];
			return value == null ? '' : value.toString();
		}
	} catch {
		// Plain strings are valid pass-through values.
	}
	return str;
};
