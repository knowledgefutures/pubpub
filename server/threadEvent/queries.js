import { ThreadEvent } from 'server/models';
import { attributesPublicUser } from 'server/utils/queryHelpers/includeUserModel';

export const createThreadEvent = (inputValues, userData) => {
	return ThreadEvent.create({
		type: inputValues.type,
		data: inputValues.data,
		userId: userData.id,
		threadId: inputValues.threadId,
	}).then((newThreadEvent) => {
		/* Populate user data so it can be inserted into */
		/* existing pubData client-side */
		const cleanedUserData = {};
		attributesPublicUser.forEach((key) => {
			cleanedUserData[key] = userData[key];
		});
		return {
			...newThreadEvent.toJSON(),
			user: cleanedUserData,
		};
	});
};

export const updateThreadEvent = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	return ThreadEvent.update(filteredValues, {
		where: { id: inputValues.threadEventId },
	}).then(() => {
		return filteredValues;
	});
};

export const destroyThreadEvent = (inputValues) => {
	return ThreadEvent.destroy({
		where: { id: inputValues.threadEventId },
	});
};

/* Event helpers */
/* ------------- */
export const createCreatedThreadEvent = (userData, threadId) => {
	return createThreadEvent(
		{
			threadId: threadId,
			type: 'status',
			data: { statusChange: 'created' },
		},
		userData,
	);
};

export const createClosedThreadEvent = (userData, threadId) => {
	return createThreadEvent(
		{
			threadId: threadId,
			type: 'status',
			data: { statusChange: 'closed' },
		},
		userData,
	);
};

export const createCompletedThreadEvent = (userData, threadId) => {
	return createThreadEvent(
		{
			threadId: threadId,
			type: 'status',
			data: { statusChange: 'completed' },
		},
		userData,
	);
};

export const createMergedEvent = (userData, threadId) => {
	return createThreadEvent(
		{
			threadId: threadId,
			type: 'status',
			data: { statusChange: 'merged' },
		},
		userData,
	);
};

export const createReleasedEvent = (userData, threadId, pubSlug, releaseNumber) => {
	return createThreadEvent(
		{
			threadId: threadId,
			type: 'status',
			data: { statusChange: 'released', pubSlug: pubSlug, releaseNumber: releaseNumber },
		},
		userData,
	);
};
