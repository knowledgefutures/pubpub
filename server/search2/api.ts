import { Router } from 'express';

import { type SearchFields, searchCommunities, searchPubs } from './queries';

export const router = Router();

const ALL_FIELDS: SearchFields[] = ['title', 'description', 'byline', 'content'];

router.get('/api/search', async (req, res) => {
	// Track whether the client has disconnected so we can skip sending a
	// response for aborted requests (the client uses AbortController).
	let closed = false;
	req.on('close', () => {
		closed = true;
	});

	try {
		const q = (req.query.q as string) || '';
		const mode = (req.query.mode as string) || 'pubs';
		const page = Math.max(0, parseInt(req.query.page as string, 10) || 0);
		const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
		const offset = page * limit;
		const communityId = req.query.communityId as string | undefined;
		const author = (req.query.author as string) || undefined;

		// Parse fields param: comma-separated, validated against known fields
		let fields: SearchFields[] | undefined;
		if (req.query.fields) {
			const raw = (req.query.fields as string).split(',');
			fields = raw.filter((f): f is SearchFields => ALL_FIELDS.includes(f as SearchFields));
			if (fields.length === 0) fields = undefined;
		}

		if (!q.trim()) {
			return res
				.status(200)
				.json({ results: [], total: 0, page, limit, facets: { authors: [] } });
		}

		if (mode === 'communities') {
			const { results, total } = await searchCommunities(q, { limit, offset });
			if (closed) return;
			return res.status(200).json({ results, total, page, limit, facets: { authors: [] } });
		}

		// Default: pubs
		const { results, total, facets } = await searchPubs(q, {
			limit,
			offset,
			communityId,
			fields,
			author,
		});
		if (closed) return;
		return res.status(200).json({ results, total, page, limit, facets });
	} catch (err) {
		if (closed) return;
		console.error('Error in search2 API:', err);
		return res.status(500).json({ error: 'Search failed' });
	}
});
