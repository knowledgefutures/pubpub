import { Op } from 'sequelize';
import { promisify } from 'util';

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
				firstName,
				lastName,
				fullName,
				initials,
				email,
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

			const userRegister = promisify(User.register.bind(User));
			return userRegister(newUser, inputValues.password);
		})
		.then(() => {
			if (inputValues.subscribed) {
				subscribeUser(inputValues.email, 'be26e45660', ['Users']);
			}
			return Signup.update(
				{ completed: true },
				{
					where: { email, hash: inputValues.hash, completed: false },
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
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'slug' does not exist on type '{}'.
	if (filteredValues.slug) {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'slug' does not exist on type '{}'.
		filteredValues.slug = slugifyString(filteredValues.slug);
	}
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'firstName' does not exist on type '{}'.
	if (filteredValues.firstName) {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'firstName' does not exist on type '{}'.
		filteredValues.firstName = filteredValues.firstName.trim();
	}
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'lastName' does not exist on type '{}'.
	if (filteredValues.lastName) {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'lastName' does not exist on type '{}'.
		filteredValues.lastName = filteredValues.lastName.trim();
	}

	// @ts-expect-error ts-migrate(2339) FIXME: Property 'firstName' does not exist on type '{}'.
	if (filteredValues.firstName && filteredValues.lastName) {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'fullName' does not exist on type '{}'.
		filteredValues.fullName = `${filteredValues.firstName} ${filteredValues.lastName}`;
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'initials' does not exist on type '{}'.
		filteredValues.initials = `${filteredValues.firstName[0]}${filteredValues.lastName[0]}`;
	}

	return User.update(filteredValues, {
		where: { id: inputValues.userId },
	}).then(() => {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'fullName' does not exist on type '{}'.
		if (req.user.fullName !== filteredValues.fullName) {
			updateUserData(req.user.id);
		}
		return filteredValues;
	});
};
