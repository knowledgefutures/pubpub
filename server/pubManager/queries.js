import { PubManager, User } from '../models';
import { attributesPublicUser } from '../utils/attributesPublicUser';
import { setPubSearchData } from '../utils/search';

export const createPubManager = (inputValues) => {
	return PubManager.create({
		userId: inputValues.userId,
		pubId: inputValues.pubId,
	})
		.then((newPubManager) => {
			const findNewPubManager = PubManager.findOne({
				where: { id: newPubManager.id },
				attributes: { exclude: ['updatedAt'] },
				include: [
					{
						model: User,
						as: 'user',
						attributes: attributesPublicUser,
					},
				],
			});
			return findNewPubManager;
		})
		.then((newPubManagerData) => {
			setPubSearchData(inputValues.pubId);
			return newPubManagerData;
		});
};

export const destroyPubManager = (inputValues) => {
	return PubManager.destroy({
		where: { id: inputValues.pubManagerId },
	}).then(() => {
		setPubSearchData(inputValues.pubId);
		return true;
	});
};
