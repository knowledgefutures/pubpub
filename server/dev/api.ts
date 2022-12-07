import app, { wrap } from 'server/server';
import { Community } from 'server/models';
import { ForbiddenError, NotFoundError, BadRequestError } from 'server/utils/errors';
import { canSelectCommunityForDevelopment } from 'utils/environment';

const setSubdomain = async (subdomain: string | null) => {
	process.env.FORCE_BASE_PUBPUB = subdomain === null ? 'true' : '';
	if (subdomain) {
		const exists = await Community.findOne({ where: { subdomain } });
		if (!exists) {
			throw new NotFoundError();
		}
		process.env.PUBPUB_LOCAL_COMMUNITY = subdomain;
	}
};

app.post(
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
