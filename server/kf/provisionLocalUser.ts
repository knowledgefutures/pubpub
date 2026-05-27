import type { OIDCUserInfo } from './oidc.server';

import { Op } from 'sequelize';

import { User } from 'server/models';
import { slugifyString } from 'utils/strings';

/**
 * Look up the local PubPub `User` row that corresponds to a kf-auth subject,
 * auto-creating it from kf-auth userinfo on first contact.
 *
 * Both the OIDC `/auth/callback` flow and the legacy `/api/login` SDK bridge
 * funnel users through here so the side effects (slug allocation, placeholder
 * email handling, console logging) stay identical.
 *
 * `kfUserId` must equal the `sub` claim from kf-auth's userinfo / JWT — PubPub
 * stores it verbatim as `User.id` since the migration kept UUIDs aligned.
 */
export async function provisionLocalUser(
	kfUserId: string,
	userInfo: Partial<
		Pick<OIDCUserInfo, 'name' | 'email' | 'picture' | 'given_name' | 'family_name'>
	>,
): Promise<InstanceType<typeof User>> {
	const existing = await User.findOne({ where: { id: kfUserId } });
	if (existing) return existing;

	const firstName = (userInfo.given_name || userInfo.name || 'New').trim();
	const lastName = (userInfo.family_name || 'User').trim();
	const fullName = `${firstName} ${lastName}`;
	const initials = `${firstName[0] || '?'}${lastName[0] || '?'}`;
	const baseSlug = slugifyString(fullName) || 'user';
	const existingSlugCount = await User.count({
		where: { slug: { [Op.like]: `${baseSlug}%` } },
	});
	const slug = existingSlugCount ? `${baseSlug}-${existingSlugCount + 1}` : baseSlug;

	// Prefer the kf-auth email if it's unique on PubPub; otherwise stash a
	// placeholder so the row still satisfies the not-null constraint and the
	// user can update it later.
	let email = `${kfUserId}@placeholder.invalid`;
	if (userInfo.email) {
		const emailTaken = await User.findOne({
			where: { email: userInfo.email.toLowerCase() },
		});
		if (!emailTaken) {
			email = userInfo.email.toLowerCase();
		}
	}

	const created = await User.create({
		id: kfUserId,
		slug,
		firstName,
		lastName,
		fullName,
		initials,
		email,
		avatar: userInfo.picture || null,
		hash: '',
		salt: '',
	} as any);
	console.log(`Auto-created PubPub user ${created.id} (${created.slug}) from KF Auth`);
	return created;
}
