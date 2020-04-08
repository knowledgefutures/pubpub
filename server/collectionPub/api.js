import app, { wrap } from '../server';
import { getPermissions } from './permissions';
import { ForbiddenError } from '../errors';
import {
	createCollectionPub,
	updateCollectionPub,
	setPrimaryCollectionPub,
	destroyCollectionPub,
	getCollectionPubs,
} from './queries';

const getRequestIds = (req, argsFrom = req.body) => {
	const user = req.user || {};
	return {
		userId: user.id,
		pubId: argsFrom.pubId || null,
		collectionId: argsFrom.collectionId,
		communityId: argsFrom.communityId,
	};
};

app.get(
	'/api/collectionPubs',
	wrap(async (req, res) => {
		try {
			const collectionPubs = await getCollectionPubs(getRequestIds(req, req.query));
			return res.status(201).json(collectionPubs);
		} catch (err) {
			return res.status(500).json(err);
		}
	}),
);

app.post(
	'/api/collectionPubs',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const collectionPub = await createCollectionPub(req.body);
		return res.status(201).json(collectionPub);
	}),
);

app.put(
	'/api/collectionPubs/setPrimary',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const updated = await setPrimaryCollectionPub({
			...req.body,
			collectionPubId: req.body.id,
		});
		return res.status(200).json(updated);
	}),
);

app.put(
	'/api/collectionPubs',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const updated = await updateCollectionPub(
			{
				...req.body,
				collectionPubId: req.body.id,
			},
			permissions.update,
		);
		return res.status(200).json(updated);
	}),
);

app.delete(
	'/api/collectionPubs',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		await destroyCollectionPub({
			...req.body,
			collectionPubId: req.body.id,
		});
		return res.status(200).json(req.body.id);
	}),
);
