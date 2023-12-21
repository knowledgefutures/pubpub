import { createPurgeHooks } from 'utils/caching/createPurgeHooks';
import { Op } from 'sequelize';
import { PubAttribution, includeUserModel } from 'server/models';
import { DefinitelyHas } from 'types';

import { Release } from './model';

const findAttributionsUserSlugsForPubId = async ({ pubId }: { pubId: string }) => {
	const attributions = (await PubAttribution.findAll({
		where: { userId: { [Op.ne]: null }, pubId },
		include: [
			includeUserModel({
				as: 'user',
			}),
		],
	})) as DefinitelyHas<PubAttribution, 'user'>[];

	return attributions.map((attribution) => attribution.user.slug);
};

createPurgeHooks({
	model: Release,
	onModelCreated: findAttributionsUserSlugsForPubId,
});
