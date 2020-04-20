import fs from 'fs';
import path from 'path';
import Cite from 'citation-js';
import crypto from 'crypto';

/* Different styles available here: */
/* https://github.com/citation-style-language/styles */
const config = Cite.plugins.config.get('@csl');
const styles = [
	// { name: 'apa', path: Built-in to citation-js },
	// { name: 'harvard', path: Built-in to citation-js },
	// { name: 'vancouver', path: Built-in to citation-js },
	{ name: 'acm-siggraph', path: './citeStyles/acm-siggraph.csl' },
	{ name: 'american-anthro', path: './citeStyles/american-anthropological-association.csl' },
	{ name: 'cell', path: './citeStyles/cell.csl' },
	{ name: 'chicago', path: './citeStyles/chicago-author-date.csl' },
	{ name: 'elife', path: './citeStyles/elife.csl' },
	{ name: 'frontiers', path: './citeStyles/frontiers.csl' },
	{ name: 'mla', path: './citeStyles/modern-language-association.csl' },
];
styles.forEach((style) => {
	const fileString = fs.readFileSync(path.join(__dirname, style.path), { encoding: 'utf8' });
	config.templates.add(style.name, fileString);
});

export const generateCiteHtmls = async (inputVals, citationStyle = 'apa') => {
	const citeObjects = await Promise.all(
		inputVals.map((input) => {
			return input.structuredValue
				? Cite.async(input.structuredValue).catch(() => {
						return 'error';
				  })
				: undefined;
		}),
	);

	const outputsObjects = inputVals.map((input, index) => {
		const citeObject = citeObjects[index];
		if (citeObject === 'error') {
			return {
				...input,
				html: 'Error',
				json: 'Error',
				inlineAuthorYear: '(Error)',
				inlineAuthor: '(Error)',
				inlineLabel: '(Error)',
				error: true,
			};
		}
		const labelHash = crypto
			.createHash('md5')
			.update(JSON.stringify(input))
			.digest('base64')
			.substring(0, 10);
		if (!citeObject) {
			return {
				...input,
				html: '',
				json: '',
				inlineAuthorYear: '',
				inlineAuthor: '',
				inlineLabel: `(${labelHash})`,
			};
		}
		const json = citeObject.format('data', { format: 'object' });
		const inlineAuthorYear = citeObject.format('citation', { template: 'apa', format: 'text' });
		return {
			...input,
			html: citeObject.format('bibliography', { template: citationStyle, format: 'html' }),
			json: json,
			inlineAuthorYear: inlineAuthorYear,
			inlineAuthor: `${inlineAuthorYear
				.split(',')
				.slice(0, -1)
				.join('')})`,
			inlineLabel: `(${json[0]['citation-label'] || labelHash})`,
		};
	});
	return outputsObjects;
};
