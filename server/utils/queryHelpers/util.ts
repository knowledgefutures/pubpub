import {
	Thread,
	ThreadComment,
	ThreadEvent,
	Visibility,
	includeUserModel,
	Commenter,
} from 'server/models';

export const stripFalsyIdsFromQuery = (whereQueryObject) => {
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'fromEntries' does not exist on type 'Obj... Remove this comment to see the full error message
	return Object.fromEntries(Object.entries(whereQueryObject).filter((entry) => entry[1]));
};

export const ensureSerialized = (item) => {
	if (Array.isArray(item)) {
		return item.map(ensureSerialized);
	}
	if (item && typeof item === 'object') {
		if (typeof item.toJSON === 'function') {
			return item.toJSON();
		}
		const res = {};
		Object.keys(item).forEach((key) => {
			res[key] = ensureSerialized(item[key]);
		});
		return res;
	}
	return item;
};

export const sanitizeOnVisibility = (objectsWithVisibility, activePermissions, loginId) => {
	const { canView, canAdmin } = activePermissions;
	return objectsWithVisibility.filter((item) => {
		if (item.visibility.access === 'public') {
			return true;
		}
		if (item.visibility.access === 'members') {
			return canView;
		}
		if (item.visibility.access === 'private') {
			return (
				canAdmin ||
				item.visibility.users.find((user) => {
					return user.id === loginId;
				})
			);
		}
		return false;
	});
};

export const baseAuthor = [includeUserModel({ as: 'author' })];
export const baseThread = [
	{
		model: Thread,
		as: 'thread',
		include: [
			{
				model: ThreadComment,
				as: 'comments',
				include: [
					includeUserModel({ as: 'author' }),
					{ model: Commenter, as: 'commenter' },
				],
			},
			{
				model: ThreadEvent,
				as: 'events',
				include: [includeUserModel({ as: 'user' })],
			},
		],
	},
];

export const baseVisibility = [
	{
		model: Visibility,
		as: 'visibility',
		include: [includeUserModel({ as: 'users' })],
	},
];
