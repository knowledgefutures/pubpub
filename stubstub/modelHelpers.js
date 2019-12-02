import uuid from 'uuid';
import SHA3 from 'crypto-js/sha3';
import encHex from 'crypto-js/enc-hex';

import { Branch, Community, CommunityAdmin, User, Pub } from '../server/models';
import { createPub } from '../server/pub/queries';

export const makeUser = async (info = {}) => {
	const uniqueness = uuid.v4();
	const {
		firstName = 'Test',
		lastName = 'Testington',
		email = `testuser-${uniqueness}@email.su`,
		fullName = firstName + ' ' + lastName,
		slug = uniqueness,
		initials = firstName.slice(0, 1).toUpperCase() + lastName.slice(0, 1).toUpperCase(),
		password = 'password123',
	} = info;
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

export const makeCommunity = async (communityData, communityAdminInfo = {}) => {
	const unique = uuid.v4();
	const community = await Community.create({
		title: 'Community ' + unique,
		subdomain: unique,
		navigation: [],
		...communityData,
	});
	if (communityAdminInfo) {
		const user = await makeUser(communityAdminInfo);
		await CommunityAdmin.create({ userId: user.id, communityId: community.id });
		return {
			community: community,
			admin: user,
		};
	}
	return { community: community };
};

export const makePub = async (community, manager) => {
	if (!manager) {
		// eslint-disable-next-line no-param-reassign
		manager = await makeUser();
	}
	const { id: pubId } = await createPub({ communityId: community.id }, manager);
	return Pub.findOne({ where: { id: pubId }, include: [{ model: Branch, as: 'branches' }] });
};
