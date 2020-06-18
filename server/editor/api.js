import katex from 'katex';
import request from 'request-promise';

import app from 'server/server';

import { generateCiteHtmls } from './queries';

app.post('/api/editor/citation-format', (req, res) => {
	generateCiteHtmls(req.body.data, req.body.citationStyle)
		.then((output) => {
			return res.status(201).json(output);
		})
		.catch((err) => {
			return res.status(500).json(err);
		});
});

app.post('/api/editor/latex-render', (req, res) => {
	try {
		const renderedHTML = katex.renderToString(req.body.value, {
			displayMode: req.body.isBlock,
			throwOnError: false,
		});
		return res.status(201).json(renderedHTML);
	} catch (err) {
		return res.status(201).json('<div class="pub-latex-error">Error rendering equation</div>');
	}
});

app.get('/api/editor/embed', (req, res) => {
	const type = req.query.type;
	const input = req.query.input;
	const oembedUrls = {
		youtube: `https://www.youtube.com/oembed?url=${input}&format=json`,
		codepen: `https://codepen.io/api/oembed?url=${input}&format=json`,
		vimeo: `https://vimeo.com/api/oembed.json?url=${input}`,
		soundcloud: `https://soundcloud.com/oembed?url=${input}&format=json`,
	};
	const oembedUrl = oembedUrls[type];

	if (!oembedUrl) {
		if (type === 'github') {
			const githubParts = input.split('/');
			// GitHub API requests require a user agent: https://developer.github.com/v3/#user-agent-required
			return request(`https://api.github.com/gists/${githubParts[githubParts.length - 1]}`, {
				json: true,
				headers: {
					'User-Agent': 'pubpub',
				},
			})
				.then((result) => {
					return res.status(200).json({
						title: `${result.description}`,
						html: `<html><head></head><body><style type="text/css">.gist-file .gist-data {max-height: 730px;}</style><script src="${result.html_url}.js"></script></body></html>`,
					});
				})
				.catch((err) => {
					console.warn(err);
					return res.status(500).json(err);
				});
		}
		return res.status(400).json('Type not supported');
	}

	return request(oembedUrl, { json: true })
		.then((result) => {
			return res.status(200).json(result);
		})
		.catch((err) => {
			return res.status(500).json(err);
		});
});
