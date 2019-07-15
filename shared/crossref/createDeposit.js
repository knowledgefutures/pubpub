/**
 * Code that builds a submission that we can send to Crossref. We build JSON here, and let that
 * get converted to equivalent XML downstream.
 */
import doiBatch from './schema/doiBatch';

import renderBook from './render/book';
import renderConference from './render/conference';
import renderJournal from './render/journal';
import createDoi from './createDoi';
import getCollectionDoi from '../collections/getCollectionDoi';

const renderBody = (context) => {
	const { collection } = context;
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

const getDois = (context, doiTarget) => {
	const { pub, collection, community } = context;
	const dois = {};
	dois.community = createDoi({ community: community });
	dois.pub =
		pub &&
		(doiTarget === 'pub'
			? createDoi({ community: community, collection: collection, target: pub })
			: pub.doi);
	dois.collection =
		collection &&
		(getCollectionDoi(collection) ||
			(doiTarget === 'collection' &&
				createDoi({ community: community, target: collection })));
	return dois;
};

export default (context, doiTarget, dateForTimestamp) => {
	checkDepositAssertions(context, doiTarget);
	const { community } = context;
	const timestamp = (dateForTimestamp || new Date()).getTime();
	const doiBatchId = `${timestamp}_${community.id.slice(0, 8)}`;
	const dois = getDois(context, doiTarget);
	const deposit = removeEmptyKeys(
		doiBatch({
			body: renderBody({
				...context,
				globals: {
					dois: dois,
					timestamp: timestamp,
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
