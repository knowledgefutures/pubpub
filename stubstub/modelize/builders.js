import uuid from 'uuid';
import SHA3 from 'crypto-js/sha3';
import encHex from 'crypto-js/enc-hex';

import { createCollectionPub } from 'server/collectionPub/queries';
import {
	ActivityItem,
	Community,
	Member,
	Release,
	SubmissionWorkflow,
	User,
	UserSubscription,
} from 'server/models';
import { createPub } from 'server/pub/queries';
import { createCollection } from 'server/collection/queries';
import { createDoc } from 'server/doc/queries';
import { createPage } from 'server/page/queries';
import { createCommunity } from 'server/community/queries';
import { getEmptyDoc } from 'client/components/Editor';

const builders = {};

builders.User = async (args = {}) => {
	const uniqueness = uuid.v4();
	const {
		firstName = 'Test',
		lastName = 'Testington',
		email = `testuser-${uniqueness}@email.su`,
		fullName = firstName + ' ' + lastName,
		slug = uniqueness,
		initials = firstName.slice(0, 1).toUpperCase() + lastName.slice(0, 1).toUpperCase(),
		password = 'password123',
		id,
	} = args;
	const sha3hashedPassword = SHA3(password).toString(encHex);
	return new Promise((resolve, reject) =>
		User.register(
			{
				...(id && { id }),
				firstName,
				lastName,
				fullName,
				email,
				slug,
				initials,
				passwordDigest: 'sha512',
			},
			sha3hashedPassword,
			(err, user) => {
				if (err) {
					return reject(err);
				}
				// eslint-disable-next-line no-param-reassign
				user.sha3hashedPassword = sha3hashedPassword;
				return resolve(user);
			},
		),
	);
};

builders.Community = async (args = {}) => {
	const { createFullCommunity, ...restArgs } = args;
	const unique = uuid.v4();
	const sharedArgs = {
		title: 'Community ' + unique,
		subdomain: unique,
		...restArgs,
	};
	if (createFullCommunity) {
		const admin = await builders.User();
		return createCommunity({ ...sharedArgs }, admin, false);
	}
	return Community.create({
		navigation: [],
		...sharedArgs,
	});
};

builders.Pub = async (args) => {
	const { createPubCreator = true, ...restArgs } = args;
	const pubCreator = createPubCreator && (await builders.User());
	return createPub(restArgs, pubCreator && pubCreator.id);
};

builders.Collection = ({ title = 'Collection ' + uuid.v4(), kind = 'issue', ...restArgs }) =>
	createCollection({ title, kind, ...restArgs });

builders.Page = createPage;

builders.Member = async ({ pubId, collectionId, communityId, ...restArgs }) => {
	const getTargetArgs = () => {
		// All of the enclosing scope IDs will be passed in, but we only want to associate a Member
		// with exactly one of a pub, collection, or community -- here, the least powerful scope.
		switch (true) {
			case !!pubId:
				return { pubId };
			case !!collectionId:
				return { collectionId };
			case !!communityId:
				return { communityId };
			default:
				return {};
		}
	};

	return Member.create({ ...getTargetArgs(), ...restArgs }, { hooks: false });
};

builders.Release = async (args) => {
	// The Release model requires these, but it doesn't currently associate them, so it's safe
	// to create random UUIDs for testing purposes.
	const { userId = uuid.v4(), historyKey = 0, docId = null, ...restArgs } = args;

	let resolvedDocId = docId;
	if (!resolvedDocId) {
		const fakeDoc = await createDoc({});
		resolvedDocId = fakeDoc.id;
	}

	return Release.create({
		userId,
		historyKey,
		docId: resolvedDocId,
		...restArgs,
	});
};

builders.CollectionPub = createCollectionPub;

builders.SubmissionWorkflow = (args) => {
	return SubmissionWorkflow.create({
		enabled: false,
		instructionsText: getEmptyDoc(),
		introText: getEmptyDoc(),
		receivedEmailText: getEmptyDoc(),
		acceptedText: getEmptyDoc(),
		declinedText: getEmptyDoc(),
		targetEmailAddresses: ['something@somewhere.com'],
		...args,
	});
};

builders.ActivityItem = (args) => {
	const { applyHooks = false, ...restArgs } = args;
	return ActivityItem.create({ ...restArgs }, { hooks: applyHooks });
};

builders.UserSubscription = (args) => {
	const modifiedArgs = { ...args };
	// Modelize will try to associate this with a Pub if it's nested inside...
	// but in the case where there's also an associated Thread, we don't want this
	if (modifiedArgs.threadId) {
		delete modifiedArgs.pubId;
	}
	return UserSubscription.create({ setAutomatically: false, status: 'active', ...modifiedArgs });
};

export { builders };
