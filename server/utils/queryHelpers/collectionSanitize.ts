import { Collection } from 'server/models';
import { InitialData } from 'types';

export default (collection: Collection, initialData: InitialData) => {
	/* Collections are included in all communityData in initialData */
	/* communitySanitize implements collection filtering, so this */
	/* function simply needs to check if that collection exists */
	/* within initialData.communityData */
	const hasAccess = initialData.communityData.collections.some((cl) => {
		return cl.id === collection.id;
	});
	return hasAccess ? collection : null;
};
