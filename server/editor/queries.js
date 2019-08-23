const Cite = require('citation-js');

export const generateCiteHtmls = (inputVals, format = 'citation-apa') => {
	const citeObjects = inputVals.map((input) => {
		if (!input.structuredValue) {
			return { ...input, html: '' };
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
					return { ...input, html: html };
				})
				.catch(() => {
					return { ...input, html: 'Error' };
				});
		} catch (err) {
			return { ...input, html: 'Error' };
		}
	});
	return Promise.all(citeObjects);
};
