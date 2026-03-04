import { Router } from 'express';

import { verifyCaptchaPayload } from 'server/utils/captcha';
import { isHoneypotFilled } from 'server/utils/honeypot';

import { createSignup, DuplicateEmailError } from './queries';

export const router = Router();

router.post('/api/signup', async (req, res) => {
	if (isHoneypotFilled(req.body)) {
		return res.status(201).json(true);
	}
	const ok = await verifyCaptchaPayload(req.body.altcha);
	if (!ok) {
		return res.status(400).json('Please complete the verification and try again.');
	}
	const { _honeypot, altcha: _altcha, ...body } = req.body;
	return createSignup(body, req.hostname)
		.then(() => res.status(201).json(true))
		.catch((err) => {
			if (err instanceof DuplicateEmailError) {
				return res.status(409).json(err.message);
			}
			console.error('Error in postSignup: ', err);
			return res.status(500).json(err.message);
		});
});
