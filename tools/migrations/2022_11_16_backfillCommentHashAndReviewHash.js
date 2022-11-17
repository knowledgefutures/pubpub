import { Pub } from 'server/models';
import { generateHash } from 'utils/hashes';

import { forEachInstance } from './util';

export const up = async () => {
	await forEachInstance(
		Pub,
		async (pub) => {
			if (!pub.commentHash) {
				pub.commentHash = generateHash(8);
			}
			if (!pub.reviewHash) {
				pub.reviewHash = generateHash(8);
			}
			await pub.save();
		},
		200,
	);
};
