import { Router } from 'express';

import { env } from 'server/env';
import { Community } from 'server/models';
import { BadRequestError, ForbiddenError, NotFoundError } from 'server/utils/errors';
import { wrap } from 'server/wrap';
import { canSelectCommunityForDevelopment } from 'utils/environment';

export const router = Router();

export const setSubdomain = async (subdomain: string | null) => {
	const isBasePubPub = subdomain === null;
	env.FORCE_BASE_PUBPUB = isBasePubPub;

	if (isBasePubPub) {
		env.PUBPUB_LOCAL_COMMUNITY = undefined;
		return;
	}

	if (!subdomain) {
		return;
	}

	const exists = await Community.findOne({ where: { subdomain } });
	if (!exists) {
		throw new NotFoundError();
	}

	env.PUBPUB_LOCAL_COMMUNITY = subdomain;
};

router.post(
	'/api/dev',
	wrap(async (req, res) => {
		const { subdomain } = req.body;
		if (subdomain || subdomain === null) {
			if (!canSelectCommunityForDevelopment()) {
				throw new ForbiddenError();
			}
			await setSubdomain(subdomain);
			return res.status(200).json({});
		}
		throw new BadRequestError();
	}),
);
