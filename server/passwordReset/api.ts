import type { User } from 'types';

import { Router } from 'express';

import { wrap } from 'server/wrap';
import { sleep } from 'utils/promises';

import { createPasswordReset, updatePasswordReset } from './queries';

export const router = Router();

router.post(
	'/api/password-reset',
	wrap(async (req, res) => {
		const user = req.user || {};
		try {
			await createPasswordReset(req.body, user as User, req.hostname);
			return res.status(200).json('success');
		} catch (err: any) {
			// do not leak user information
			if (err.message === "User doesn't exist") {
				// fake sleep to simulate delay
				await sleep(1000 + Math.random() * 1000);
				return res.status(200).json('success');
			}
			console.error('Error in postPasswordReset: ', err);
			return res.status(500).json(err.message);
		}
	}),
);

router.put(
	'/api/password-reset',
	wrap(async (req, res) => {
		const user = req.user || {};
		try {
			await updatePasswordReset(req.body, user as User);
			return res.status(200).json('success');
		} catch (err: any) {
			console.error('Error in putPasswordReset: ', err);
			return res.status(500).json(err.message);
		}
	}),
);
