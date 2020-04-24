import { PubAttribution, User } from '../models';
import { attributesPublicUser } from '../utils/attributesPublicUser';

export const createPubAttribution = (inputValues) => {
	return PubAttribution.create({
		userId: inputValues.userId,
		pubId: inputValues.pubId,
		name: inputValues.name,
		order: inputValues.order,
	})
		.then((newAttribution) => {
			return PubAttribution.findOne({
				where: { id: newAttribution.id },
				attributes: { exclude: ['updatedAt'] },
				include: [
					{ model: User, as: 'user', required: false, attributes: attributesPublicUser },
				],
			});
		})
		.then((populatedPubAttribution) => {
			if (populatedPubAttribution.user) {
				return populatedPubAttribution.toJSON();
			}
			return {
				...populatedPubAttribution.toJSON(),
				user: {
					id: populatedPubAttribution.id,
					initials: populatedPubAttribution.name[0],
					fullName: populatedPubAttribution.name,
					firstName: populatedPubAttribution.name.split(' ')[0],
					lastName: populatedPubAttribution.name
						.split(' ')
						.slice(1, populatedPubAttribution.name.split(' ').length)
						.join(' '),
					avatar: populatedPubAttribution.avatar,
					title: populatedPubAttribution.title,
				},
			};
		});
};

export const updatePubAttribution = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	return PubAttribution.update(filteredValues, {
		where: { id: inputValues.pubAttributionId },
	}).then(() => {
		return filteredValues;
	});
};

export const destroyPubAttribution = (inputValues) => {
	return PubAttribution.destroy({
		where: { id: inputValues.pubAttributionId },
	});
};
