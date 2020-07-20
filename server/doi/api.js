import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';
import xmlbuilder from 'xmlbuilder';

import { getDoiData, setDoiData } from './queries';
import { getPermissions } from './permissions';

const previewOrDepositDoi = async (req, options = { deposit: false }) => {
	const { deposit } = options;
	const user = req.user || {};
	const { target, communityId, collectionId, pubId } = deposit ? req.body : req.query;
	const requestIds = {
		userId: user.id,
		communityId: communityId,
		collectionId: collectionId || null,
		pubId: pubId || null,
	};
	const permissions = await getPermissions(requestIds);
	const isAuthenticated =
		(target === 'pub' && permissions.pub) ||
		(target === 'collection' && permissions.collection);

	if (!isAuthenticated) {
		throw new ForbiddenError();
	}

	const doiJson = await (deposit ? setDoiData : getDoiData)(
		{
			communityId: communityId,
			collectionId: collectionId,
			pubId: pubId,
		},
		target,
	);

	return doiJson;
};

app.post(
	'/api/doi',
	wrap(async (req, res) => {
		const doiJson = await previewOrDepositDoi(req, { deposit: true });

		return res.status(201).json(doiJson);
	}),
);

app.get(
	'/api/doiPreview',
	wrap(async (req, res) => {
		const doiJson = await previewOrDepositDoi(req);
		const depositXml = xmlbuilder.create(doiJson, { headless: true }).end({ pretty: true });

		return res.status(201).json({
			depositJson: doiJson,
			depositXml: depositXml,
		});
	}),
);
