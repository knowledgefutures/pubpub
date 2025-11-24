import { Router } from 'express';
import passport from 'passport';
import { z } from 'zod';

import { BadRequestError, NotFoundError } from 'server/utils/errors';
import { wrap } from 'server/wrap';
import { getHashedUserId } from 'utils/caching/getHashedUserId';
import { isDuqDuq, isProd } from 'utils/environment';

import { getPermissions } from './permissions';
import { createUser, getSuggestedEditsUserInfo, updateUser } from './queries';

export const router = Router();

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		submittedUserId: req.body.userId,
		email: req.body.email ? req.body.email.toLowerCase().trim() : null,
		hash: req.body.hash || null,
	};
};

router.post('/api/users', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createUser(req.body);
		})
		.then((newUser) => {
			passport.authenticate('local')(req, res, () => {
				const hashedUserId = getHashedUserId(newUser);

				res.cookie('pp-lic', `pp-li-${hashedUserId}`, {
					...(isProd() &&
						req.hostname.indexOf('pubpub.org') > -1 && { domain: '.pubpub.org' }),
					...(isDuqDuq() &&
						req.hostname.indexOf('pubpub.org') > -1 && { domain: '.duqduq.org' }),
					maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days to match login cookies
				});
				return res.status(201).json(newUser);
			});
		})
		.catch((err) => {
			console.error('Error in postUser: ', err);
			return res.status(500).json(err.message);
		});
});

const uuidParser = z.string().uuid();

router.get(
	'/api/users/:id',
	wrap(async (req, res) => {
		const { id } = req.params;
		if (!id || !uuidParser.safeParse(id).success) {
			throw new BadRequestError();
		}

		const userInfo = await getSuggestedEditsUserInfo(id);
		if (!userInfo) {
			throw new NotFoundError();
		}

		return res.status(201).json(userInfo);
	}),
);

router.put('/api/users', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updateUser(req.body, permissions.update, req);
		})
		.then((updatedValues) => {
			return res.status(201).json(updatedValues);
		})
		.catch((err) => {
			console.error('Error in putUser: ', err);
			return res.status(500).json(err.message);
		});
});
