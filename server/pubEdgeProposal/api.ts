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
				// @ts-expect-error ts-migrate(2322) FIXME: Type '{ targetPub: any; }' is not assignable to ty... Remove this comment to see the full error message
				edge = { targetPub: pub };
			} else if (isDoi(object) || isDoi(extractDoiFromOrgUrl(url))) {
				// @ts-expect-error ts-migrate(2322) FIXME: Type '{ externalPublication: { avatar: null; contr... Remove this comment to see the full error message
				edge = await createPubEdgeProposalFromCrossrefDoi(object);
			} else {
				// @ts-expect-error ts-migrate(2322) FIXME: Type '{ externalPublication: any; } | null' is not... Remove this comment to see the full error message
				edge = await createPubEdgeProposalFromArbitraryUrl(url);
			}
		}

		return res.status(200).json(edge);
	}),
);
