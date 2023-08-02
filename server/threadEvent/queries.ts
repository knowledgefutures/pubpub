import { ThreadEvent, attributesPublicUser } from 'server/models';
import * as types from 'types';
import { ThreadEventPermissions } from './permissions';

export const createThreadEvent = async (
	inputValues: {
		threadId: string;
		type: string;
		data: Record<string, any>;
	},
	userData: types.User,
) => {
	const newThreadEvent = await ThreadEvent.create({
		type: inputValues.type,
		data: inputValues.data,
		userId: userData.id,
		threadId: inputValues.threadId,
	});
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
};

export const updateThreadEvent = async (
	inputValues: types.ThreadEvent & { threadEventId: string },
	updatePermissions: ThreadEventPermissions['update'],
) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		// @ts-expect-error FIXME: updatePermissions can only be `false`, this shouldn't be here
		if (updatePermissions && updatePermissions?.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	await ThreadEvent.update(filteredValues, {
		where: { id: inputValues.threadEventId },
	});
	return filteredValues;
};

export const destroyThreadEvent = (inputValues: { threadEventId: string }) => {
	return ThreadEvent.destroy({
		where: { id: inputValues.threadEventId },
	});
};

/* Event helpers */
/* ------------- */
export const createCreatedThreadEvent = (userData: types.User, threadId: string) => {
	return createThreadEvent(
		{
			threadId,
			type: 'status',
			data: { statusChange: 'created' },
		},
		userData,
	);
};

export const createClosedThreadEvent = (userData: types.User, threadId: string) => {
	return createThreadEvent(
		{
			threadId,
			type: 'status',
			data: { statusChange: 'closed' },
		},
		userData,
	);
};

export const createCompletedThreadEvent = (userData: types.User, threadId: string) => {
	return createThreadEvent(
		{
			threadId,
			type: 'status',
			data: { statusChange: 'completed' },
		},
		userData,
	);
};

export const createMergedEvent = (userData: types.User, threadId: string) => {
	return createThreadEvent(
		{
			threadId,
			type: 'status',
			data: { statusChange: 'merged' },
		},
		userData,
	);
};

export const createReleasedEvent = (
	userData: types.User,
	threadId: string,
	pubSlug: string,
	releaseId: string,
) => {
	return createThreadEvent(
		{
			threadId,
			type: 'status',
			data: { statusChange: 'released', pubSlug, releaseId },
		},
		userData,
	);
};
