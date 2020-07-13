export const defaultProcessor = ($el) => $el.attr('content') || $el.text().trim();
export const defaultMultipleProcessor = ($el, $) =>
	$el.toArray().map((el) => defaultProcessor($(el)));

export const queryDocument = (config, $) => {
	let result;

	// Execute queries in order
	for (let i = 0; i < config.length; i++) {
		const query = config[i];

		let $el;
		let process;
		let multiple = false;

		if (typeof query === 'string') {
			// String form of query, e.g. "a.author"
			$el = $(query);
		} else {
			// Object form of query, e.g.
			//   { selector: "a.author", process: $el => $el.attr("href") }
			$el = $(query.selector);

			// Process only first element by default.
			multiple = Boolean(query.multiple);
			process = query.process;
		}

		if (!multiple) {
			$el = $($el.get(0));
		}

		if (multiple || $el.length > 0) {
			// Use default processor if none is specified (content attr value or innerText)
			result = (process || (multiple ? defaultMultipleProcessor : defaultProcessor))($el, $);

			// Stop on first result
			if (multiple ? result.length > 0 : result) {
				break;
			}
		}
	}

	return result || null;
};

export const pubEdgeQueries = {
	avatar: [
		'meta[property="og:image:secure_url"]',
		'meta[property="og:image"]',
		'meta[name="twitter:image"]',
		{ selector: 'article img, .abstract img', process: ($el) => $el.attr('src') },
	],
	contributors: [
		{ selector: 'meta[name="author"]', multiple: true },
		{ selector: 'meta[property="article:author"]', multiple: true },
		{
			selector: 'meta[name="dc.creator"]',
			multiple: true,
		},
		{
			selector: '[rel="author"], .author',
			multiple: true,
		},
	],
	doi: [
		'meta[name="doi"]',
		{
			selector: 'meta[name="prism.doi"], meta[name="dc.identifier"]',
			process: ($el) => $el.attr('content').split('doi:')[1] || null,
		},
	],
	url: ['meta[property="og:url"]'],
	publicationDate: [
		{
			selector:
				'meta[property="article:published_time"], meta[name="dc.date"], meta[name="prism.publicationDate"]',
			process: ($el) => new Date(defaultProcessor($el)),
		},
		{
			selector: 'time',
			process: ($el) => new Date($el.attr('datetime')),
		},
		{
			selector: 'time, .date',
			process: ($el) => new Date(defaultProcessor($el)),
		},
	],
	title: ['meta[property="og:title"]', 'meta[name="dc.title"]'],
	description: [
		'meta[name="description"]',
		'meta[property="og:description"]',
		'meta[name="dc.description"]',
	],
};

export const runQueries = ($, queries) =>
	Object.entries(queries).reduce((results, [key, query]) => {
		return { ...results, [key]: queryDocument(query, $) };
	}, {});
