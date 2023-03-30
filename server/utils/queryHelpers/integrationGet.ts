import { User, ZoteroIntegration } from 'server/models';

export default async (userId) => {
	const user = await User.findOne({
		where: { id: userId },
		include: { model: ZoteroIntegration, required: false },
	});
	// include more integrations as they are added to the user
	const { zoteroIntegration } = user.toJSON();
	return [...(zoteroIntegration ? [{ name: 'zotero', ...zoteroIntegration }] : [])];
};
