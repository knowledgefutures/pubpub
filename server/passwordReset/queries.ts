import Promise from 'bluebird';

import { User } from 'server/models';
import { generateHash } from 'utils/hashes';
import { sendPasswordResetEmail } from 'server/utils/email';

export const createPasswordReset = (inputValues, user, hostname) => {
	const email = inputValues.email;

	return User.findOne({
		where: email ? { email: email } : { id: user.id },
	})
		.then((userData) => {
			if (!userData) {
				throw new Error("User doesn't exist");
			}

			const updateData = {
				resetHash: generateHash(),
				resetHashExpiration: Date.now() + 1000 * 60 * 60 * 24, // Expires in 24 hours.
			};
			return User.update(updateData, {
				where: { id: userData.id },
				returning: true,
				individualHooks: true,
			});
		})
		.then((updatedUserData) => {
			const updatedUser = updatedUserData[1][0];
			return sendPasswordResetEmail({
				toEmail: updatedUser.email,
				resetUrl: `https://${hostname}/password-reset/${updatedUser.resetHash}/${updatedUser.slug}`,
			});
		});
};

export const updatePasswordReset = (inputValues, user) => {
	const resetHash = inputValues.resetHash;
	const slug = inputValues.slug;
	const currentTime = Date.now();

	const whereQuery = user.id ? { id: user.id } : { resetHash: resetHash, slug: slug };

	return User.findOne({
		where: whereQuery,
	})
		.then((userData) => {
			if (!userData) {
				throw new Error("User doesn't exist");
			}
			if (!user.id && resetHash && userData.resetHashExpiration < currentTime) {
				throw new Error('Hash is expired');
			}

			/* Promisify the setPassword function, and use .update to match API convention */
			const setPassword = Promise.promisify(userData.setPassword, { context: userData });
			return setPassword(inputValues.password);
		})
		.then((passwordResetData) => {
			const updateData = {
				hash: passwordResetData.dataValues.hash,
				salt: passwordResetData.dataValues.salt,
				resetHash: '',
				resetHashExpiration: currentTime,
				passwordDigest: 'sha512',
			};
			return User.update(updateData, {
				where: whereQuery,
			});
		});
};
