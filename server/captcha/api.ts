import { createChallenge } from 'altcha-lib';
import { Router } from 'express';

import { getAltchaHmacKey } from 'server/utils/captcha';

export const router = Router();

const MAX_NUMBER = 100000;

router.get('/api/captcha/challenge', async (_req, res) => {
	const hmacKey = getAltchaHmacKey();
	const challenge = await createChallenge({
		hmacKey,
		maxNumber: MAX_NUMBER,
	});
	// never store this
	res.setHeader('Cache-Control', 'no-store');
	return res.status(200).json(challenge);
});
