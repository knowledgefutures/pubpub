import { Router } from 'express';
import xmlbuilder from 'xmlbuilder';

import { Release } from 'server/models';
import { ForbiddenError } from 'server/utils/errors';
import { wrap } from 'server/wrap';
import { parentToSupplementNeedsDoiError } from 'utils/crossref/createDeposit';

import { getPermissions } from './permissions';
import { generateDoi, getDoiData, setDoiData } from './queries';
import { validatePubRelationshipsForDeposit } from './validate';

export const router = Router();

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

router.post(
	'/api/doi',
	wrap(async (req, res) => {
		try {
			const { pubId } = req.body;

			// validate relationships before depositing to prevent cascading failures
			if (pubId) {
				const issues = await validatePubRelationshipsForDeposit(pubId);
				// all issue types are blocking for deposits
				if (issues.length > 0) {
					const errorMessages = issues.map((issue) => {
						switch (issue.type) {
							case 'internal_not_deposited':
								return `"${issue.targetTitle}" must be deposited to Crossref first`;
							case 'external_doi_not_crossref_registrar':
								return `DOI ${issue.targetDoi} for "${issue.targetTitle}" is not a Crossref DOI. Peer reviews can only link to Crossref DOIs.`;
							case 'external_doi_not_in_crossref':
								return `DOI ${issue.targetDoi} for "${issue.targetTitle}" was not found in Crossref`;
							case 'external_url_no_doi_found':
								return `Could not find a DOI for "${issue.targetTitle}". Please add a DOI manually to the connection.`;
							default:
								return `Validation error for "${issue.targetTitle}"`;
						}
					});
					return res.status(400).json({
						error: `Cannot deposit: ${errorMessages.join('; ')}`,
						validationIssues: issues,
					});
				}
			}

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

router.get(
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

router.get(
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

router.get(
	'/api/doi/validate',
	wrap(async (req, res) => {
		const user = req.user || {};
		const { communityId, pubId } = req.query;
		const requestIds = {
			userId: user.id,
			communityId,
			pubId: pubId || null,
			collectionId: null,
		};

		await assertUserAuthorized('pub', requestIds);

		if (!pubId || typeof pubId !== 'string') {
			return res.status(400).json({ error: 'pubId is required' });
		}

		const issues = await validatePubRelationshipsForDeposit(pubId);
		return res.status(200).json({ issues });
	}),
);
