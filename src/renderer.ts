// Template renderer for Knap
// Evaluates an AST and produces string output
//
// The renderer handles:
// - Variable interpolation with filters
// - Conditional logic (if/elseif/else)
// - Loops (for)
// - Variable assignment (set)
// - Whitespace control

import {
	ASTNode,
	TextNode,
	VariableNode,
	IfNode,
	ForNode,
	SetNode,
	Expression,
	LiteralExpression,
	IdentifierExpression,
	BinaryExpression,
	UnaryExpression,
	FilterExpression,
	MemberExpression,
	parse,
} from './parser';
import { TemplateRuntimeError, type TemplateError } from './errors';

type ApplyFilterFn = (
	value: string,
	filterName: string,
	paramString: string | undefined,
	line: number,
	column: number,
) => any | Promise<any>;

// ============================================================================
// Render Context
// ============================================================================

/** Function type for resolving values supplied by a host application. */
export type AsyncResolver = (name: string, context: RenderContext) => Promise<any>;

/**
 * Context for rendering templates
 */
export interface RenderContext {
	/** Variables available in the template */
	variables: Record<string, any>;

	/** Resolver for values not present in `variables` (optional). */
	asyncResolver?: AsyncResolver;

	/** Registry-backed filter invocation supplied by the owning engine. */
	applyFilter: ApplyFilterFn;
}

/**
 * Options for the render function
 */
export interface RenderOptions {
	/** Whether to trim whitespace from output */
	trimOutput?: boolean;
}

/**
 * Result of rendering
 */
export interface RenderResult {
	output: string;
	errors: RenderError[];
}

export type RenderError = TemplateError;

// ============================================================================
// Main Render Function
// ============================================================================

/**
 * Render a template string with the given context.
 *
 * @param template The template string to render
 * @param context The render context with variables
 * @param options Optional render options
 * @returns RenderResult with output and any errors
 */
export async function render(
	template: string,
	context: RenderContext,
	options: RenderOptions = {}
): Promise<RenderResult> {
	const parseResult = parse(template);

	if (parseResult.errors.length > 0) {
		return {
			output: '',
			errors: parseResult.errors.map(e => ({
				message: e.message,
				line: e.line,
				column: e.column,
				code: e.code ?? 'PARSE_ERROR',
			})),
		};
	}

	return renderAST(parseResult.ast, context, options);
}

/**
 * Render an AST directly (for when you already have parsed AST).
 */
export async function renderAST(
	ast: ASTNode[],
	context: RenderContext,
	options: RenderOptions = {}
): Promise<RenderResult> {
	const errors: RenderError[] = [];
	const state: RenderState = {
		context,
		errors,
		pendingTrimRight: false,
	};

	let output = '';

	for (let i = 0; i < ast.length; i++) {
		const node = ast[i];
		const nodeOutput = await renderNode(node, state);
		output = appendNodeOutput(output, nodeOutput, node, state);
	}

	if (options.trimOutput) {
		output = output.trim();
	}

	return { output, errors };
}

// ============================================================================
// Render State
// ============================================================================

interface RenderState {
	context: RenderContext;
	errors: RenderError[];
	pendingTrimRight: boolean;
}

// ============================================================================
// Node Rendering
// ============================================================================

async function renderNode(node: ASTNode, state: RenderState): Promise<string> {
	switch (node.type) {
		case 'text':
			return renderText(node, state);
		case 'variable':
			return renderVariable(node, state);
		case 'if':
			return renderIf(node, state);
		case 'for':
			return renderFor(node, state);
		case 'set':
			return renderSet(node, state);
		default:
			state.errors.push({
				message: `Unknown node type: ${(node as any).type}`,
				line: (node as any).line ?? 0,
				column: (node as any).column ?? 0,
				code: 'RENDER_ERROR',
			});
			return '';
	}
}

function renderText(node: TextNode, state: RenderState): string {
	let text = node.value;

	// If previous node had trimRight, trim leading whitespace and newlines
	if (state.pendingTrimRight) {
		text = trimLeadingWhitespace(text);
		state.pendingTrimRight = false;
	}

	return text;
}

async function renderVariable(node: VariableNode, state: RenderState): Promise<string> {
	// Handle trimLeft - this affects previous output (handled by caller via pendingTrimRight)
	// For now, we handle trimRight by setting a flag for the next node

	try {
		const value = await evaluateExpression(node.expression, state);
		const result = valueToString(value);

		if (node.trimRight) {
			state.pendingTrimRight = true;
		}

		return result;
	} catch (error) {
		state.errors.push(toRenderError(error, 'Error evaluating variable', node.line, node.column));
		return '';
	}
}

async function renderIf(node: IfNode, state: RenderState): Promise<string> {
	try {
		// Evaluate main condition
		const conditionValue = await evaluateExpression(node.condition, state);

		if (isTruthy(conditionValue)) {
			const result = await renderNodes(node.consequent, state);
			if (node.trimRight) {
				state.pendingTrimRight = true;
			}
			return result;
		}

		// Check elseif conditions
		for (const elseif of node.elseifs) {
			const elseifValue = await evaluateExpression(elseif.condition, state);
			if (isTruthy(elseifValue)) {
				return renderNodes(elseif.body, state);
			}
		}

		// Fall back to else
		if (node.alternate) {
			return renderNodes(node.alternate, state);
		}

		if (node.trimRight) {
			state.pendingTrimRight = true;
		}

		return '';
	} catch (error) {
		state.errors.push(toRenderError(error, 'Error evaluating if condition', node.line, node.column));
		return '';
	}
}

async function renderFor(node: ForNode, state: RenderState): Promise<string> {
	try {
		const iterableValue = await evaluateExpression(node.iterable, state);

		// Silently handle undefined/null - this is expected when optional data doesn't exist
		if (iterableValue === undefined || iterableValue === null) {
			if (node.trimRight) {
				state.pendingTrimRight = true;
			}
			return '';
		}

		// If the iterable is a JSON string (e.g. from split filter), parse it into an array
		let iterableArray = iterableValue;
		if (!Array.isArray(iterableArray) && typeof iterableArray === 'string') {
			try {
				const parsed = JSON.parse(iterableArray);
				if (Array.isArray(parsed)) {
					iterableArray = parsed;
				}
			} catch {
				// Not valid JSON, fall through to error below
			}
		}

		if (!Array.isArray(iterableArray)) {
			state.errors.push({
				message: `For loop iterable is not an array: ${typeof iterableArray}`,
				line: node.line,
				column: node.column,
				code: 'RENDER_ERROR',
			});
			if (node.trimRight) {
				state.pendingTrimRight = true;
			}
			return '';
		}

		const results: string[] = [];
		const length = iterableArray.length;

		for (let i = 0; i < length; i++) {
			const item = iterableArray[i];

			// Create loop object with Twig-compatible properties
			const loop = {
				index: i + 1,       // 1-indexed
				index0: i,          // 0-indexed
				first: i === 0,
				last: i === length - 1,
				length: length,
			};

			// Create new context with loop variables
			const loopContext: RenderContext = {
				...state.context,
				variables: {
					...state.context.variables,
					[node.iterator]: item,
					[`${node.iterator}_index`]: i,  // Keep for backwards compatibility
					loop,
				},
			};

			const loopState: RenderState = {
				...state,
				context: loopContext,
			};

			const itemResult = await renderNodes(node.body, loopState);
			results.push(itemResult.trim());
		}

		if (node.trimRight) {
			state.pendingTrimRight = true;
		}

		return results.join('\n');
	} catch (error) {
		state.errors.push(toRenderError(error, 'Error in for loop', node.line, node.column));
		return '';
	}
}

async function renderSet(node: SetNode, state: RenderState): Promise<string> {
	try {
		const value = await evaluateExpression(node.value, state);

		// Set the variable in the context (mutates the context)
		state.context.variables[node.variable] = value;

		if (node.trimRight) {
			state.pendingTrimRight = true;
		}

		// Set produces no output
		return '';
	} catch (error) {
		state.errors.push(toRenderError(error, 'Error in set', node.line, node.column));
		return '';
	}
}

async function renderNodes(nodes: ASTNode[], state: RenderState): Promise<string> {
	let output = '';
	for (const node of nodes) {
		const nodeOutput = await renderNode(node, state);
		output = appendNodeOutput(output, nodeOutput, node, state);
	}
	return output;
}

/**
 * Append node output to accumulated output, handling whitespace trimming.
 * Handles both trimLeft (trim trailing from previous) and trimRight (trim leading from current).
 */
function appendNodeOutput(output: string, nodeOutput: string, node: ASTNode, state: RenderState): string {
	// Handle trimLeft - trim trailing whitespace from previous output
	if ('trimLeft' in node && (node as any).trimLeft && output.length > 0) {
		output = trimTrailingWhitespace(output);
	}

	// Handle trimRight from previous node - trim leading whitespace from this output
	if (state.pendingTrimRight && nodeOutput.length > 0) {
		output += trimLeadingWhitespace(nodeOutput);
		state.pendingTrimRight = false;
	} else {
		output += nodeOutput;
	}

	return output;
}

// ============================================================================
// Expression Evaluation
// ============================================================================

async function evaluateExpression(expr: Expression, state: RenderState): Promise<any> {
	switch (expr.type) {
		case 'literal':
			return evaluateLiteral(expr);

		case 'identifier':
			return evaluateIdentifier(expr, state);

		case 'binary':
			return evaluateBinary(expr, state);

		case 'unary':
			return evaluateUnary(expr, state);

		case 'filter':
			return evaluateFilter(expr, state);

		case 'group':
			return evaluateExpression(expr.expression, state);

		case 'member':
			return evaluateMember(expr, state);

		default:
			throw new Error(`Unknown expression type: ${(expr as any).type}`);
	}
}

function evaluateLiteral(expr: LiteralExpression): any {
	return expr.value;
}

async function evaluateIdentifier(expr: IdentifierExpression, state: RenderState): Promise<any> {
	const name = expr.name;

	// Resolve local values first, then delegate unknown names to the host.
	const value = resolveVariable(name, state.context.variables, expr.path);
	if (value !== undefined) {
		return value;
	}

	// Give host applications a chance to resolve any otherwise unknown value.
	// This keeps the engine independent of browser, filesystem, and network APIs.
	if (state.context.asyncResolver) {
		return state.context.asyncResolver(name, state.context);
	}

	return undefined;
}

async function evaluateMember(expr: MemberExpression, state: RenderState): Promise<any> {
	const object = await evaluateExpression(expr.object, state);
	const property = await evaluateExpression(expr.property, state);

	if (object === undefined || object === null) {
		return undefined;
	}

	// Array access with numeric index
	if (Array.isArray(object) && typeof property === 'number') {
		return object[property];
	}

	// Array access with string that's a number
	if (Array.isArray(object) && typeof property === 'string' && /^\d+$/.test(property)) {
		return object[parseInt(property, 10)];
	}

	// Object property access
	if (typeof object === 'object' && property !== undefined) {
		return object[property];
	}

	return undefined;
}

async function evaluateBinary(expr: BinaryExpression, state: RenderState): Promise<any> {
	// Handle nullish coalescing with short-circuit evaluation
	if (expr.operator === '??') {
		const left = await evaluateExpression(expr.left, state);
		// Return left if it's truthy, otherwise evaluate and return right
		if (isTruthy(left)) {
			return left;
		}
		return evaluateExpression(expr.right, state);
	}

	const left = await evaluateExpression(expr.left, state);
	const right = await evaluateExpression(expr.right, state);

	switch (expr.operator) {
		case '==':
			return left == right;
		case '!=':
			return left != right;
		case '>':
			return left > right;
		case '<':
			return left < right;
		case '>=':
			return left >= right;
		case '<=':
			return left <= right;
		case 'contains':
			return evaluateContains(left, right);
		case 'and':
			return isTruthy(left) && isTruthy(right);
		case 'or':
			return isTruthy(left) || isTruthy(right);
		default:
			throw new Error(`Unknown binary operator: ${expr.operator}`);
	}
}

async function evaluateUnary(expr: UnaryExpression, state: RenderState): Promise<any> {
	const argument = await evaluateExpression(expr.argument, state);

	switch (expr.operator) {
		case 'not':
			return !isTruthy(argument);
		default:
			throw new Error(`Unknown unary operator: ${expr.operator}`);
	}
}

async function evaluateFilter(expr: FilterExpression, state: RenderState): Promise<any> {
	const value = await evaluateExpression(expr.value, state);

	// Evaluate filter arguments
	const args: any[] = [];
	for (const arg of expr.args) {
		let argValue = await evaluateExpression(arg, state);
		// If a filter argument is an identifier that resolved to undefined,
		// treat it as a string literal (e.g., date:YYYY-MM-DD, callout:info)
		if (argValue === undefined && arg.type === 'identifier') {
			argValue = arg.name;
		}
		args.push(argValue);
	}

	const stringValue = valueToString(value);

	// Build parameter string from args (already parsed by AST)
	// This avoids the round-trip of building "filterName:args" then re-parsing it
	let paramString: string | undefined;
	if (args.length > 0) {
		const formattedArgs = args.map(a => {
			if (typeof a === 'string') {
				// Don't double-quote strings that are already quoted
				if (isQuotedString(a)) {
					return a;
				}
				// Don't quote arrow function expressions (e.g., map:item => item.name)
				if (/\s*\w+\s*=>/.test(a)) {
					return a;
				}
				// Don't quote simple values that don't need quoting
				// e.g., "3:4", "2n", "abc" should stay unquoted
				if (/^[\w.:+\-*/]+$/.test(a)) {
					return a;
				}
				return `"${a}"`;
			}
			return String(a);
		});
		paramString = formattedArgs.join(',');
	}

	return await state.context.applyFilter(stringValue, expr.name, paramString, expr.line, expr.column);
}

function evaluateContains(left: any, right: any): boolean {
	if (left === undefined || left === null) return false;
	if (right === undefined || right === null) return false;

	// Array contains
	if (Array.isArray(left)) {
		return left.some(item => {
			if (typeof item === 'string' && typeof right === 'string') {
				return item.toLowerCase() === right.toLowerCase();
			}
			return item == right;
		});
	}

	// String contains (case-insensitive)
	if (typeof left === 'string') {
		const searchValue = typeof right === 'string' ? right : String(right);
		return left.toLowerCase().includes(searchValue.toLowerCase());
	}

	return false;
}

// ============================================================================
// Variable Resolution
// ============================================================================

function resolveVariable(name: string, variables: Record<string, any>, path?: readonly string[]): any {
	const trimmed = name.trim();

	// Try with {{ }} wrapper first (how variables are stored)
	const wrappedValue = variables[`{{${trimmed}}}`];
	if (wrappedValue !== undefined) {
		return wrappedValue;
	}

	// Try plain key (for locally set variables)
	if (variables[trimmed] !== undefined) {
		return variables[trimmed];
	}

	// Handle nested property access: author.name
	if (trimmed.includes('.')) {
		return getNestedValue(variables, path ?? trimmed.split('.'));
	}

	return undefined;
}

function getNestedValue(obj: any, keys: readonly string[]): any {
	if (keys.length === 0 || !obj) return undefined;
	let value = obj;

	for (const key of keys) {
		if (value === undefined || value === null) return undefined;

		// Handle bracket notation: items[0]
		if (key.includes('[') && key.includes(']')) {
			const match = key.match(/^([^\[]*)\[([^\]]+)\]/);
			if (match) {
				const [, arrayKey, indexStr] = match;
				const baseValue = arrayKey ? value[arrayKey] : value;
				if (Array.isArray(baseValue)) {
					const index = parseInt(indexStr, 10);
					value = baseValue[index];
				} else if (baseValue && typeof baseValue === 'object') {
					value = baseValue[indexStr.replace(/^["']|["']$/g, '')];
				} else {
					return undefined;
				}
				continue;
			}
		}

		// Try wrapped key first
		if (value[`{{${key}}}`] !== undefined) {
			value = value[`{{${key}}}`];
		} else {
			value = value[key];
		}
	}

	return value;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Trim trailing whitespace and optional newline from a string.
 * Used for trimLeft handling (removes whitespace at end of previous output).
 */
function trimTrailingWhitespace(str: string): string {
	return str.replace(/[\t ]*\r?\n?$/, '');
}

/**
 * Trim leading whitespace and optional newline from a string.
 * Used for trimRight handling (removes whitespace at start of next output).
 */
function trimLeadingWhitespace(str: string): string {
	return str.replace(/^[\t ]*\r?\n?/, '');
}

/**
 * Check if a string is already quoted or contains quoted pairs.
 * Used to avoid double-quoting filter arguments.
 * Examples: "value", 'value', "old":"new"
 */
function isQuotedString(str: string): boolean {
	return /^["'][\s\S]*["']$/.test(str) || str.includes('":"') || str.includes("':'");
}

/**
 * Check if a value is "truthy" for template conditionals
 */
function isTruthy(value: any): boolean {
	if (value === undefined || value === null) return false;
	if (value === '') return false;
	if (value === 0) return false;
	if (value === false) return false;
	if (Array.isArray(value) && value.length === 0) return false;
	return true;
}

/**
 * Convert any value to a string for output
 */
function valueToString(value: any): string {
	if (value === undefined || value === null) {
		return '';
	}
	if (Array.isArray(value) && value.length === 1 && typeof value[0] !== 'object') {
		return String(value[0]);
	}
	if (typeof value === 'object') {
		return JSON.stringify(value);
	}
	return String(value);
}

function toRenderError(error: unknown, prefix: string, line: number, column: number): RenderError {
	if (error instanceof TemplateRuntimeError) {
		return {
			message: error.message,
			line: error.line ?? line,
			column: error.column ?? column,
			code: error.code,
		};
	}
	return {
		message: `${prefix}: ${error instanceof Error ? error.message : String(error)}`,
		line,
		column,
		code: 'RENDER_ERROR',
	};
}
