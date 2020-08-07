import { RelationType, findParentEdgeByRelationTypes } from 'utils/pubEdge/relations';

/**
 * Code that builds a submission that we can send to Crossref. We build JSON here, and let that
 * get converted to equivalent XML downstream.
 */
import doiBatch from './schema/doiBatch';
import renderBook from './render/book';
import renderConference from './render/conference';
import renderJournal from './render/journal';
import renderReview from './render/review';
import renderPreprint from './render/preprint';
import renderSupplement from './render/supplement';
import createDoi, { createComponentDoi } from './createDoi';
import getCollectionDoi from '../collections/getCollectionDoi';

const renderBody = (context) => {
	const { collection, pub, pubEdge } = context;

	if (context.contentVersion === 'preprint') {
		return renderPreprint(context);
	}

	if (pubEdge) {
		const { relationType } = pubEdge;

		if (relationType === RelationType.Preprint) {
			return renderPreprint(context);
		}

		if (relationType === RelationType.Supplement) {
			return renderSupplement({
				...context,
				parentDoi:
					pub.id === pubEdge.targetPubId
						? // inbound edge, use parent pub doi
						  pubEdge.pub.doi
						: // outbound edge, use target pub doi
						  pubEdge.targetPub.doi,
			});
		}

		if (relationType === RelationType.Review || relationType === RelationType.Rejoinder) {
			return renderReview(context);
		}
	}

	if (collection) {
		if (collection.kind === 'book') {
			return renderBook(context);
		}
		if (collection.kind === 'conference') {
			return renderConference(context);
		}
	}

	return renderJournal(context);
};

const removeEmptyKeys = (obj) => {
	Object.keys(obj).forEach((key) => {
		if (obj[key] && typeof obj[key] === 'object') removeEmptyKeys(obj[key]);
		// eslint-disable-next-line no-param-reassign
		else if (obj[key] === undefined) delete obj[key];
	});
	return obj;
};

const checkDepositAssertions = (context, doiTarget) => {
	const { collection, collectionPub } = context;
	const allowableDoiTargets = ['pub', 'collection'];
	if (!allowableDoiTargets.includes(doiTarget)) {
		throw new Error(`doiTarget must be one of: ${allowableDoiTargets.join(', ')}`);
	}
	if (collectionPub) {
		if (!collection && collection.id !== collectionPub.id) {
			throw new Error(
				'Cannot provide a CollectionPub to createDeposit without also providing a matching collection.',
			);
		}
	}
};

const assertParentPubHasDoi = (parentPub) => {
	if (!parentPub.doi) {
		throw new Error('Parent Pub must have DOI when creating a DOI for a Supplement.');
	}

	return true;
};

const getPubDoiPart = (context, doiTarget) => {
	const { pub, collection, community, pubEdge } = context;

	let doi;

	if (doiTarget !== 'pub') {
		doi = pub.doi;
	} else {
		// Create component DOIs for supplementary material.
		if (pubEdge && pubEdge.relationType === RelationType.Supplement) {
			const parentPub = pubEdge.pubIsParent ? pubEdge.pub : pubEdge.targetPub;
			assertParentPubHasDoi(parentPub);
			doi = createComponentDoi(parentPub, pubEdge);
		} else {
			doi =
				pub.doi ||
				createDoi({
					community: community,
					collection: collection,
					target: pub,
					pubEdge: pubEdge,
				});
		}
	}

	return { pub: doi };
};

const getCollectionDoiPart = (context, doiTarget) => {
	const { collection, community } = context;
	const doi =
		collection &&
		(getCollectionDoi(collection) ||
			(doiTarget === 'collection' &&
				createDoi({ community: community, target: collection })));

	return {
		collection: doi,
	};
};

export const getDois = (context, doiTarget) => {
	const { community } = context;
	const dois = {
		community: createDoi({ community: community }),
		...getPubDoiPart(context, doiTarget),
		...getCollectionDoiPart(context, doiTarget),
	};

	return dois;
};

export default (context, doiTarget, dateForTimestamp) => {
	checkDepositAssertions(context, doiTarget);

	const { community, pub, contentVersion, reviewType, reviewRecommendation } = context;
	const timestamp = (dateForTimestamp || new Date()).getTime();
	const doiBatchId = `${timestamp}_${community.id.slice(0, 8)}`;

	let pubEdge;

	if (pub) {
		pubEdge = findParentEdgeByRelationTypes(pub, [
			RelationType.Preprint,
			RelationType.Supplement,
			RelationType.Review,
			RelationType.Rejoinder,
		]);
	}

	const contextWithPubEdge = { ...context, pubEdge: pubEdge };
	const dois = getDois(
		pubEdge && pubEdge.relationType === RelationType.Supplement ? contextWithPubEdge : context,
		doiTarget,
	);
	const deposit = removeEmptyKeys(
		doiBatch({
			body: renderBody({
				...contextWithPubEdge,
				globals: {
					dois: dois,
					timestamp: timestamp,
					contentVersion: contentVersion,
					reviewType: reviewType,
					reviewRecommendation: reviewRecommendation,
				},
			}),
			doiBatchId: doiBatchId,
			timestamp: timestamp,
		}),
	);
	return {
		deposit: deposit,
		dois: dois,
		timestamp: timestamp,
	};
};
