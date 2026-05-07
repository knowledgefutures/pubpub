import { Router } from 'express';

import { getKfSdk } from 'server/kfAuth';
import { wrap } from 'server/wrap';
import { isDevelopment } from 'utils/environment';
import { sleep } from 'utils/promises';

export const router = Router();

router.post(
	'/api/password-reset',
	wrap(async (req, res) => {
		try {
			const kf = getKfSdk();
			const redirectTo = isDevelopment()
				? `http://localhost:9876/password-reset`
				: `https://${req.hostname}/password-reset`;

			await kf.forgetPassword({
				email: req.body.email,
				redirectTo,
			});

			return res.status(200).json('success');
		} catch (_err: any) {
			// do not leak user information, always return success
			await sleep(1000 + Math.random() * 1000);
			return res.status(200).json('success');
		}
	}),
);

router.put(
	'/api/password-reset',
	wrap(async (req, res) => {
		try {
			const kf = getKfSdk();

			const result = await kf.resetPassword({
				newPassword: req.body.password,
				token: req.body.token,
			});

			if (result.error) {
				return res.status(400).json(result.error.message);
			}

			return res.status(200).json('success');
		} catch (err: any) {
			console.error('Error in putPasswordReset:', err);
			return res.status(500).json(err.message);
		}
	}),
);
