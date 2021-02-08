import { addWorkerTask } from 'server/utils/workers';

const generateTask = (type, input) => addWorkerTask({ type, input });

export const deletePageSearchData = (pageId) => {
	generateTask('deletePageSearchData', pageId);
};

export const setPageSearchData = (pageId) => {
	generateTask('setPageSearchData', pageId);
};

export const deletePubSearchData = (pubId) => {
	generateTask('deletePubSearchData', pubId);
};

export const setPubSearchData = (pubId) => {
	generateTask('setPubSearchData', pubId);
};

export const updateCommunityData = (communityId) => {
	generateTask('updateCommunityData', communityId);
};

export const updateUserData = (userId) => {
	generateTask('updateUserData', userId);
};
