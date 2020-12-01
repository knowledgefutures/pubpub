import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Cite from 'citation-js';
import { getNotes } from 'components/Editor';
import { citationStyles } from 'utils/citations';

/* Different styles available here: */
/* https://github.com/citation-style-language/styles */
const config = Cite.plugins.config.get('@csl');
citationStyles.forEach((style) => {
	if (!style.path) return;
	/* ['apa', 'harvard', 'vancouver'] built-in to citation-js */
	const fileString = fs.readFileSync(
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
		path.join(__dirname, style.path !== '' ? style.path : null),
		{ encoding: 'utf8' },
	);
	config.templates.add(style.key, fileString);
});
/* Remove @else/url parser. See Freshdesk ticket #1308. Second term specifies sync/async component.  */
/* https://github.com/citation-js/citation-js/blob/master/packages/core/src/plugins/input/data.js#L90-L97 */
Cite.plugins.input.removeDataParser('@else/url', false);
Cite.plugins.input.removeDataParser('@else/url', true);

const generateFallbackHash = (structuredValue) =>
	crypto
		.createHash('md5')
		.update(structuredValue)
		.digest('base64')
		.substring(0, 10);

const extractAuthorFromApa = (apaStyleCitation) =>
	apaStyleCitation
		.split(',')
		.slice(0, -1)
		.join('');

const getInlineCitation = (citationJson, citationApa, inlineStyle, fallbackValue) => {
	if (inlineStyle === 'author' || inlineStyle === 'authorYear') {
		return inlineStyle === 'author' ? extractAuthorFromApa(citationApa) : citationApa;
	}
	if (inlineStyle === 'label') {
		return (citationJson[0] && citationJson[0]['citation-label']) || fallbackValue;
	}
	return null;
};

const getSingleStructuredCitation = async (structuredInput, citationStyle, inlineStyle) => {
	try {
		const fallbackValue = generateFallbackHash(structuredInput);
		const citationData = await Cite.async(structuredInput);
		if (citationData) {
			const citationJson = citationData.format('data', { format: 'object' });
			const citationHtml = citationData.format('bibliography', {
				template: citationStyle,
				format: 'html',
			});
			const citationApa = citationData.format('citation', {
				template: citationStyle === 'apa-7' ? 'apa-7' : 'apa',
				format: 'text',
			});
			return {
				html: citationHtml,
				json: citationJson,
				inline: getInlineCitation(citationJson, citationApa, inlineStyle, fallbackValue),
			};
		}
		return {
			html: '',
			json: '',
			inline: inlineStyle === 'label' ? `(${fallbackValue})` : null,
		};
	} catch (err) {
		return {
			html: 'Error',
			json: 'Error',
			inline: '(Error)',
			error: true,
		};
	}
};

export const getStructuredCitations = async (
	structuredInputs,
	citationStyle = 'apa',
	inlineStyle = 'count',
) => {
	const structuredCitationsMap = {};
	const structuredValues = await Promise.all(
		structuredInputs.map((structuredInput) =>
			getSingleStructuredCitation(structuredInput, citationStyle, inlineStyle),
		),
	);
	structuredInputs.forEach((input, index) => {
		structuredCitationsMap[input] = structuredValues[index];
	});
	return structuredCitationsMap;
};

export const getStructuredCitationsForPub = (pubData, pubDocument) => {
	const { initialDoc, citationStyle, citationInlineStyle } = pubData;

	const { footnotes, citations } = initialDoc
		? getNotes(pubDocument)
		: { footnotes: [], citations: [] };

	const structuredValuesInDoc = [
		// @ts-expect-error ts-migrate(2569) FIXME: Type 'Set<any>' is not an array type or a string t... Remove this comment to see the full error message
		...new Set([...footnotes, ...citations].map((note) => note.structuredValue)),
	];
	return getStructuredCitations(structuredValuesInDoc, citationStyle, citationInlineStyle);
};
