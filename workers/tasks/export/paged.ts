export const exportWithPaged = async (html: string) => {
	// Default to the in-swarm pubstash service; falls back to PUBSTASH_URL env var
	// for backwards-compat with the old Fly.io deployment.
	const baseUrl = process.env.PUBSTASH_URL ?? 'http://pubstash:8080';
	const response = await fetch(`${baseUrl}/convert?format=pdf`, {
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
