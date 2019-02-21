import Cite from 'citation-js';
import katex from 'katex';
import request from 'request-promise';
import app from '../server';

app.post('/api/editor/citation-format', (req, res) => {
	Cite.async(req.body.input)
		.then((data) => {
			try {
				const output = data.get({
					format: 'string',
					type: 'html',
					style: 'citation-apa',
					lang: 'en-US',
				});
				if (output === '<div class="csl-bib-body">\n</div>') {
					return res.status(500).json('Error rendering citation');
				}
				return res.status(201).json(output);
			} catch (err) {
				return res.status(500).json(err);
			}
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
