export const getIframeSrc = (val) => {
	const re = /<iframe.*?src="(.*?)"/;
	const getSrc = val.indexOf('<iframe') > -1 && val.match(re) && val.match(re)[1];
	return getSrc || null;
};

export const getEmbedType = (input) => {
	const urls = {
		youtube: ['https://www.youtube.com', 'https://youtu.be'],
		codepen: ['https://codepen.io'],
		vimeo: ['https://vimeo.com', 'https://player.vimeo.com'],
		soundcloud: ['https://soundcloud.com'],
		github: ['https://gist.github.com'],
	};

	return Object.keys(urls).reduce((prev, curr) => {
		const currUrls = urls[curr];
		const isMatch = currUrls.reduce((prevMatch, currUrl) => {
			if (input.indexOf(currUrl) === 0) {
				return true;
			}
			return prevMatch;
		}, false);
		if (isMatch) {
			return curr;
		}
		return prev;
	}, null);
};

export const renderLatexString = (value, isBlock, callback) => {
	fetch('/api/editor/latex-render', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			value: value,
			isBlock: isBlock,
		}),
		credentials: 'include',
	})
		.then((response) => {
			if (!response.ok) {
				return response.json().then((err) => {
					throw err;
				});
			}
			return response.json();
		})
		.then((result) => {
			callback(result);
		})
		.catch((error) => {
			callback(error);
		});
};
