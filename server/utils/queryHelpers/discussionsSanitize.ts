import type { DefinitelyHas, Discussion } from 'types';

import { sanitizeOnVisibility } from './util';

type AuthorWithModeration =
	| {
			spamTag?: { status?: string } | null;
			communityBans?: { status?: string }[];
	  }
	| null
	| undefined;

const isAuthorSpam = (author: AuthorWithModeration) => author?.spamTag?.status === 'confirmed-spam';

const isAuthorBanned = (author: AuthorWithModeration) => (author?.communityBans?.length ?? 0) > 0;

const isHidden = (author: AuthorWithModeration) => isAuthorSpam(author) || isAuthorBanned(author);

export default (
	discussions: DefinitelyHas<Discussion, 'visibility'>[],
	activePermissions: any,
	loginId: string | null,
) => {
	const { canAdmin } = activePermissions;
	const afterVisibility = sanitizeOnVisibility(discussions, activePermissions, loginId);

	return afterVisibility
		.filter((discussion) => !isHidden(discussion.author) || canAdmin)
		.map((discussion) => ({
			...discussion,
			thread: {
				...discussion.thread,
				comments: (discussion.thread?.comments ?? []).filter(
					(comment) => !isHidden(comment.author) || canAdmin,
				),
			},
		}));
};
