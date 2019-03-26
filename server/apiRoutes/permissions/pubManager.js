/**
 * Helper to retrieve a PubManager from a pubId and userId
 */
import { PubManager } from '../../models';

// eslint-disable-next-line import/prefer-default-export
export const pubManagerFor = ({ userId, pubId }) =>
	new Promise((resolve, reject) => {
		PubManager.findOne({
			where: {
				pubId: pubId,
				userId: userId,
			},
		}).then((pubManager) => {
			if (pubManager) {
				resolve(pubManager);
			} else {
				reject();
			}
		});
	});
