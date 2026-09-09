import { RenderBudget } from './limits';
import { TemplateRenderError, TemplateRuntimeError, type TemplateError } from './errors';
import { parse, validateFilters, type ASTNode, type ParserError } from './parser';
import { renderAST } from './renderer';
import type {
	EngineOptions,
	FilterMetadata,
	FilterRegistry,
	FilterWarning,
	RenderInput,
	RenderOptions,
	TemplateEngine,
	TemplateResult,
} from './types';

function normalizeParserError(error: ParserError): TemplateError {
	return {
		message: error.message,
		line: error.line,
		column: error.column,
		code: error.code ?? 'PARSE_ERROR',
	};
}

function metadataForRegistry<TContext>(filters: Readonly<FilterRegistry<TContext>>): Record<string, FilterMetadata> {
	return Object.fromEntries(Object.entries(filters).map(([name, filter]) => [name, filter.metadata ?? {}]));
}

export function createEngine<TContext = unknown>(
	options: EngineOptions<TContext> = {},
): TemplateEngine<TContext> {
	const filters = Object.freeze({ ...(options.filters ?? {}) });
	const filterMetadata = metadataForRegistry(filters);
	const parseTemplate = (template: string) => parse(template, options.limits);

	function validate(templateOrAst: string | ASTNode[]): TemplateError[] {
		let ast: ASTNode[];
		const errors: TemplateError[] = [];

		if (typeof templateOrAst === 'string') {
			const parsed = parseTemplate(templateOrAst);
			ast = parsed.ast;
			errors.push(...parsed.errors.map(normalizeParserError));
		} else {
			ast = templateOrAst;
			try { new RenderBudget(options.limits).value(ast); }
			catch (error) {
				if (!(error instanceof TemplateRuntimeError)) throw error;
				return [{ message: error.message, code: error.code, line: 1, column: 1 }];
			}
		}

		if (errors.length === 0) {
			errors.push(...validateFilters(ast, filterMetadata).map(normalizeParserError));
		}

		return errors;
	}

	async function render(
		template: string,
		input: RenderInput<TContext>,
		renderOptions: RenderOptions = {},
	): Promise<TemplateResult> {
		const limits = { ...options.limits, ...renderOptions.limits };
		const parsed = parse(template, limits);
		const errors = parsed.errors.map(normalizeParserError);
		if (errors.length > 0) return { output: '', errors, warnings: [] };

		const budget = new RenderBudget(limits);
		const validationErrors = validateFilters(parsed.ast, filterMetadata).map(normalizeParserError);
		const warnings: TemplateResult['warnings'] = [];
		const warningKeys = new Set<string>();

		const resolverContext = {
			variables: input.variables,
			context: input.context,
		};

		const rendered = await renderAST(parsed.ast, {
			variables: input.variables,
			asyncResolver: input.resolveVariable
				? async name => {
					try {
						return await input.resolveVariable!(name, resolverContext);
					} catch (error) {
						throw new TemplateRuntimeError(
							`Could not resolve variable "${name}": ${error instanceof Error ? error.message : String(error)}`,
							'RESOLVE_ERROR',
						);
					}
				}
				: undefined,
			applyFilter: async (value, filterName, param, line, column, rawValue, rawArguments, validateResolvedParams) => {
				const filter = Object.prototype.hasOwnProperty.call(filters, filterName) ? filters[filterName] : undefined;
				if (!filter) {
					return value;
				}
				try {
					if (validateResolvedParams) {
						const validation = filterMetadata[filterName]?.validateParams?.(param);
						if (validation && !validation.valid) {
							throw new TemplateRuntimeError(
								`Filter "${filterName}" ${validation.error ?? 'has invalid arguments'}`,
								'INVALID_FILTER_ARGUMENTS',
							);
						}
					}
					const result = await filter(value, param, {
						allowRegex: options.allowRegex ?? true,
						checkValue: value => budget.value(value),
						checkLength: length => budget.length(length),
						...resolverContext,
						rawValue,
						rawArguments,
						reportWarning: (warning: FilterWarning) => {
							const templateWarning = {
								message: warning.message,
								line,
								column,
								code: warning.code ?? 'FILTER_WARNING',
								filter: filterName,
							} satisfies TemplateResult['warnings'][number];
							const warningKey = JSON.stringify([
								templateWarning.code,
								templateWarning.filter,
								templateWarning.line,
								templateWarning.column,
								templateWarning.message,
							]);
							if (!warningKeys.has(warningKey)) {
								warningKeys.add(warningKey);
								warnings.push(templateWarning);
							}
						},
					});
					budget.value(result);
					return result;
				} catch (error) {
					if (error instanceof TemplateRuntimeError) {
						throw new TemplateRuntimeError(
							error.message,
							error.code,
							error.line ?? line,
							error.column ?? column,
						);
					}
					throw new TemplateRuntimeError(
						`Filter "${filterName}" failed: ${error instanceof Error ? error.message : String(error)}`,
						'FILTER_ERROR',
						line,
						column,
					);
				}
			},
		}, { ...renderOptions, limits }, budget);

		return {
			output: rendered.output,
			errors: [...validationErrors, ...rendered.errors],
			warnings,
		};
	}

	return {
		filters,
		parse: parseTemplate,
		validate,
		render,
		async renderOrThrow(template, input, renderOptions) {
			const result = await render(template, input, renderOptions);
			if (result.errors.length > 0) throw new TemplateRenderError(result.errors);
			return result.output;
		},
	};
}
