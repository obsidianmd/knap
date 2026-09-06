import { cleanScalarParam } from '../parser-utils';

export const join = (str: string, param?: string): string => {
	// Return early if input is empty or invalid
	if (!str || str === 'undefined' || str === 'null') {
		return '';
	}

	let array;
	try {
		array = JSON.parse(str);
	} catch {
		return str;
	}

	if (!Array.isArray(array)) {
		return str;
	}

	let separator = ',';
	if (param) {
		separator = cleanScalarParam(param) ?? separator;
		// Replace \n with actual newline character
		separator = separator.replace(/\\n/g, '\n');
	}

	return array.join(separator);
};
