import { Router } from 'express';

import { getAltchaHmacKey } from 'server/utils/captcha';

export const router = Router();

const MAX_NUMBER = 100000;

router.get('/api/captcha/challenge', async (_req, res) => {
	try {
		const hmacKey = getAltchaHmacKey();
		const { createChallenge } = await import('altcha-lib');
		const challenge = await createChallenge({
			hmacKey,
			maxNumber: MAX_NUMBER,
		});
		// never store this
		res.setHeader('Cache-Control', 'no-store');
		return res.status(200).json(challenge);
	} catch (err) {
		console.error('[captcha] challenge generation failed:', err);
		return res.status(503).json({ error: 'Challenge generation failed' });
	}
});
