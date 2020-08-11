import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';
import xmlbuilder from 'xmlbuilder';

import { getDoiData, setDoiData, generateDoi } from './queries';
import { parentToSupplementNeedsDoiError } from 'utils/crossref/createDeposit';
import { getPermissions } from './permissions';

const assertUserAuthenticated = async (target, requestIds) => {
	const permissions = await getPermissions(requestIds);
	const isAuthenticated =
		(target === 'pub' && permissions.pub) ||
		(target === 'collection' && permissions.collection);

	if (!isAuthenticated) {
		throw new ForbiddenError();
	}
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
		communityId: communityId,
		collectionId: collectionId || null,
		pubId: pubId || null,
	};

	await assertUserAuthenticated(target, requestIds);

	const depositJson = await (deposit ? setDoiData : getDoiData)(
		{
			communityId: communityId,
			collectionId: collectionId,
			pubId: pubId,
			contentVersion: contentVersion,
			reviewType: reviewType,
			reviewRecommendation: reviewRecommendation,
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
		} catch (e) {
			if (e === parentToSupplementNeedsDoiError) {
				return res.status(400).json({
					error: e.message,
				});
			}
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
				depositJson: depositJson,
				depositXml: depositXml,
			});
		} catch (e) {
			if (e === parentToSupplementNeedsDoiError) {
				return res.status(400).json({
					error: e.message,
				});
			}
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
			communityId: communityId,
			collectionId: collectionId || null,
			pubId: pubId || null,
		};

		await assertUserAuthenticated(target, requestIds);

		return res.status(200).json({
			dois: await generateDoi(
				{ communityId: communityId, collectionId: collectionId, pubId: pubId },
				target,
			),
		});
	}),
);
