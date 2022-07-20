import { UserDismissable } from 'server/models';
import { UserDismissableKey } from 'utils/userDismissable';

export const getDismissedUserDismissables = async (
	userId: null | string,
): Promise<Partial<Record<UserDismissableKey, true>>> => {
	if (userId) {
		const dismissables = await UserDismissable.findAll({ where: { userId } });
		const keys = dismissables.map((d) => d.key);
		return keys.reduce((record, key) => ({ ...record, [key]: true }), {});
	}
	return {};
};

export const dismissUserDismissable = async (userId: string, key: UserDismissableKey) => {
	const exists = await UserDismissable.findOne({ where: { userId, key } });
	if (!exists) {
		await UserDismissable.create({ userId, key });
	}
};
