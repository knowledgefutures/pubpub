

import { Community, DepositTarget } from 'server/models';
import { communityDoiOverrides } from 'utils/crossref/communities';

import { aes256Encrypt } from 'utils/crypto';

async function main() {
	const promises = [];
	for (const { communityIds, prefix, key } of communityDoiOverrides) {
		for (const communityId of communityIds) {
			const community = await Community.findByPk(communityId);
			if (!community) continue;
			const username = process.env[`${key}_DOI_LOGIN_ID`];
			const password = process.env[`${key}_DOI_LOGIN_PASSWORD`];
			const baseDepositTarget = {
				communityId,
				doiPrefix: prefix,
				service: 'crossref',
			};
			if (username && password) {
				const { encryptedText: encryptedPassword, initVec } = aes256Encrypt(
					password,
					process.env.AES_ENCRYPTION_KEY,
				);
				promises.push(
					DepositTarget.create({
						...baseDepositTarget,
						username,
						password: encryptedPassword,
						passwordInitVec: initVec,
					}),
				);
			} else {
				promises.push(DepositTarget.create(baseDepositTarget));
			}
		}
	}
	try {
		await Promise.all(promises);
	} catch (error) {
		console.error(error);
	}
}

main();
