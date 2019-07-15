import app from '../server';
import { getBranchDoc } from '../utils/firebaseAdmin';
import { Branch, BranchPermission, User, CommunityAdmin, PubManager } from '../models';
import { getBranchAccess } from '../branch/permissions';

app.get('/api/pubHistory', async (req, res) => {
	try {
		const { branchId, pubId, communityId, accessHash, historyKey } = req.query;
		const { id: userId } = req.user || {};
		const branch = await Branch.findOne({
			where: { id: branchId },
			include: [
				{
					model: BranchPermission,
					as: 'permissions',
					separate: true,
					required: false,
					include: [
						{
							model: User,
							as: 'user',
							attributes: ['id'],
						},
					],
				},
			],
		});
		const [communityAdmin, pubManager] = await Promise.all([
			userId &&
				CommunityAdmin.findOne({ where: { userId: userId, communityId: communityId } }),
			userId &&
				PubManager.findOne({
					where: {
						pubId: pubId,
						userId: userId,
					},
				}),
		]);
		const { canView } = getBranchAccess(
			accessHash,
			branch,
			userId,
			!!communityAdmin,
			!!pubManager,
		);
		if (canView) {
			const branchInfo = await getBranchDoc(pubId, branchId, historyKey);
			return res.status(200).json(branchInfo);
		}
		return res.status(403).json({});
	} catch (error) {
		return res.status(500).json({ error: error });
	}
});
