import { Router } from 'express';

import { getKfSdk } from 'server/kfAuth';
import { User } from 'server/models';
import { verifyCaptchaPayload } from 'server/utils/captcha';
import { isHoneypotFilled } from 'server/utils/honeypot';

export const router = Router();

router.post('/api/signup', async (req, res) => {
	if (isHoneypotFilled(req.body)) {
		return res.status(201).json(true);
	}

	const ok = await verifyCaptchaPayload(req.body.altcha);

	if (!ok) {
		return res.status(400).json('Please complete the verification and try again.');
	}

	const email = req.body.email?.toLowerCase().trim();

	if (!email) {
		return res.status(400).json('Email is required.');
	}

	// check for existing pubpub user
	const existingUser = await User.findOne({ where: { email } });

	if (existingUser) {
		return res.status(409).json('Email already used');
	}

	try {
		const kf = getKfSdk();

		const callbackURL = `https://${req.hostname}/user/create`;

		const result = await kf.signUp.email({
			email,
			password: req.body.password,
			name: req.body.name || email.split('@')[0],
			callbackURL,
		});

		if (result.error) {
			console.error('kf-auth signup error:', result.error);
			return res.status(500).json('Failed to create account. Please try again.');
		}

		return res.status(201).json(true);
	} catch (err: any) {
		console.error('Error in postSignup:', err);
		return res.status(500).json(err.message);
	}
});
