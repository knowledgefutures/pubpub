import { sanitizeOnVisibility } from './util';

const isAuthorSpam = (author: { spamTag?: { status?: string } } | null) => {
	return author?.spamTag?.status === 'confirmed-spam';
};

export default (discussions, activePermissions, loginId) => {
	const { canAdmin } = activePermissions;
	const afterVisibility = sanitizeOnVisibility(discussions, activePermissions, loginId);

	return afterVisibility
		.filter((discussion) => {
			if (!isAuthorSpam(discussion.author)) {
				return true;
			}
			return canAdmin;
		})
		.map((discussion) => {
			const discussionAuthorSpam = isAuthorSpam(discussion.author);
			const comments = (discussion.thread?.comments ?? [])
				.filter((comment) => {
					if (!isAuthorSpam(comment.author)) {
						return true;
					}
					return canAdmin;
				})
				.map((comment) => {
					const commentAuthorSpam = isAuthorSpam(comment.author);
					if (!commentAuthorSpam) {
						return comment;
					}
					return { ...comment, isAuthorSpam: true };
				});

			return {
				...discussion,
				...(discussionAuthorSpam && { isAuthorSpam: true }),
				thread: {
					...discussion.thread,
					comments,
				},
			};
		});
};
