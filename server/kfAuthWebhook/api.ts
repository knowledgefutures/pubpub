import { createHmac, timingSafeEqual } from 'crypto';
import { Router } from 'express';

import { env } from 'server/env';
import { User } from 'server/models';

export const router = Router();

interface WebhookPayload {
	event: string;
	timestamp: string;
	data: {
		id: string;
		email: string;
		name?: string;
		image?: string;
		givenName?: string;
		familyName?: string;
		slug?: string;
	};
}

function verifySignature(body: string, signature: string, secret: string): boolean {
	const expected = createHmac('sha256', secret).update(body).digest('hex');

	if (expected.length !== signature.length) {
		return false;
	}

	return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function deriveInitials(firstName?: string, lastName?: string): string {
	const first = (firstName || '').trim().slice(0, 1).toUpperCase();
	const last = (lastName || '').trim().slice(0, 1).toUpperCase();

	return `${first}${last}` || '??';
}

function deriveFullName(firstName?: string, lastName?: string, name?: string): string {
	if (firstName && lastName) {
		return `${firstName} ${lastName}`;
	}

	return name || 'Unknown';
}

router.post('/api/webhooks/kf-auth', async (req, res) => {
	const secret = env.KF_AUTH_WEBHOOK_SECRET;
	console.log('secret', secret, 'body', req.body);

	if (!secret) {
		console.error('[kf-auth webhook] KF_AUTH_WEBHOOK_SECRET not configured');
		return res.status(500).json({ error: 'webhook secret not configured' });
	}

	const signature = req.headers['x-webhook-signature'] as string | undefined;

	if (!signature) {
		return res.status(401).json({ error: 'missing signature' });
	}

	const rawBody = JSON.stringify(req.body);
	const isValid = verifySignature(rawBody, signature, secret);

	if (!isValid) {
		return res.status(401).json({ error: 'invalid signature' });
	}

	const payload = req.body as WebhookPayload;
	const { event, data } = payload;

	try {
		if (event === 'user.created') {
			await handleUserCreated(data);
		} else if (event === 'user.updated') {
			await handleUserUpdated(data);
		}

		return res.status(200).json({ ok: true });
	} catch (err) {
		console.error(`[kf-auth webhook] error handling ${event}:`, err);
		return res.status(500).json({ error: 'internal error' });
	}
});

async function handleUserCreated(data: WebhookPayload['data']) {
	// check if we already have a user linked to this auth id
	const existingByAuthId = await User.findOne({ where: { authId: data.id } });

	if (existingByAuthId) {
		return;
	}

	// check if there's an existing user with this email we should link
	const existingByEmail = await User.findOne({ where: { email: data.email } });

	if (existingByEmail) {
		await existingByEmail.update({ authId: data.id });
		return;
	}

	const firstName = data.givenName || data.name?.split(' ')[0] || 'Unknown';
	const lastName = data.familyName || data.name?.split(' ').slice(1).join(' ') || '';
	const fullName = deriveFullName(firstName, lastName, data.name);
	const initials = deriveInitials(firstName, lastName);

	// generate a slug from the auth slug or the name
	const baseSlug =
		data.slug ||
		fullName
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '-')
			.replace(/-+/g, '-');
	const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

	await User.create({
		authId: data.id,
		firstName,
		lastName,
		fullName,
		initials,
		email: data.email,
		slug,
		avatar: data.image || null,
	});
}

async function handleUserUpdated(data: WebhookPayload['data']) {
	const user = await User.findOne({ where: { authId: data.id } });

	if (!user) {
		return;
	}

	const updates: Record<string, unknown> = {};

	if (data.email && data.email !== user.email) {
		updates.email = data.email;
	}

	if (data.givenName && data.givenName !== user.firstName) {
		updates.firstName = data.givenName;
	}

	if (data.familyName && data.familyName !== user.lastName) {
		updates.lastName = data.familyName;
	}

	if (data.image !== undefined && data.image !== user.avatar) {
		updates.avatar = data.image;
	}

	// recompute derived fields if name parts changed
	if (updates.firstName || updates.lastName) {
		const newFirst = (updates.firstName as string) || user.firstName;
		const newLast = (updates.lastName as string) || user.lastName;

		updates.fullName = deriveFullName(newFirst, newLast, data.name);
		updates.initials = deriveInitials(newFirst, newLast);
	}

	if (Object.keys(updates).length > 0) {
		await user.update(updates);
	}
}
