import type { FilterContext, TemplateValue } from '../types';
import { reportFilterWarning } from './warnings';

export const parse_json = (
	value: string,
	_param?: string,
	context?: FilterContext,
): TemplateValue => {
	if (context && Object.prototype.hasOwnProperty.call(context, 'rawValue')
		&& typeof context.rawValue !== 'string') {
		return context.rawValue;
	}

	try {
		return JSON.parse(value);
	} catch {
		reportFilterWarning(context, 'Could not parse value as JSON', 'INVALID_FILTER_INPUT');
		return value;
	}
};
