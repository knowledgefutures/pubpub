import { addWorkerTask } from 'server/utils/workers';
import { WorkerTask } from 'server/models';

const generateTask = (type, input) => {
	return WorkerTask.create({
		isProcessing: true,
		type: type,
		input: input,
	}).then((workerTaskData) => {
		const sendMessage = addWorkerTask(
			JSON.stringify({
				id: workerTaskData.id,
				type: workerTaskData.type,
				input: workerTaskData.input,
			}),
		);
		return sendMessage;
	});
};

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
