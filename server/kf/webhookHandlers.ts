import { User } from 'server/models';
import { upsertSpamTag } from 'server/spamTag/userQueries';
import { deleteSessionsForUser } from 'server/utils/session';

export async function handleUserUpdated(data: any, res: any) {
	const { userId, givenName, familyName, displayName, email, image } = data;

	if (!userId) {
		return res.status(400).json({ error: 'userId is required' });
	}

	const user = await User.findOne({ where: { id: userId } });
	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	const updates: Record<string, any> = {};
	if (displayName !== undefined) updates.fullName = displayName;
	if (givenName !== undefined) updates.firstName = givenName;
	if (familyName !== undefined) updates.lastName = familyName;
	if (email !== undefined) updates.email = email.toLowerCase();
	if (image !== undefined) updates.avatar = image;

	if (givenName !== undefined || familyName !== undefined || displayName !== undefined) {
		const first = givenName ?? user.firstName ?? '';
		const last = familyName ?? user.lastName ?? '';
		if (first || last) {
			updates.initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
		}
	}

	if (Object.keys(updates).length > 0) {
		await user.update(updates);
	}

	return res.status(200).json({ ok: true });
}

export async function handleUserBanned(data: any, res: any) {
	const { userId, banReason } = data;

	if (!userId) {
		return res.status(400).json({ error: 'userId is required' });
	}

	const user = await User.findOne({ where: { id: userId } });
	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	await upsertSpamTag({
		userId,
		status: 'confirmed-spam',
		fields: {
			manuallyMarkedBy: [
				{
					userId: 'kf-auth',
					userName: banReason ? `KF Auth: ${banReason}` : 'KF Auth (external ban)',
					at: new Date().toISOString(),
				},
			],
		},
		skipKfAuthSync: true,
	});

	return res.status(200).json({ ok: true });
}

export async function handleUserUnbanned(data: any, res: any) {
	const { userId } = data;

	if (!userId) {
		return res.status(400).json({ error: 'userId is required' });
	}

	const user = await User.findOne({ where: { id: userId } });
	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	await upsertSpamTag({
		userId,
		status: 'confirmed-not-spam',
		skipKfAuthSync: true,
	});

	return res.status(200).json({ ok: true });
}

export async function handleUserSessionsRevoked(data: any, res: any) {
	const { userId } = data;

	if (!userId) {
		return res.status(400).json({ error: 'userId is required' });
	}

	const user = await User.findOne({ where: { id: userId } });
	if (!user) {
		return res.status(200).json({ ok: true, skipped: 'user not found' });
	}

	if (user.email) {
		await deleteSessionsForUser(user.email);
	}

	return res.status(200).json({ ok: true });
}
