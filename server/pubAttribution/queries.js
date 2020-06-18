import { PubAttribution, User } from 'server/models';
import { attributesPublicUser } from 'server/utils/attributesPublicUser';
import ensureUserForAttribution from 'utils/ensureUserForAttribution';

export const getPubAttributions = (pubId) => PubAttribution.findAll({ where: { id: pubId } });

export const createPubAttribution = ({ userId, pubId, name, order, isAuthor }) => {
	return PubAttribution.create({
		userId: userId,
		pubId: pubId,
		name: name,
		order: order,
		isAuthor: isAuthor,
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
			const populatedPubAttributionJson = populatedPubAttribution.toJSON();
			if (populatedPubAttribution.user) {
				return populatedPubAttributionJson;
			}
			return ensureUserForAttribution(populatedPubAttributionJson);
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
