import { ThreadComment, includeUserModel } from 'server/models';

const findThreadCommentWithUser = (id) =>
	ThreadComment.findOne({
		where: { id: id },
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
