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

export function unquoteParamToken(value: string): string {
	return value.trim().replace(/^(["'])([\s\S]*)\1$/, '$2');
}

/** Decode the character following a backslash in a string literal. */
export function decodeStringEscape(character: string): string {
	switch (character) {
		case 'n': return '\n';
		case 't': return '\t';
		case 'r': return '\r';
		default: return character;
	}
}

export function decodeParamEscapes(value: string): string {
	return value.replace(/\\([\\,:|"'])/g, '$1');
}

export function cleanParamToken(value: string): string {
	return decodeParamEscapes(unquoteParamToken(value));
}

export function unquoteScalarParam(value: string | undefined): string | undefined {
	if (value === undefined) return undefined;
	if (value !== '' && value.trim() === '') return value;
	return unquoteParamToken(unwrapParamList(value));
}

export function cleanScalarParam(value: string | undefined): string | undefined {
	const unquoted = unquoteScalarParam(value);
	return unquoted === undefined ? undefined : decodeParamEscapes(unquoted);
}

/** Split a comma-separated argument list, including legacy whole-list quoting. */
export function splitParamList(value: string): string[] {
	const unwrapped = unwrapParamList(value);
	const tokens = splitParams(unwrapped);
	const unquoted = tokens.length === 1 ? unquoteParamToken(tokens[0]) : '';
	const quotedList = unquoted !== tokens[0]?.trim() && unquoted.includes(',');
	return quotedList ? splitParams(unquoted) : tokens;
}

/** Normalize a comma-separated argument list without decoding meaningful backslashes. */
export function normalizeParamList(value: string): string[] {
	return splitParamList(value)
		.map(token => unquoteParamToken(token).replace(/\\(["'])/g, '$1'));
}

function parseTypedParamToken(value: string): unknown {
	const token = value.trim();
	if (splitParamPair(token)[1] !== undefined) return token;
	if (token.length >= 2 && (token[0] === '"' || token[0] === "'") && token.at(-1) === token[0]) {
		return token.slice(1, -1).replace(/\\([\s\S])/g, (_, character: string) => decodeStringEscape(character));
	}
	if (token === 'true') return true;
	if (token === 'false') return false;
	if (token === 'null') return null;
	if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(token)) {
		const number = Number(token);
		if (Number.isFinite(number)) return number;
	}
	return token;
}

/** Parse direct filter-chain arguments without changing the legacy parameter string. */
export function parseTypedParams(value: string | undefined): unknown[] | undefined {
	if (value === undefined || value === '') return undefined;
	return splitParams(unwrapParamList(value)).map(parseTypedParamToken);
}

/** Split once on a colon outside quotes or nested expressions. */
export function splitParamPair(value: string): [string, string?] {
	let quote = '';
	let escaped = false;
	let parenDepth = 0;
	let curlyDepth = 0;
	let bracketDepth = 0;

	for (let index = 0; index < value.length; index++) {
		const character = value[index];
		if (escaped) {
			escaped = false;
		} else if (character === '\\') {
			escaped = true;
		} else if (quote) {
			if (character === quote) quote = '';
		} else if (character === '"' || character === "'") {
			quote = character;
		} else if (character === '(') {
			parenDepth++;
		} else if (character === ')') {
			parenDepth--;
		} else if (character === '{') {
			curlyDepth++;
		} else if (character === '}') {
			curlyDepth--;
		} else if (character === '[') {
			bracketDepth++;
		} else if (character === ']') {
			bracketDepth--;
		} else if (character === ':' && parenDepth === 0 && curlyDepth === 0 && bracketDepth === 0) {
			return [value.slice(0, index).trim(), value.slice(index + 1).trim()];
		}
	}

	return [value.trim()];
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
