import app, { wrap } from 'server/server';
import { Community } from 'server/models';
import { ForbiddenError, NotFoundError } from 'server/utils/errors';
import { isDevelopment } from 'utils/environment';

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
		if (!isDevelopment()) {
			throw new ForbiddenError();
		}
		const { subdomain } = req.body;
		if (subdomain || subdomain === null) {
			await setSubdomain(subdomain);
		}
		return res.status(200).json({});
	}),
);
