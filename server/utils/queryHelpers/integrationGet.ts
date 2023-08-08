import { User, ZoteroIntegration } from 'server/models';
import { expect } from 'utils/assert';

export default async (userId: string) => {
	const user = expect(
		await User.findOne({
			where: { id: userId },
			include: { model: ZoteroIntegration, required: false },
		}),
	);
	// include more integrations as they are added to the user
	const { zoteroIntegration } = user.toJSON();
	return [...(zoteroIntegration ? [{ name: 'zotero', ...zoteroIntegration }] : [])];
};
