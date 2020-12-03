import { User } from 'server/models';

export const getAttributionAttributes = async (attributionDirective) => {
	if (typeof attributionDirective === 'string') {
		return { name: attributionDirective, isAuthor: true };
	}
	const { slug, userId: rawUserId, ...restAttrs } = attributionDirective;
	let userId = null;
	if (rawUserId) {
		userId = rawUserId;
	} else if (slug) {
		const user = await User.findOne({ where: { slug: slug } });
		if (user) {
			userId = user.id;
		}
	}
	return { isAuthor: true, userId: userId, ...restAttrs };
};

export const cloneWithKeys = (object, keys) => {
	const res = {};
	Object.entries(object).forEach(([key, value]) => {
		if (keys.includes(key) && value !== undefined) {
			res[key] = value;
		}
	});
	return res;
};
