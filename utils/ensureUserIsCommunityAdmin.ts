import { Op } from 'sequelize';
import { Community, Member } from 'server/models';
import { isUserSuperAdmin } from 'server/user/queries';
import { ForbiddenError, NotFoundError } from 'server/utils/errors';

/**
 * Finds a community by its domain or subdomain.
 * @param domain - The domain or subdomain of the community to find.
 * @returns A Promise that resolves to the community object if found, or null if not found.
 */
export const findCommunityByDomain = async (domain: string) => {
	const community = await Community.findOne({
		where: {
			[Op.or]: [
				{
					domain,
				},
				{
					subdomain: domain,
				},
			],
		},
	});
	return community;
};

/**
 * Finds a community by its hostname.
 * @param hostname - The hostname of the community to find.
 * @returns  A promise that resolves to the community object, or null if not found.
 */
export const findCommunityByHostname = async (hostname: string) => {
	const domainOrSubmdomain = hostname.replace(/\.pubpub\.org$|\.duqduq\.org$/, '');
	const community = await findCommunityByDomain(domainOrSubmdomain);
	return community;
};

/**
 * Checks if the user is an admin of the community associated with the given hostname.
 * @param req - An object containing at least the hostname and user information. Usually an Express request object.
 * @param req.hostname - The hostname of the community to check.
 * @param req.user - An optional object containing the user ID.
 * @param req.user.id - The ID of the user to check.
 * @returns The community if the user is an admin, throws othewise
 * @throws A {@link NotFoundError} - If the community or member is not found.
 * @throws A {@link ForbiddenError} - If the user is not an admin.
 */
export const ensureUserIsCommunityAdmin = async (req: {
	hostname: string;
	user?: {
		id: string;
	};
}) => {
	if (!req.user?.id) {
		throw new ForbiddenError(new Error('User not found'));
	}

	const community = await findCommunityByHostname(req.hostname);
	if (!community) {
		throw new NotFoundError();
	}

	const member = await Member.findOne({
		where: {
			communityId: community.id,
			userId: req.user?.id,
		},
	});

	if (!member) {
		if (await isUserSuperAdmin({ userId: req.user?.id })) {
			return community;
		}

		throw new NotFoundError(new Error('Member not found'));
	}

	if (member.permissions !== 'admin') {
		throw new ForbiddenError(new Error('You are not an admin of this community'));
	}

	return community;
};
