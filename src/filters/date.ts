import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import weekOfYear from 'dayjs/plugin/weekOfYear.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import type { FilterContext } from '../types';
import { splitParams, unquoteParamToken, unwrapParamList } from '../parser-utils';
import { reportFilterWarning } from './warnings';

dayjs.extend(customParseFormat);
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);
dayjs.extend(advancedFormat);

export const date = (str: string, param?: string, context?: FilterContext): string => {
	// Return empty string as-is without attempting to parse
	if (str === '') {
		return str;
	}

	// If the input is 'now' used in shorthands {{date}} and {{time}}, use the current date and time
	const inputDate = str === 'now' ? new Date() : str;

	if (!param) {
		return dayjs(inputDate).format('YYYY-MM-DD');
	}

	const params = splitParams(unwrapParamList(param)).map(unquoteParamToken);

	const [outputFormat, inputFormat] = params;

	let date;
	if (inputFormat) {
		// If inputFormat is provided, use it to parse the date
		date = dayjs(inputDate, inputFormat, true);
	} else {
		// If no inputFormat, let dayjs try to parse it automatically
		date = dayjs(inputDate);
	}

	if (!date.isValid()) {
		reportFilterWarning(context, `Could not parse "${str}" as a date`, 'INVALID_FILTER_INPUT');
		return str;
	}

	return date.format(outputFormat);
};
