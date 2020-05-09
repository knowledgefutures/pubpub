import uuid from 'uuid';
import SHA3 from 'crypto-js/sha3';
import encHex from 'crypto-js/enc-hex';

import { Branch, Community, Member, Pub, Release, User } from '../../server/models';
import { createPub } from '../../server/pub/queries';
import { createCollection } from '../../server/collection/queries';

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
	} = args;
	const sha3hashedPassword = SHA3(password).toString(encHex);
	return new Promise((resolve, reject) =>
		User.register(
			{
				firstName: firstName,
				lastName: lastName,
				fullName: fullName,
				email: email,
				slug: slug,
				initials: initials,
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
	const unique = uuid.v4();
	return Community.create({
		title: 'Community ' + unique,
		subdomain: unique,
		navigation: [],
		...args,
	});
};

builders.Pub = async (args) => {
	const pubCreator = await builders.User();
	const { id: pubId } = await createPub(args, pubCreator.id);
	return Pub.findOne({ where: { id: pubId }, include: [{ model: Branch, as: 'branches' }] });
};

builders.Collection = ({ title = 'Collection ' + uuid.v4(), kind = 'issue', ...restArgs }) =>
	createCollection({ title: title, kind: kind, ...restArgs });

builders.Member = async ({ pubId, collectionId, communityId, ...restArgs }) => {
	const getTargetArgs = () => {
		// All of the enclosing scope IDs will be passed in, but we only want to associate a Member
		// with exactly one of a pub, collection, or community -- here, the least powerful scope.
		switch (true) {
			case !!pubId:
				return { pubId: pubId };
			case !!collectionId:
				return { collectionId: collectionId };
			case !!communityId:
				return { communityId: communityId };
			default:
				return {};
		}
	};

	return Member.create({ ...getTargetArgs(), ...restArgs });
};

builders.Release = (args) => {
	// The Release model requires these, but it doesn't currently associate them, so it's safe
	// to create random UUIDs for testing purposes.
	const { userId = uuid.v4(), branchId = uuid.v4(), ...restArgs } = args;
	return Release.create({ userId: userId, branchId: branchId, ...restArgs });
};

export { builders };
