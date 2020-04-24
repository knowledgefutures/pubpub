import app from '../server';
import { getBranchDoc } from '../utils/firebaseAdmin';

app.get('/api/pubHistory', async (req, res) => {
	try {
		const { branchId, pubId, historyKey } = req.query;
		const canView = true;
		if (canView) {
			const branchInfo = await getBranchDoc(pubId, branchId, parseInt(historyKey, 10));
			return res.status(200).json(branchInfo);
		}
		return res.status(403).json({});
	} catch (error) {
		return res.status(500).json({ error: error });
	}
});
