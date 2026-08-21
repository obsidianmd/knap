import type { ASTNode, ParserResult } from './parser';
import type { TemplateError } from './errors';

export type TemplateValue = unknown;
export type TemplateVariables = Record<string, TemplateValue>;

export interface ParamValidationResult {
	valid: boolean;
	error?: string;
}

export type ParamValidator = (param: string | undefined) => ParamValidationResult;

export interface FilterMetadata {
	example?: string;
	validateParams?: ParamValidator;
}

export interface FilterContext<TContext = unknown> {
	variables: TemplateVariables;
	context?: TContext;
}

export interface TemplateFilter<TContext = unknown> {
	(value: string, param?: string, context?: FilterContext<TContext>): TemplateValue;
	metadata?: FilterMetadata;
}

export type FilterRegistry<TContext = unknown> = Record<string, TemplateFilter<TContext>>;

export interface VariableResolverContext<TContext = unknown> {
	variables: TemplateVariables;
	context?: TContext;
}

export type VariableResolver<TContext = unknown> = (
	name: string,
	context: VariableResolverContext<TContext>,
) => TemplateValue | Promise<TemplateValue>;

export interface EngineOptions<TContext = unknown> {
	filters?: FilterRegistry<TContext>;
}

export interface RenderInput<TContext = unknown> {
	variables: TemplateVariables;
	context?: TContext;
	resolveVariable?: VariableResolver<TContext>;
}

export interface RenderOptions {
	trimOutput?: boolean;
}

export interface TemplateResult {
	output: string;
	errors: TemplateError[];
}

export interface TemplateEngine<TContext = unknown> {
	readonly filters: Readonly<FilterRegistry<TContext>>;
	parse(template: string): ParserResult;
	validate(templateOrAst: string | ASTNode[]): TemplateError[];
	render(template: string, input: RenderInput<TContext>, options?: RenderOptions): Promise<TemplateResult>;
	renderOrThrow(template: string, input: RenderInput<TContext>, options?: RenderOptions): Promise<string>;
}
