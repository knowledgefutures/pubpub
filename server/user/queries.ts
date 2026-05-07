import { type CreationAttributes, Op } from 'sequelize';

import { User } from 'server/models';
import { subscribeUser } from 'server/utils/mailchimp';
import { expect } from 'utils/assert';
import { ORCID_PATTERN } from 'utils/orcid';
import { slugifyString } from 'utils/strings';

type InputValues = CreationAttributes<User> & {
	subscribed?: boolean;
};

/**
 * completes a user's profile after signup. at this point the user already
 * exists in pubpub (created by the kf-auth webhook), so we update the
 * existing record with the profile fields.
 */
export const createUser = async (inputValues: InputValues) => {
	const email = inputValues.email.toLowerCase().trim();
	const firstName = inputValues.firstName.trim();
	const lastName = inputValues.lastName.trim();
	const fullName = `${firstName} ${lastName}`;
	const initials = `${firstName[0]}${lastName[0]}`;
	const newSlug = slugifyString(fullName);

	const existingUser = await User.findOne({ where: { email } });

	if (!existingUser) {
		throw new Error('User not found. Please complete signup first.');
	}

	const existingSlugCount = await User.count({
		where: {
			slug: { [Op.like]: `${newSlug}%` },
			id: { [Op.ne]: existingUser.id },
		},
	});

	await existingUser.update({
		slug: `${newSlug}${existingSlugCount ? `-${existingSlugCount + 1}` : ''}`,
		firstName,
		lastName,
		fullName,
		initials,
		avatar: inputValues.avatar,
		title: inputValues.title,
		bio: inputValues.bio,
		location: inputValues.location,
		website: inputValues.website,
		orcid: inputValues.orcid,
		github: inputValues.github,
		twitter: inputValues.twitter,
		facebook: inputValues.facebook,
		googleScholar: inputValues.googleScholar,
		gdprConsent: inputValues.gdprConsent,
	});

	if (inputValues.subscribed) {
		subscribeUser(email, 'be26e45660', ['Users']);
	}

	return existingUser;
};

export const getSuggestedEditsUserInfo = async (suggestionUserId: string) => {
	const user = expect(await User.findOne({ where: { id: suggestionUserId } }));
	const { fullName, initials, avatar } = user;
	return { fullName, initials, avatar };
};

export const updateUser = (
	inputValues: InputValues & { userId: string },
	updatePermissions,
	req,
) => {
	// Filter to only allow certain fields to be updated
	const filteredValues: Record<string, any> = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});
	if (filteredValues.slug) {
		filteredValues.slug = slugifyString(filteredValues.slug);
	}
	if (filteredValues.firstName) {
		filteredValues.firstName = filteredValues.firstName.trim();
	}
	if (filteredValues.lastName) {
		filteredValues.lastName = filteredValues.lastName.trim();
	}

	if (filteredValues.firstName && filteredValues.lastName) {
		filteredValues.fullName = `${filteredValues.firstName} ${filteredValues.lastName}`;
		filteredValues.initials = `${filteredValues.firstName[0]}${filteredValues.lastName[0]}`;
	}

	if (filteredValues.orcid && (filteredValues.orcid as string).match(ORCID_PATTERN) === null) {
		throw new Error('Invalid ORCID');
	}

	// A bit of extra paranoia
	delete filteredValues.isSuperAdmin;

	return User.update(filteredValues, {
		where: { id: inputValues.userId },
		individualHooks: true,
	}).then(() => filteredValues);
};

export const isUserSuperAdmin = async ({ userId }: { userId: undefined | null | string }) => {
	if (userId) {
		const user = expect(await User.findOne({ where: { id: userId } }));
		return user.isSuperAdmin;
	}
	return false;
};
