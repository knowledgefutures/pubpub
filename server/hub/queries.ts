import {
	Community,
	Hub,
	HubCommunity,
	HubManager,
	HubOptOut,
	Pub,
	Release,
	SpamTag,
	User,
} from 'server/models';

export const getHubBySlug = async (slug: string) => {
	return Hub.findOne({ where: { slug } });
};

export const getHubById = async (id: string) => {
	return Hub.findByPk(id);
};

export const getHubWithCommunities = async (slug: string) => {
	const org = await Hub.findOne({ where: { slug } });
	if (!org) {
		return null;
	}
	const associations = await HubCommunity.findAll({
		where: { hubId: org.id, showOnLandingPage: true },
		include: [
			{
				model: Community,
				attributes: [
					'id',
					'subdomain',
					'domain',
					'title',
					'description',
					'heroBackgroundImage',
					'heroLogo',
					'accentColorLight',
					'accentColorDark',
					'headerLogo',
					'headerColorType',
					'createdAt',
					'updatedAt',
				],
				include: [
					{
						model: SpamTag,
						as: 'spamTag',
						attributes: ['status'],
						required: false,
					},
				],
			},
		],
	});

	// Get per-org opt-outs for this hub
	const optOuts = await HubOptOut.findAll({
		where: { hubId: org.id },
		attributes: ['communityId'],
	});
	const rejectedCommunityIds = new Set(optOuts.map((o) => (o as any).communityId));

	const communities = associations
		.map((a) => (a as any).community)
		.filter(Boolean)
		.filter((c: any) => !rejectedCommunityIds.has(c.id) && c.spamTag?.status !== 'confirmed')
		.map((c: any) => c.toJSON());

	// Add pub counts (released pubs only)
	const communitiesWithCounts = await Promise.all(
		communities.map(async (c: any) => {
			const pubCount = await Pub.count({
				where: { communityId: c.id },
				include: [{ model: Release, attributes: [], required: true }],
			});
			return { ...c, pubCount };
		}),
	);

	return {
		...org.toJSON(),
		communities: communitiesWithCounts,
	};
};

export const getAllHubs = async () => {
	const orgs = await Hub.findAll({ order: [['title', 'ASC']] });
	return orgs.map((o) => o.toJSON());
};

export const getAllHubsWithCommunityCounts = async () => {
	const orgs = await Hub.findAll({ order: [['title', 'ASC']] });
	const result = await Promise.all(
		orgs.map(async (org) => {
			const communityCount = await HubCommunity.count({
				where: { hubId: org.id },
			});
			return { ...org.toJSON(), communityCount };
		}),
	);
	return result;
};

/** Fetches all orgs with community counts + total pub counts for the /hubs directory.
 *  Filters out private orgs. Inactive orgs still appear (inactive only hides the dashboard). */
export const getAllHubsForDirectory = async () => {
	const orgs = await Hub.findAll({
		where: { isPrivate: false },
		order: [['title', 'ASC']],
	});
	const result = await Promise.all(
		orgs.map(async (org) => {
			const associations = await HubCommunity.findAll({
				where: { hubId: org.id },
				include: [
					{
						model: Community,
						attributes: ['id'],
						include: [
							{
								model: SpamTag,
								as: 'spamTag',
								attributes: ['status'],
								required: false,
							},
						],
					},
				],
			});
			const communityIds = associations
				.map((a) => (a as any).community)
				.filter((c: any) => c && c.spamTag?.status !== 'confirmed')
				.map((c: any) => c.id);
			const communityCount = communityIds.length;
			const pubCount =
				communityCount > 0
					? await Pub.count({
							where: { communityId: communityIds },
							include: [{ model: Release, attributes: [], required: true }],
						})
					: 0;
			return { ...org.toJSON(), communityCount, pubCount };
		}),
	);
	return result;
};

export const createHub = async (values: {
	slug: string;
	title: string;
	subtitle?: string | null;
	description?: string | null;
	avatar?: string | null;
	heroImage?: string | null;
	heroLogo?: string | null;
	accentColorLight?: string | null;
	accentColorDark?: string | null;
	website?: string | null;
	email?: string | null;
	communityCreationEnabled?: boolean;
	communityCloneAccess?: 'off' | 'everyone' | 'managers';
	isActive?: boolean;
	isPrivate?: boolean;
}) => {
	const org = await Hub.create(values);
	return org.toJSON();
};

export const updateHub = async (
	id: string,
	values: Partial<{
		slug: string;
		title: string;
		subtitle: string | null;
		description: string | null;
		avatar: string | null;
		heroImage: string | null;
		heroLogo: string | null;
		accentColorLight: string | null;
		accentColorDark: string | null;
		website: string | null;
		email: string | null;
		communityCreationEnabled: boolean;
		communityCloneAccess: 'off' | 'everyone' | 'managers';
		isActive: boolean;
		isPrivate: boolean;
		domains: string[];
		pubSearchTerms: string[];
	}>,
) => {
	await Hub.update(values, { where: { id } });
	return Hub.findByPk(id);
};

export const destroyHub = async (id: string) => {
	return Hub.destroy({ where: { id } });
};

export const addCommunityToHub = async (
	hubId: string,
	communityId: string,
	opts?: { dataAccess?: 'none' | 'requested' | 'granted'; showOnLandingPage?: boolean },
) => {
	const [record, created] = await HubCommunity.findOrCreate({
		where: { hubId, communityId },
		defaults: {
			dataAccess: opts?.dataAccess ?? 'none',
			...(opts?.showOnLandingPage !== undefined && {
				showOnLandingPage: opts.showOnLandingPage,
			}),
		} as any,
	});
	// If the record already exists and we're upgrading access, update it
	if (!created && opts?.dataAccess && record.dataAccess !== opts.dataAccess) {
		await record.update({ dataAccess: opts.dataAccess });
	}
	return record.toJSON();
};

export const removeCommunityFromHub = async (hubId: string, communityId: string) => {
	return HubCommunity.destroy({
		where: { hubId, communityId },
	});
};

export const getHubCommunities = async (hubId: string) => {
	const associations = await HubCommunity.findAll({
		where: { hubId },
		include: [
			{
				model: Community,
				attributes: [
					'id',
					'subdomain',
					'domain',
					'title',
					'description',
					'heroBackgroundImage',
					'heroLogo',
					'accentColorLight',
					'accentColorDark',
					'headerLogo',
					'headerColorType',
					'createdAt',
					'updatedAt',
				],
				include: [
					{
						model: SpamTag,
						as: 'spamTag',
						attributes: ['status'],
						required: false,
					},
				],
			},
		],
	});
	return associations
		.map((a) => {
			const aj = a.toJSON() as any;
			const community = aj.community;
			if (!community) return null;
			if (community.spamTag?.status === 'confirmed') return null;
			return {
				...community,
				showOnLandingPage: aj.showOnLandingPage,
				dataAccess: aj.dataAccess,
			};
		})
		.filter(Boolean);
};

/**
 * Find all hubs a community belongs to.
 */
export const getHubsForCommunity = async (communityId: string) => {
	const associations = await HubCommunity.findAll({
		where: { communityId },
		include: [{ model: Hub }],
	});
	return associations.map((a) => (a as any).hub?.toJSON()).filter(Boolean);
};

/* ------------------------------------------------------------------ */
/* Hub Managers                                               */
/* ------------------------------------------------------------------ */

export const getHubManagers = async (hubId: string) => {
	const managers = await HubManager.findAll({
		where: { hubId },
		include: [
			{
				model: User,
				attributes: ['id', 'fullName', 'slug', 'avatar', 'initials'],
			},
		],
	});
	return managers.map((m) => {
		const mj = m.toJSON() as any;
		return {
			id: mj.id,
			userId: mj.userId,
			hubId: mj.hubId,
			user: mj.user || null,
		};
	});
};

export const addHubManager = async (hubId: string, userId: string) => {
	const [record] = await HubManager.findOrCreate({
		where: { hubId, userId },
	});
	return record.toJSON();
};

export const removeHubManager = async (hubId: string, userId: string) => {
	return HubManager.destroy({ where: { hubId, userId } });
};

/** Check whether a user is a manager of any hub */
export const isUserHubManager = async (userId: string, hubId: string): Promise<boolean> => {
	const count = await HubManager.count({ where: { hubId, userId } });
	return count > 0;
};
