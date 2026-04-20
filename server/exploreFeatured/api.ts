import { Router } from 'express';

import { Community } from 'server/models';
import { isUserSuperAdmin } from 'server/user/queries';
import { ForbiddenError } from 'server/utils/errors';
import { wrap } from 'server/wrap';

export const router = Router();

router.put(
	'/api/exploreFeatured',
	wrap(async (req, res) => {
		const { communityId, isFeatured } = req.body;
		const isSuperAdmin = await isUserSuperAdmin({ userId: req.user?.id });
		if (!isSuperAdmin) {
			throw new ForbiddenError();
		}
		await Community.update({ isFeatured: !!isFeatured }, { where: { id: communityId } });
		return res.status(200).send({ communityId, isFeatured: !!isFeatured });
	}),
);
