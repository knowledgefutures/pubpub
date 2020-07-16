import app, { wrap } from 'server/server';
import { parseUrl } from 'utils/urls';
import { isDoi, extractDoiFromOrgUrl } from 'utils/crossref/parseDoi';

import {
	createPubEdgeProposalFromArbitraryUrl,
	createPubEdgeProposalFromCrossrefDoi,
	getPubDataFromUrl,
} from './queries';

app.get(
	'/api/pubEdgeProposal',
	wrap(async (req, res) => {
		const { object } = req.query;
		const url = parseUrl(object);

		let edge = null;

		if (url) {
			const pub = await getPubDataFromUrl(url);

			if (pub) {
				edge = { targetPub: pub };
			} else {
				const doi = await extractDoiFromOrgUrl(url);

				if (doi) {
					edge = await createPubEdgeProposalFromCrossrefDoi(doi);
				} else {
					edge = await createPubEdgeProposalFromArbitraryUrl(url);
				}
			}
		} else if (isDoi(object)) {
			edge = await createPubEdgeProposalFromCrossrefDoi(object);
		}

		return res.status(200).json(edge);
	}),
);
