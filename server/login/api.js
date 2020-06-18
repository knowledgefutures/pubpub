import Promise from 'bluebird';
import passport from 'passport';
import crypto from 'crypto';

import app from 'server/server';
import { User } from 'server/models';

app.post('/api/login', (req, res, next) => {
	const authenticate = new Promise((resolve, reject) => {
		passport.authenticate('local', (authErr, user) => {
			if (authErr) {
				return reject(authErr);
			}
			return resolve(user);
		})(req, res, next);
	});
	return authenticate
		.then((user) => {
			/* If authentication succeeded, we have a user */
			if (user) {
				return [user, null];
			}

			/* If authentication did not succeed, we need to check if a legacy hash is valid */
			const findUser = User.findOne({
				where: { email: req.body.email },
			});
			return Promise.all([null, findUser]);
		})
		.then(([user, userData]) => {
			if (user) {
				return [user, null];
			}

			/* If the login failed, and there is no
			userData, then the email doesn't exist */
			if (!userData) {
				throw new Error('Invalid email');
			}
			/* If the login failed, but the email exists, and the
			digest is already sha512, it's simply a wrong password */
			if (userData.passwordDigest === 'sha512') {
				throw new Error('Invalid password');
			}

			/* If the login failed, but the email exists, and the digest
			is not sha512, we need to check for valid legacy hashes */
			const pubpubSha1HashRaw = crypto.pbkdf2Sync(
				req.body.password,
				userData.salt,
				25000,
				512,
				'sha1',
			);
			const pubpubSha1Hash = Buffer.from(pubpubSha1HashRaw, 'binary').toString('hex');
			const isPubPubSha1Valid = pubpubSha1Hash === userData.hash;

			const frankenbookHashRaw = crypto.pbkdf2Sync(
				req.body.password,
				userData.salt,
				12000,
				512,
				'sha1',
			);
			const frankenbookHash = Buffer.from(frankenbookHashRaw, 'binary').toString('hex');
			const isfrankenbookValid = frankenbookHash === userData.hash;

			const isLegacyValid = isPubPubSha1Valid || isfrankenbookValid;
			if (!isLegacyValid) {
				throw new Error('Invalid password');
			}

			/* If isLegacyValid, we need to update user to sha512 */
			const setPassword = Promise.promisify(userData.setPassword, { context: userData });
			return Promise.all([null, setPassword(req.body.password)]);
		})
		.then(([user, setPasswordData]) => {
			if (user) {
				return [user, null];
			}

			const userUpdateData = {
				passwordDigest: 'sha512',
				hash: setPasswordData.hash,
				salt: setPasswordData.salt,
			};
			const updateUser = User.update(userUpdateData, {
				where: { email: req.body.email },
				returning: true,
			});
			return Promise.all([null, updateUser]);
		})
		.then(([user, updatedUserData]) => {
			if (user) {
				return user;
			}

			return updatedUserData[1][0];
		})
		.then((user) => {
			req.logIn(user, (err) => {
				if (err) {
					throw new Error(err);
				}
				return res.status(201).json('success');
			});
		})
		.catch((err) => {
			const unaunthenticatedValues = ['Invalid password', 'Invalid email'];
			if (unaunthenticatedValues.includes(err.message)) {
				return res.status(401).json('Login attempt failed');
			}
			return res.status(500).json(err.message);
		});
});
