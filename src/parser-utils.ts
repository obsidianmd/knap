interface ParserState {
	current: string;
	inQuote: boolean;
	quoteType: string;
	inRegex: boolean;
	curlyDepth: number;
	parenDepth: number;
	escapeNext: boolean;
}

export function createParserState(initialCurrent: string = ''): ParserState {
	return {
		current: initialCurrent,
		inQuote: false,
		quoteType: '',
		inRegex: false,
		curlyDepth: 0,
		parenDepth: 0,
		escapeNext: false
	};
}

export function processCharacter(char: string, state: ParserState): void {
	if (state.escapeNext) {
		state.current += char;
		state.escapeNext = false;
		return;
	}

	if (char === '\\') {
		state.current += char;
		if (!state.inRegex) {
			state.escapeNext = true;
		}
		return;
	}

	if ((char === '"' || char === "'") && !state.inRegex &&
		(!state.inQuote || state.quoteType === char)) {
		state.inQuote = !state.inQuote;
		state.quoteType = state.inQuote ? char : '';
		state.current += char;
		return;
	}

	if (char === '/' && !state.inQuote && !state.inRegex &&
		(state.current.endsWith(':') || state.current.endsWith(','))) {
		state.inRegex = true;
		state.current += char;
		return;
	}

	if (char === '/' && state.inRegex && !state.escapeNext) {
		state.inRegex = false;
		state.current += char;
		return;
	}

	if (char === '{') {
		state.curlyDepth++;
		state.current += char;
		return;
	}

	if (char === '}') {
		state.curlyDepth--;
		state.current += char;
		return;
	}

	if (char === '(' && !state.inQuote) {
		state.parenDepth++;
		state.current += char;
		return;
	}

	if (char === ')' && !state.inQuote) {
		state.parenDepth--;
		state.current += char;
		return;
	}

	state.current += char;
}

export function isRegexPattern(str: string): boolean {
	return /^\/(.+)\/([gimsuy]*)$/.test(str);
}

export function parseRegexPattern(pattern: string): { pattern: string; flags: string } | null {
	const match = pattern.match(/^\/(.+)\/([gimsuy]*)$/);
	if (!match) return null;
	return {
		pattern: match[1],
		flags: match[2]
	};
}

export function unwrapParamList(value: string): string {
	const trimmed = value.trim();
	if (!trimmed.startsWith('(') || !trimmed.endsWith(')')) return trimmed;

	let quote = '';
	let escaped = false;
	let depth = 0;
	for (let index = 0; index < trimmed.length; index++) {
		const character = trimmed[index];
		if (escaped) {
			escaped = false;
		} else if (character === '\\') {
			escaped = true;
		} else if (quote) {
			if (character === quote) quote = '';
		} else if (character === '"' || character === "'") {
			quote = character;
		} else if (character === '(') {
			depth++;
		} else if (character === ')') {
			depth--;
			if (depth === 0 && index !== trimmed.length - 1) return trimmed;
		}
	}

	return depth === 0 ? trimmed.slice(1, -1).trim() : trimmed;
}

export function cleanParamToken(value: string): string {
	return value.trim()
		.replace(/^(["'])([\s\S]*)\1$/, '$2')
		.replace(/\\([\\,:|"'])/g, '$1');
}

export function cleanScalarParam(value: string | undefined): string | undefined {
	if (value === undefined) return undefined;
	if (value !== '' && value.trim() === '') return value;
	return cleanParamToken(unwrapParamList(value));
}

/** Split comma-separated filter parameters while preserving quoted commas. */
export function splitParams(value: string): string[] {
	const parts: string[] = [];
	let current = '';
	let quote = '';
	let escaped = false;
	let parenDepth = 0;
	let curlyDepth = 0;
	let bracketDepth = 0;

	for (const character of value) {
		if (escaped) {
			current += character;
			escaped = false;
		} else if (character === '\\') {
			current += character;
			escaped = true;
		} else if (quote) {
			current += character;
			if (character === quote) quote = '';
		} else if (character === '"' || character === "'") {
			current += character;
			quote = character;
		} else if (character === '(') {
			current += character;
			parenDepth++;
		} else if (character === ')') {
			current += character;
			parenDepth--;
		} else if (character === '{') {
			current += character;
			curlyDepth++;
		} else if (character === '}') {
			current += character;
			curlyDepth--;
		} else if (character === '[') {
			current += character;
			bracketDepth++;
		} else if (character === ']') {
			current += character;
			bracketDepth--;
		} else if (character === ',' && parenDepth === 0 && curlyDepth === 0 && bracketDepth === 0) {
			parts.push(current.trim());
			current = '';
		} else {
			current += character;
		}
	}

	parts.push(current.trim());
	return parts;
}
