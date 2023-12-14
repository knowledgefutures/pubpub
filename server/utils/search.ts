import { addWorkerTask } from 'server/utils/workers';

const generateTask = (type, input) => addWorkerTask({ type, input });

export const deletePageSearchData = (pageId: string) => {
	generateTask('deletePageSearchData', pageId);
};

export const setPageSearchData = (pageId: string) => {
	generateTask('setPageSearchData', pageId);
};

export const deletePubSearchData = (pubId: string) => {
	generateTask('deletePubSearchData', pubId);
};

export const setPubSearchData = (pubId: string) => {
	generateTask('setPubSearchData', pubId);
};

export const updateCommunityData = (communityId: string) => {
	generateTask('updateCommunityData', communityId);
};

export const updateUserData = (userId: string) => {
	generateTask('updateUserData', userId);
};
