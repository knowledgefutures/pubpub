import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { canManipulateSpamTags } from './permissions';
import { updateSpamTagForCommunity } from './queries';

app.put(
	'/api/spamTags',
	wrap(async (req, res) => {
		const { communityId, status } = req.body;
		const canUpdate = await canManipulateSpamTags({ userId: req.user?.id });
		if (!canUpdate) {
			throw new ForbiddenError();
		}
		await updateSpamTagForCommunity({ communityId, status });
		return res.status(200).send({});
	}),
);
