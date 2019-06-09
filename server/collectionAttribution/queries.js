import { CollectionAttribution, User } from '../models';
import { attributesPublicUser } from '../utils';

export const createCollectionAttribution = (inputValues) => {
	return CollectionAttribution.create({
		userId: inputValues.userId,
		collectionId: inputValues.collectionId,
		name: inputValues.name,
		order: inputValues.order,
	})
		.then((newAttribution) => {
			return CollectionAttribution.findOne({
				where: { id: newAttribution.id },
				attributes: { exclude: ['updatedAt'] },
				include: [
					{ model: User, as: 'user', required: false, attributes: attributesPublicUser },
				],
			});
		})
		.then((populatedCollectionAttribution) => {
			if (populatedCollectionAttribution.user) {
				return populatedCollectionAttribution.toJSON();
			}
			return {
				...populatedCollectionAttribution.toJSON(),
				user: {
					id: populatedCollectionAttribution.id,
					initials: populatedCollectionAttribution.name[0],
					fullName: populatedCollectionAttribution.name,
					firstName: populatedCollectionAttribution.name.split(' ')[0],
					lastName: populatedCollectionAttribution.name
						.split(' ')
						.slice(1, populatedCollectionAttribution.name.split(' ').length)
						.join(' '),
					avatar: populatedCollectionAttribution.avatar,
					title: populatedCollectionAttribution.title,
				},
			};
		});
};

export const updateCollectionAttribution = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	return CollectionAttribution.update(filteredValues, {
		where: { id: inputValues.collectionAttributionId },
	}).then(() => {
		return filteredValues;
	});
};

export const destroyCollectionAttribution = (inputValues) => {
	return CollectionAttribution.destroy({
		where: { id: inputValues.collectionAttributionId },
	});
};
