import {
	Commenter,
	includeUserModel,
	Thread,
	ThreadComment,
	ThreadEvent,
	Visibility,
} from 'server/models';

export const stripFalsyIdsFromQuery = (whereQueryObject) => {
	return Object.fromEntries(Object.entries(whereQueryObject).filter((entry) => entry[1]));
};

export const ensureSerialized = (item: any) => {
	if (Array.isArray(item)) {
		return item.map(ensureSerialized) as any;
	}
	if (item && typeof item === 'object') {
		if ('toJSON' in item && typeof item.toJSON === 'function') {
			return item.toJSON();
		}
		const res = {};

		Object.keys(item).forEach((key) => {
			res[key] = ensureSerialized(item[key]);
		});
		return res as any;
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
