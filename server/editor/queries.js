import Cite from 'citation-js';

export const generateCiteHtmls = (inputVals, format = 'citation-apa') => {
	const citeObjects = inputVals.map((input) => {
		if (!input.structuredValue) {
			return { ...input, html: '', json: '' };
		}
		try {
			return Cite.async(input.structuredValue)
				.then((data) => {
					const html = data.get({
						format: 'string',
						type: 'html',
						style: format,
						lang: 'en-US',
					});
					const json = data.get({
						format: 'real',
						type: 'json',
						style: 'csl',
						lang: 'en-US',
					});
					return { ...input, html: html, json: json };
				})
				.catch(() => {
					return { ...input, html: 'Error', json: 'Error' };
				});
		} catch (err) {
			return { ...input, html: 'Error', json: 'Error' };
		}
	});
	return Promise.all(citeObjects);
};
