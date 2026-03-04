import type { HoneypotContext, HoneypotTrigger } from 'types';

import { Community, Pub } from 'server/models';
import { contextFromUser, notify } from 'server/spamTag/notifications';
import { upsertSpamTag } from 'server/spamTag/userQueries';

export const isHoneypotFilled = (input: Record<string, unknown>): boolean => {
	const value = input._honeypot;
	if (value == null) return false;
	if (typeof value === 'string') return value.trim().length > 0;
	return true;
};

const resolveHoneypotContext = async (
	ctx?: HoneypotContext,
): Promise<HoneypotContext | undefined> => {
	if (!ctx) return undefined;
	const resolved = { ...ctx };
	if (ctx.communityId && !ctx.communitySubdomain) {
		const community = await Community.findByPk(ctx.communityId, { attributes: ['subdomain'] });
		if (community) resolved.communitySubdomain = community.subdomain;
	}
	if (ctx.pubId && !ctx.pubSlug) {
		const pub = await Pub.findByPk(ctx.pubId, { attributes: ['slug'] });
		if (pub) resolved.pubSlug = pub.slug;
	}
	delete resolved.communityId;
	delete resolved.pubId;
	return resolved;
};

export const handleHoneypotTriggered = async (
	userId: string | null,
	honeypot: HoneypotTrigger,
	value: string,
	context?: HoneypotContext,
): Promise<void> => {
	if (!userId) return;
	const resolved = await resolveHoneypotContext(context);
	const { user } = await upsertSpamTag({
		userId,
		fields: {
			honeypotTriggers: [
				{ honeypot, value, context: resolved, triggeredAt: new Date().toISOString() },
			],
		},
		status: 'confirmed-spam',
	});
	await notify('honeypot-ban', contextFromUser(user));
};
