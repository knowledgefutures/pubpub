import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Cite from 'citation-js';

/* Different styles available here: */
/* https://github.com/citation-style-language/styles */
/* ['apa', 'harvard', 'vancouver'] built-in to citation-js */
const styles = [
	{ name: 'acm-siggraph', path: './citeStyles/acm-siggraph.csl' },
	{ name: 'american-anthro', path: './citeStyles/american-anthropological-association.csl' },
	{ name: 'cell', path: './citeStyles/cell.csl' },
	{ name: 'chicago', path: './citeStyles/chicago-author-date.csl' },
	{ name: 'elife', path: './citeStyles/elife.csl' },
	{ name: 'frontiers', path: './citeStyles/frontiers.csl' },
	{ name: 'mla', path: './citeStyles/modern-language-association.csl' },
	{ name: 'apa-7', path: './citeStyles/apa-7.csl' },
];
const config = Cite.plugins.config.get('@csl');
styles.forEach((style) => {
	const fileString = fs.readFileSync(path.join(__dirname, style.path), { encoding: 'utf8' });
	config.templates.add(style.name, fileString);
});
/* Remove @else/url parser. See Freshdesk ticket #1308. Second term specifies sync/async component.  */
/* https://github.com/citation-js/citation-js/blob/master/packages/core/src/plugins/input/data.js#L90-L97 */
Cite.plugins.input.removeDataParser('@else/url', false);
Cite.plugins.input.removeDataParser('@else/url', true);

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

	const outputsObjects = inputVals
		.map((input, index) => {
			const citeObject = citeObjects[index];
			if (citeObject === 'error') {
				return {
					...input,
					html: 'Error',
					json: 'Error',
					inline: {
						authorYear: '(Error)',
						author: '(Error)',
						label: '(Error)',
					},
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
					inline: {
						authorYear: '',
						author: '',
						label: `(${labelHash})`,
					},
				};
			}
			const json = citeObject.format('data', { format: 'object' });
			const authorYear = citeObject.format('citation', {
				template: citationStyle === 'apa-7' ? 'apa-7' : 'apa',
				format: 'text',
			});
			const citeObjectLabel = json[0] ? json[0]['citation-label'] : undefined;
			return {
				...input,
				html: citeObject.format('bibliography', {
					template: citationStyle,
					format: 'html',
				}),
				json: json,
				inline: {
					authorYear: authorYear,
					author: `${authorYear
						.split(',')
						.slice(0, -1)
						.join('')})`,
					label: `(${citeObjectLabel || labelHash})`,
				},
			};
		})
		.filter((output) => !!output);
	return outputsObjects;
};
