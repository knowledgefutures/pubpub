export const exportWithPaged = async (html: string) => {
	const response = await fetch(`${process.env.PUBSTASH_URL}/convert?format=pdf`, {
		method: 'POST',
		body: html,
		headers: {
			Authorization: process.env.PUBSTASH_ACCESS_KEY ?? '',
			'Content-Type': 'text/plain',
		},
	});

	if (!response.ok) {
		throw new Error(`PDF export failed: ${await response.text()}`);
	}

	return response.json();
};
