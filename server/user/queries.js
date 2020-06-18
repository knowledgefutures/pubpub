import { Op } from 'sequelize';
import Promise from 'bluebird';

import { User, Signup } from 'server/models';
import { slugifyString } from 'utils/strings';
import { subscribeUser } from 'server/utils/mailchimp';
import { updateUserData } from 'server/utils/search';

export const createUser = (inputValues) => {
	const email = inputValues.email.toLowerCase().trim();
	const firstName = inputValues.firstName.trim();
	const lastName = inputValues.lastName.trim();
	const fullName = `${firstName} ${lastName}`;
	const initials = `${firstName[0]}${lastName[0]}`;
	const newSlug = slugifyString(fullName);
	return User.count({
		where: {
			slug: { [Op.iLike]: `${newSlug}%` },
		},
	})
		.then((existingSlugCount) => {
			const newUser = {
				slug: `${newSlug}${existingSlugCount ? `-${existingSlugCount + 1}` : ''}`,
				firstName: firstName,
				lastName: lastName,
				fullName: fullName,
				initials: initials,
				email: email,
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
				passwordDigest: 'sha512',
			};

			const userRegister = Promise.promisify(User.register, { context: User });
			return userRegister(newUser, inputValues.password);
		})
		.then(() => {
			if (inputValues.subscribed) {
				subscribeUser(inputValues.email, 'be26e45660', ['Users']);
			}
			return Signup.update(
				{ completed: true },
				{
					where: { email: email, hash: inputValues.hash, completed: false },
				},
			);
		});
};

export const updateUser = (inputValues, updatePermissions, req) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
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

	return User.update(filteredValues, {
		where: { id: inputValues.userId },
	}).then(() => {
		if (req.user.fullName !== filteredValues.fullName) {
			updateUserData(req.user.id);
		}
		return filteredValues;
	});
};
