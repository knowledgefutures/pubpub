import ensureUserForAttribution from 'utils/ensureUserForAttribution';
import { CollectionAttribution, includeUserModel } from 'server/models';
import { expect } from 'utils/assert';

export const createCollectionAttribution = async (inputValues: {
	userId?: string | null;
	collectionId: string;
	name: string;
	order: number;
	communityId?: string | null;
}) => {
	const newAttribution = await CollectionAttribution.create({
		userId: inputValues.userId,
		collectionId: inputValues.collectionId,
		name: inputValues.name,
		order: inputValues.order,
	});
	const populatedCollectionAttribution = expect(
		await CollectionAttribution.findOne({
			where: { id: newAttribution.id },
			attributes: { exclude: ['updatedAt'] },
			include: [includeUserModel({ required: false, as: 'user' })],
		}),
	);

	const populatedCollectionAttributionJson = populatedCollectionAttribution.toJSON();

	if (populatedCollectionAttribution.user) {
		return populatedCollectionAttributionJson;
	}
	return ensureUserForAttribution(populatedCollectionAttributionJson);
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
