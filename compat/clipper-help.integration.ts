import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compileTemplate } from 'clipper/utils/template-compiler';
import { addSchemaOrgDataToVariables } from 'clipper/utils/shared';
import { clipperHelpFilters, clipperHelpLogic } from '../tests/fixtures/clipper-help';
import { createAsyncResolver } from 'clipper/api';
import { parseHTML } from 'clipper-dom';
import { generalSettings } from 'clipper/utils/storage-utils';

const help = resolve(process.env.HELP_ROOT ?? '../obsidian-help', 'en/Obsidian Web Clipper');
const variablesDoc = readFileSync(resolve(help, 'Variables.md'), 'utf8');

describe('English help examples through the actual Clipper compiler', () => {
	test.each([
		['{{selector:h1}}', 'Title'],
		['{{selector:.author}}', 'Ada'],
		['{{selector:img.hero?src}}', 'image.jpg'],
		['{{selector:a.main-link?href}}', 'https://example.com/article'],
		['{% for comment in selector:.comment %}{{comment}}{% endfor %}', 'First\nSecond'],
		['{% if selector:.premium-badge %}Premium{% endif %}', 'Premium'],
		['{% set items = selector:.list-item %}{{items|join:", "}}', 'One, Two'],
	])('extracts %s from a real HTML document', async (template, expected) => {
		const { document } = parseHTML('<html><body><h1>Title</h1><span class="author">Ada</span><img class="hero" src="image.jpg"><a class="main-link" href="https://example.com/article">Article</a><p class="comment">First</p><p class="comment">Second</p><b class="premium-badge">Yes</b><li class="list-item">One</li><li class="list-item">Two</li></body></html>');
		expect(await compileTemplate(0, template, {}, 'https://example.com', createAsyncResolver(document))).toBe(expected);
	});
	test.each([
		'{{"a summary of the page"}}',
		'{{"a summary of the page"|blockquote}}',
		'{{"a three bullet point summary, translated to French"}}',
		'{{"un resumé de la page en trois points"}}',
		'{{"return a JSON object for each tweet, that includes the author, tweet_text, date in YYYY-MM-DD format, and images array (if there are any)"|map:tweet => ({text: tweet.tweet_text, author: tweet.author, date: tweet.date})|template:"${text}\\n— [[@${author}]], [[${date}]]\\n"}}',
	])('preserves the deferred prompt %s without calling a model', async template => {
		const previous = generalSettings.interpreterEnabled;
		generalSettings.interpreterEnabled = true;
		try {
			expect(await compileTemplate(0, template, {}, 'https://example.com')).toBe(template);
		} finally { generalSettings.interpreterEnabled = previous; }
	});
	test.each(clipperHelpFilters)('%s', async (_name, value, filter, expected) => {
		const output = await compileTemplate(0, `{{value|${filter}}}`, { value }, 'https://example.com');
		expect(typeof expected === 'object' ? JSON.parse(output) : output).toEqual(expected);
	});
	test.each(clipperHelpLogic)('%s', async (_name, template, variables, expected) => {
		expect(await compileTemplate(0, template, variables, 'https://example.com')).toBe(expected);
	});
	test.each([
		['selector:h1', 'Title'], ['selector:.author', 'Ada'],
		['selector:img.hero?src', 'image.jpg'], ['selector:a.main-link?href', 'https://example.com/article'],
	])('delegates %s without altering the CSS', async (name, value) => {
		const seen: string[] = [];
		const output = await compileTemplate(0, `{{${name}}}`, {}, 'https://example.com', async path => { seen.push(path); return value; });
		expect(seen).toEqual([name]);
		expect(output).toBe(value);
	});
	test('meta names preserve embedded colons', async () => {
		expect(await compileTemplate(0, '{{meta:name:description}} / {{meta:property:og:title}}', {
			'{{meta:name:description}}': 'Description', '{{meta:property:og:title}}': 'Title',
		}, 'https://example.com')).toBe('Description / Title');
	});
	test('parallel selector arrays from the Logic page', async () => {
		const output = await compileTemplate(0, '{% set transcripts = selector:.transcript-text %}\n{% set timestamps = selector:.timestamp %}\n\n{% for line in transcripts %}\n{{timestamps[loop.index0]}} - {{line}}\n{% endfor %}', {}, 'https://example.com', async name => ({
			'selector:.transcript-text': ['Hello', 'World'], 'selector:.timestamp': ['0:01', '0:02'],
		})[name]);
		expect(output.trim()).toBe('0:01 - Hello\n0:02 - World');
	});
});

describe('Web Clipper help schema examples through the real Clipper adapter', () => {
	for (const prefix of ['schema:', 'schema:@Article:']) {
		test(`${prefix}author returns the complete array`, async () => {
			const authors = [{ name: 'Ada' }, { name: 'Grace' }];
			const variables: Record<string, string> = {};
			addSchemaOrgDataToVariables([{ '@type': 'Article', author: authors }], variables);
			expect(JSON.parse(await compileTemplate(0, `{{${prefix}author}}`, variables, 'https://example.com'))).toEqual(authors);
		});
		test(`${prefix}author.name for a single author`, async () => {
			const variables: Record<string, string> = {};
			addSchemaOrgDataToVariables([{ '@type': 'Article', author: { name: 'Ada' } }], variables);
			expect(await compileTemplate(0, `{{${prefix}author.name}}`, variables, 'https://example.com')).toBe('Ada');
		});
		test.each([
			['author[0].name', 'Ada'],
			['author[1].name', 'Grace'],
			['author[*].name', '["Ada","Grace"]'],
			['author[*].name|join:", "', 'Ada, Grace'],
			['author[9].name', ''],
		])(`${prefix}%s`, async (path, expected) => {
			const variables: Record<string, string> = {};
			addSchemaOrgDataToVariables([{ '@type': 'Article', author: [{ name: 'Ada' }, { name: 'Grace' }] }], variables);
			expect(await compileTemplate(0, `{{${prefix}${path}}}`, variables, 'https://example.com')).toBe(expected);
		});
	}

	test('the three reported expressions still appear in the English help', () => {
		for (const expression of ['{{schema:author.name}}', '{{schema:author[0].name}}', '{{schema:author[*].name}}']) {
			expect(variablesDoc).toContain(expression);
		}
	});

	test('schema arrays remain iterable in the documented loop', async () => {
		const variables: Record<string, string> = {};
		addSchemaOrgDataToVariables([{ '@type': 'Article', author: [{ name: 'Ada' }, { name: 'Grace' }] }], variables);
		expect(await compileTemplate(0, '{% for item in schema:author %}\n- {{item.name}}\n{% endfor %}', variables, 'https://example.com')).toBe('- Ada\n- Grace');
	});
});
