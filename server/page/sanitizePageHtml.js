import sanitizeHtml from 'sanitize-html';

export const sanitizePageHtml = (html) => {
	return sanitizeHtml(html, {
		allowedTags: [
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'blockquote',
			'p',
			'a',
			'ul',
			'ol',
			'nl',
			'li',
			'b',
			'i',
			'strong',
			'em',
			'strike',
			'code',
			'hr',
			'br',
			'div',
			'table',
			'thead',
			'caption',
			'tbody',
			'tr',
			'th',
			'td',
			'pre',
			'img',
			'video',
			'iframe',
			'style',
			'svg',
			'path',
			'span',
		],
		allowedAttributes: {
			'*': [
				'class',
				'id',
				'style',
				'src',
				'width',
				'height',
				'preload',
				'controls',
				'allowfullscreen',
				'frameborder',
				'viewBox',
				'd',
				'fill-rule',
			],
			a: ['href', 'target', 'rel'],
		},
		allowedSchemes: ['https', 'mailto'],
		transformTags: {
			a: (tagName, attribs) => {
				const needsRel = attribs.target && attribs.target === '_blank';
				const newAttribs = { ...attribs };
				if (needsRel) {
					newAttribs.rel = 'noopener noreferrer';
				}
				return {
					tagName: 'a',
					attribs: newAttribs,
				};
			},
		},
	});
};
