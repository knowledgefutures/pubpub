import { ThreadComment, includeUserModel } from 'server/models';

const findThreadCommentWithUser = (id) =>
	ThreadComment.findOne({
		where: { id: id },
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ as: string; }' is not assignab... Remove this comment to see the full error message
		include: [includeUserModel({ as: 'author' })],
	});

export const createThreadComment = async (inputValues, user) => {
	const newThreadComment = await ThreadComment.create({
		text: inputValues.text,
		content: inputValues.content,
		userId: user.id,
		threadId: inputValues.threadId,
	});

	const threadCommentWithUser = await findThreadCommentWithUser(newThreadComment.id);
	return threadCommentWithUser;
};

export const updateThreadComment = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});
	return ThreadComment.update(filteredValues, {
		where: { id: inputValues.threadCommentId },
	}).then(() => {
		return {
			...filteredValues,
			id: inputValues.threadCommentId,
		};
	});
};
