const PUBSTASH_URL = 'http://pubstash:8080';

export const exportWithPaged = async (
	html: string,
	opts: { communityId: string; pubId: string },
) => {
	const params = new URLSearchParams({
		format: 'pdf',
		communityId: opts.communityId,
		pubId: opts.pubId,
	});
	const response = await fetch(`${PUBSTASH_URL}/convert?${params}`, {
		method: 'POST',
		body: html,
		headers: {
			'Content-Type': 'text/plain',
		},
	});

	if (!response.ok) {
		throw new Error(`PDF export failed: ${await response.text()}`);
	}

	return response.json();
};
