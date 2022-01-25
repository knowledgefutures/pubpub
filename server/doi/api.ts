import { Release } from 'server/models';
import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';
import { parentToSupplementNeedsDoiError } from 'utils/crossref/createDeposit';
import xmlbuilder from 'xmlbuilder';
import { getPermissions } from './permissions';
import { generateDoi, getDoiData, setDoiData } from './queries';

const assertUserAuthorized = async (target, requestIds) => {
	const permissions = await getPermissions(requestIds);
	const isAuthenticated =
		(target === 'pub' && permissions.pub) ||
		(target === 'collection' && permissions.collection);

	if (!isAuthenticated) {
		throw new ForbiddenError();
	}
};

const pubExistsAndIsMissingReleases = async (pubId) => {
	if (!pubId) {
		return false;
	}
	const releases = await Release.findAll({ where: { pubId } });
	return releases.length === 0;
};

const previewOrDepositDoi = async (user, body, options = { deposit: false }) => {
	const { deposit } = options;
	const {
		target,
		communityId,
		collectionId,
		pubId,
		contentVersion,
		reviewType,
		reviewRecommendation,
	} = body;
	const requestIds = {
		userId: user.id,
		communityId,
		collectionId: collectionId || null,
		pubId: pubId || null,
	};

	await assertUserAuthorized(target, requestIds);

	if (pubId && (await pubExistsAndIsMissingReleases(pubId))) {
		throw new ForbiddenError();
	}

	const depositJson = await (deposit ? setDoiData : getDoiData)(
		{
			communityId,
			collectionId,
			pubId,
			contentVersion,
			reviewType,
			reviewRecommendation,
		},
		target,
	);

	return depositJson;
};

app.post(
	'/api/doi',
	wrap(async (req, res) => {
		try {
			const depositJson = await previewOrDepositDoi(req.user || {}, req.body, {
				deposit: true,
			});
			return res.status(201).json(depositJson);
		} catch (err) {
			if (err === parentToSupplementNeedsDoiError) {
				return res.status(400).json({
					error: parentToSupplementNeedsDoiError.message,
				});
			}
			throw err;
		}
	}),
);

app.get(
	'/api/doiPreview',
	wrap(async (req, res) => {
		try {
			const depositJson = await previewOrDepositDoi(req.user || {}, req.query);
			const depositXml = xmlbuilder
				.create(depositJson, { headless: true })
				.end({ pretty: true });

			return res.status(200).json({
				depositJson,
				depositXml,
			});
		} catch (err) {
			if (err === parentToSupplementNeedsDoiError) {
				return res.status(400).json({ error: parentToSupplementNeedsDoiError.message });
			}
			throw err;
		}
	}),
);

app.get(
	'/api/generateDoi',
	wrap(async (req, res) => {
		const user = req.user || {};
		const { communityId, collectionId, pubId, target } = req.query;
		const requestIds = {
			userId: user.id,
			communityId,
			collectionId: collectionId || null,
			pubId: pubId || null,
		};

		await assertUserAuthorized(target, requestIds);

		return res.status(200).json({
			dois: await generateDoi({ communityId, collectionId, pubId }, target),
		});
	}),
);
