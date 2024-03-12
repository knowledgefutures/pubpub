import { Op } from 'sequelize';
import { Community, Member, includeUserModel } from 'server/models';
import { ForbiddenError } from 'server/utils/errors';
import { type UserWithPrivateFields } from 'types';
import { expect } from './assert';

/**
 * Finds a community by its domain or subdomain.
 *
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
 *
 * @param hostname - The hostname of the community to find.
 * @returns A promise that resolves to the community object, or null if not found.
 */
export const findCommunityByHostname = async (hostname: string) => {
	const domainOrSubmdomain = hostname.replace(/\.pubpub\.org$|\.duqduq\.org$/, '');
	const community = await findCommunityByDomain(domainOrSubmdomain);
	return community;
};

/**
 * Checks if the user is an admin of the community associated with the given hostname, or by the
 * community's id.
 *
 * @param req - An object containing at least the hostname and user information. Usually an Express
 *   request object.
 * @param req.hostname - The hostname of the community to check.
 * @param req.user - An optional object containing the user ID.
 * @param req.user.id - The ID of the user to check.
 * @param req.id - An alternative to req.hostname, the ID of the community to check.
 * @returns The community if the user is an admin, throws othewise
 * @throws A {@link NotFoundError} - If the community or member is not found.
 * @throws A {@link ForbiddenError} - If the user is not an admin.
 */
export const ensureUserIsCommunityAdmin = async (
	req: { user?: UserWithPrivateFields } & (
		| { hostname: string }
		| {
				id: string;
		  }
	),
) => {
	if (!req.user?.id) {
		throw new ForbiddenError(new Error('User not found'));
	}

	if ('id' in req) {
		if (req.user.isSuperAdmin || req.user.isAdminOfThisCommunity) {
			return expect(await Community.findByPk(req.id));
		}

		const autherMember = await Member.findOne({
			include: [
				includeUserModel({ as: 'user', required: true }),
				{ model: Community, as: 'community', required: true },
			],
			where: {
				userId: req.user.id,
				permissions: 'admin',
				communityId: req.id,
			},
		});

		if (!autherMember) {
			throw new ForbiddenError(new Error('User is not an admin of this community'));
		}

		req.user.isAdminOfThisCommunity = true;

		return expect(autherMember.community);
	}

	const domainOrSubmdomain = req.hostname.replace(/\.pubpub\.org$|\.duqduq\.org$/, '');

	if (req.user.isSuperAdmin || req.user.isAdminOfThisCommunity) {
		return expect(await findCommunityByDomain(domainOrSubmdomain));
	}

	const autherMember = await Member.findOne({
		include: [
			includeUserModel({ as: 'user', required: true }),
			{
				model: Community,
				as: 'community',
				required: true,
			},
		],
		where: {
			userId: req.user.id,
			[Op.and]: [
				{
					permissions: 'admin',
				},
				{
					[Op.or]: [
						{
							'$community.domain$': domainOrSubmdomain,
						},
						{
							'$community.subdomain$': domainOrSubmdomain,
						},
					],
				},
			],
		},
	});

	if (!autherMember) {
		throw new ForbiddenError(new Error('User is not an admin of this community'));
	}

	req.user.isAdminOfThisCommunity = true;

	return expect(autherMember.community);
};
