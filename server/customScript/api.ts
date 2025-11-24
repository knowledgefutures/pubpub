import type { CustomScriptType } from 'types';

import { Router } from 'express';

import { ForbiddenError } from 'server/utils/errors';
import { wrap } from 'server/wrap';

import { canSetCustomScript } from './permissions';
import { setCustomScriptForCommunity } from './queries';

export const router = Router();

const getRequestIds = (
	req: any,
): { userId: string; communityId: string; content: string; type: CustomScriptType } => {
	const {
		user,
		body: { communityId, content, type },
	} = req;
	return {
		userId: user?.id,
		communityId,
		content,
		type,
	};
};

router.post(
	'/api/customScripts',
	wrap(async (req, res) => {
		const { communityId, userId, content, type } = getRequestIds(req);
		if (await canSetCustomScript({ communityId, userId, type })) {
			await setCustomScriptForCommunity(communityId, type, content);
			return res.status(200).json({});
		}
		throw new ForbiddenError();
	}),
);
