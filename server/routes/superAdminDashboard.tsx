import type * as types from 'types';

import React from 'react';

import { Router } from 'express';
import { Op } from 'sequelize';

import { filtersById as spamFiltersById } from 'client/containers/SuperAdminDashboard/CommunitySpam/filters';
import { filtersById as spamUsersFiltersById } from 'client/containers/SuperAdminDashboard/UserSpam/filters';
import {
	getContentMentionsForDomain,
	getContentSearchCounts,
	getContentSearchPubs,
	getContentSearchPubsByPhrase,
} from 'server/community/contentSearchQueries';
import {
	getActivityFeed,
	getEduCollaborators,
	getEduDomainDetailData,
	getEduDomainSummaries,
} from 'server/community/eduQueries';
import { getAllTemplates } from 'server/communityTemplate/queries';
import { env } from 'server/env';
import { getExploreCommunities } from 'server/exploreFeatured/queries';
import { createFeatureFlag } from 'server/featureFlag/queries';
import { setFeatureFlagOverrideForCommunity } from 'server/featureFlagCommunity/queries';
import { setFeatureFlagOverrideForUser } from 'server/featureFlagUser/queries';
import Html from 'server/Html';
// NOTE: Suggested Hubs SSR returns an empty shell; summaries are fetched client-side on mount.
import { getAllHubsWithCommunityCounts } from 'server/hub/queries';
import { getLandingPageFeatures } from 'server/landingPageFeature/queries';
import {
	Community,
	DepositTarget,
	FeatureFlag,
	FeatureFlagCommunity,
	FeatureFlagUser,
	FtpTarget,
	User,
} from 'server/models';
import { queryCommunitiesForSpamManagement } from 'server/spamTag/communityDashboard';
import { queryUsersForSpamManagement } from 'server/spamTag/userDashboard';
import {
	addCustomHostname,
	isCloudflareConfigured,
	removeCustomHostname,
} from 'server/utils/cloudflareCustomHostnames';
import {
	BadRequestError,
	ForbiddenError,
	HTTPStatusError,
	handleErrors,
	NotFoundError,
} from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { testSftpConnection } from 'server/utils/sftp';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { aes256Decrypt, aes256Encrypt } from 'utils/crypto';
import {
	getSuperAdminTabUrl,
	isSuperAdminTabKind,
	type SuperAdminTabKind,
	superAdminTabKinds,
} from 'utils/superAdmin';

export const router = Router();

const parseSpamFieldFilterParam = (
	value: string | undefined,
): types.SpamFieldsFilterKey[] | undefined => {
	if (!value) {
		return undefined;
	}

	const values = value
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean) as types.SpamFieldsFilterKey[];

	if (values.length === 0) {
		return undefined;
	}

	return values;
};

const sanitizeFeatureFlag = (flag: FeatureFlag) => ({
	id: flag.id,
	name: flag.name,
	enabledUsersFraction: flag.enabledUsersFraction ?? 0,
	enabledCommunitiesFraction: flag.enabledCommunitiesFraction ?? 0,
	overrides: {
		communitiesOn: (flag.communities ?? []).filter((c) => c.enabled).length,
		communitiesOff: (flag.communities ?? []).filter((c) => c.enabled === false).length,
		usersOn: (flag.users ?? []).filter((u) => u.enabled).length,
		usersOff: (flag.users ?? []).filter((u) => u.enabled === false).length,
	},
});

const featureFlagIncludes = [
	{ model: FeatureFlagUser, as: 'users', attributes: ['id', 'enabled'] },
	{ model: FeatureFlagCommunity, as: 'communities', attributes: ['id', 'enabled'] },
];

const getFeatureFlagWithCounts = async (id: string) => {
	const flag = await FeatureFlag.findByPk(id, { include: featureFlagIncludes });
	if (!flag) {
		throw new NotFoundError(new Error('Feature flag not found'));
	}
	return flag;
};

const getTabProps = async (tabKind: SuperAdminTabKind, locationData: types.LocationData) => {
	if (tabKind === 'featureFlags') {
		const [flags, totalCommunities, totalUsers] = await Promise.all([
			FeatureFlag.findAll({
				include: featureFlagIncludes,
				order: [['name', 'ASC']],
			}),
			Community.count(),
			User.count(),
		]);
		return {
			featureFlags: flags.map(sanitizeFeatureFlag),
			totalCommunities,
			totalUsers,
		};
	}
	if (tabKind === 'customDomains') {
		const communities = await Community.findAll({
			where: { domain: { [Op.ne]: null } },
			attributes: ['id', 'subdomain', 'domain', 'title'],
			order: [['domain', 'ASC']],
			raw: true,
		});
		return { communities, cloudflareConfigured: isCloudflareConfigured() };
	}
	if (tabKind === 'depositTargets') {
		const targets = await DepositTarget.findAll({
			include: [
				{
					model: Community,
					as: 'community',
					attributes: ['id', 'title', 'subdomain'],
				},
			],
			order: [['createdAt', 'DESC']],
		});
		return {
			depositTargets: targets.map((t) => ({
				id: t.id,
				communityId: t.communityId,
				doiPrefix: t.doiPrefix,
				service: t.service,
				hasCredentials: Boolean(t.username),
				communityTitle: t.community?.title ?? '(unknown)',
				communitySubdomain: t.community?.subdomain ?? '(unknown)',
			})),
		};
	}
	if (tabKind === 'ftpTargets') {
		const targets = await FtpTarget.findAll({
			include: [
				{
					model: Community,
					as: 'community',
					attributes: ['id', 'title', 'subdomain'],
				},
			],
			order: [['createdAt', 'DESC']],
		});
		return {
			ftpTargets: targets.map(sanitizeFtpTarget),
		};
	}
	if (tabKind === 'exploreCommunities') {
		return { communities: await getExploreCommunities() };
	}
	if (tabKind === 'landingPageFeatures') {
		return { landingPageFeatures: await getLandingPageFeatures({ onlyValidItems: false }) };
	}
	if (tabKind === 'hubs') {
		return { hubs: await getAllHubsWithCommunityCounts() };
	}
	if (tabKind === 'suggestedHubs') {
		// Return empty shell — summaries are fetched client-side for fast SSR
		return {};
	}
	if (tabKind === 'templates') {
		return { templates: await getAllTemplates() };
	}
	if (tabKind === 'spam') {
		const searchTerm = locationData.query.q ?? null;
		const { query } = spamFiltersById[searchTerm ? 'recent' : 'unreviewed'];
		const { communities, totalCount } = await queryCommunitiesForSpamManagement({
			limit: 100,
			searchTerm,
			...query!,
		});
		return {
			searchTerm,
			communities,
			totalCount,
		};
	}
	if (tabKind === 'spamUsers') {
		const searchTerm = locationData.query.q ?? null;
		const filterId = (locationData.query.filter as string) ?? 'all';
		const baseFilter = spamUsersFiltersById[filterId] ?? spamUsersFiltersById.all;
		const sortParam = locationData.query.sort as string | undefined;
		const ordering = sortParam
			? {
					field: sortParam.split(':')[0],
					direction: sortParam.split(':')[1] || 'DESC',
				}
			: baseFilter.query!.ordering;

		const spamFieldsIncludeParam =
			(locationData.query.spamFieldsInclude as string | undefined) ??
			(locationData.query.spamFields as string | undefined);
		const spamFieldsExcludeParam = locationData.query.spamFieldsExclude as string | undefined;
		const spamFieldsInclude = parseSpamFieldFilterParam(spamFieldsIncludeParam);
		const spamFieldsExclude = parseSpamFieldFilterParam(spamFieldsExcludeParam);
		const hasSpamFieldFiltersInQuery =
			spamFieldsIncludeParam != null || spamFieldsExcludeParam != null;

		const spamFieldsFilter = hasSpamFieldFiltersInQuery
			? {
					include: spamFieldsInclude,
					exclude: spamFieldsExclude,
				}
			: {
					exclude: ['automatedScan'] as types.SpamFieldsFilterKey[],
				};

		const users = await queryUsersForSpamManagement({
			limit: 50,
			searchTerm,
			includeAffiliation: true,
			...baseFilter.query!,
			ordering: ordering as any,
			communitySubdomain: (locationData.query.community as string) || undefined,
			createdAfter: (locationData.query.createdAfter as string) || undefined,
			createdBefore: (locationData.query.createdBefore as string) || undefined,
			activeAfter: (locationData.query.activeAfter as string) || undefined,
			activeBefore: (locationData.query.activeBefore as string) || undefined,
			minActivities: locationData.query.minActivities
				? Number(locationData.query.minActivities)
				: undefined,
			maxActivities: locationData.query.maxActivities
				? Number(locationData.query.maxActivities)
				: undefined,
			spamFieldsFilter,
		});
		return {
			searchTerm,
			users,
		};
	}
	return {};
};

router.get('/superadmin', async (_, res) => {
	const [firstTab] = superAdminTabKinds;
	return res.redirect(getSuperAdminTabUrl(firstTab));
});

// ── Custom Domains API ──────────────────────────────────────────────────────

router.post('/api/superadmin/custom-domains', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		const { communityId, domain } = req.body;
		if (!communityId || !domain) {
			throw new BadRequestError(new Error('communityId and domain are required'));
		}

		const hostname = String(domain).toLowerCase().trim();
		if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(hostname)) {
			throw new BadRequestError(new Error('Invalid domain format'));
		}

		const identifier = String(communityId).trim();
		// Support both UUID and subdomain
		const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
			identifier,
		);
		const community = isUuid
			? await Community.findByPk(identifier)
			: await Community.findOne({ where: { subdomain: identifier } });
		if (!community) {
			throw new NotFoundError(new Error('Community not found'));
		}

		// Check if domain is already in use
		const existing = await Community.findOne({ where: { domain: hostname } });
		if (existing && existing.id !== community.id) {
			throw new BadRequestError(new Error('Domain is already in use by another community'));
		}

		// Add to Cloudflare first
		await addCustomHostname(hostname);

		// Update the community
		await community.update({ domain: hostname });

		return res.json({
			id: community.id,
			subdomain: community.subdomain,
			domain: hostname,
			title: community.title,
		});
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

router.delete('/api/superadmin/custom-domains', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		const { communityId } = req.body;
		if (!communityId) {
			throw new BadRequestError(new Error('communityId is required'));
		}

		const community = await Community.findByPk(communityId);
		if (!community) {
			throw new NotFoundError(new Error('Community not found'));
		}

		if (community.domain) {
			// Remove from Cloudflare first
			await removeCustomHostname(community.domain);
		}

		// Clear the domain
		await community.update({ domain: null });

		return res.json({ success: true });
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// ── Deposit Targets API ────────────────────────────────────────────────────

const resolveCommunity = async (identifier: string) => {
	const trimmed = String(identifier).trim();
	const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
	const community = isUuid
		? await Community.findByPk(trimmed)
		: await Community.findOne({ where: { subdomain: trimmed } });
	if (!community) {
		throw new NotFoundError(new Error('Community not found'));
	}
	return community;
};

const sanitizeFtpTarget = (t: FtpTarget) => ({
	id: t.id,
	communityId: t.communityId,
	name: t.name ?? '',
	ftpType: t.ftpType,
	port: t.port,
	host: t.host,
	filePath: t.filePath,
	hasCredentials: Boolean(t.username),
	communityTitle: t.community?.title ?? '(unknown)',
	communitySubdomain: t.community?.subdomain ?? '(unknown)',
});

const sanitizeDepositTarget = (t: DepositTarget) => ({
	id: t.id,
	communityId: t.communityId,
	doiPrefix: t.doiPrefix,
	service: t.service,
	hasCredentials: Boolean(t.username),
	communityTitle: t.community?.title ?? '(unknown)',
	communitySubdomain: t.community?.subdomain ?? '(unknown)',
});

router.get('/api/superadmin/communities/search', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const q = String(req.query.q ?? '')
			.trim()
			.toLowerCase();
		if (!q) {
			return res.json([]);
		}

		const excludeWithDepositTarget = req.query.excludeWithDepositTarget === 'true';
		const excludeWithFtpTarget = req.query.excludeWithFtpTarget === 'true';

		const communities = await Community.findAll({
			where: {
				[Op.or]: [
					{ title: { [Op.iLike]: `%${q}%` } },
					{ subdomain: { [Op.iLike]: `%${q}%` } },
				],
			},
			attributes: ['id', 'title', 'subdomain'],
			limit: 20,
			order: [['title', 'ASC']],
		});

		if (!excludeWithDepositTarget && !excludeWithFtpTarget) {
			return res.json(communities);
		}

		const communityIds = communities.map((c) => c.id);
		const excludedIds = new Set<string | null>();

		if (excludeWithDepositTarget) {
			const existingTargets = await DepositTarget.findAll({
				where: { communityId: communityIds },
				attributes: ['communityId'],
			});
			existingTargets.forEach((t) => excludedIds.add(t.communityId));
		}

		if (excludeWithFtpTarget) {
			const existingFtpTargets = await FtpTarget.findAll({
				where: { communityId: communityIds },
				attributes: ['communityId'],
			});
			existingFtpTargets.forEach((t) => excludedIds.add(t.communityId));
		}

		return res.json(communities.filter((c) => !excludedIds.has(c.id)));
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

router.post('/api/superadmin/deposit-targets', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const { communityId, doiPrefix, service, username, password } = req.body;
		if (!communityId || !doiPrefix) {
			throw new BadRequestError(new Error('communityId and doiPrefix are required'));
		}
		if (service && !['crossref', 'datacite'].includes(service)) {
			throw new BadRequestError(new Error('service must be "crossref" or "datacite"'));
		}

		const community = await resolveCommunity(communityId);
		const existingTarget = await DepositTarget.findOne({
			where: { communityId: community.id },
		});
		if (existingTarget) {
			throw new BadRequestError(
				new Error('A deposit target already exists for this community'),
			);
		}

		const createData: Record<string, any> = {
			communityId: community.id,
			doiPrefix: String(doiPrefix).trim(),
			service: service || 'crossref',
		};

		if (username && password) {
			const { encryptedText, initVec } = aes256Encrypt(password, env.AES_ENCRYPTION_KEY!);
			createData.username = username;
			createData.password = encryptedText;
			createData.passwordInitVec = initVec;
		}

		const target = await DepositTarget.create(createData as any);
		const reloaded = await DepositTarget.findByPk(target.id, {
			include: [
				{ model: Community, as: 'community', attributes: ['id', 'title', 'subdomain'] },
			],
		});

		return res.json(sanitizeDepositTarget(reloaded!));
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

router.put('/api/superadmin/deposit-targets/:id', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const target = await DepositTarget.findByPk(req.params.id);
		if (!target) {
			throw new NotFoundError(new Error('Deposit target not found'));
		}

		const { doiPrefix, service, username, password } = req.body;
		const updates: Record<string, any> = {};

		if (doiPrefix !== undefined) {
			updates.doiPrefix = String(doiPrefix).trim();
		}
		if (service !== undefined) {
			if (!['crossref', 'datacite'].includes(service)) {
				throw new BadRequestError(new Error('service must be "crossref" or "datacite"'));
			}
			updates.service = service;
		}

		if (username !== undefined) {
			if (username === '') {
				updates.username = null;
				updates.password = null;
				updates.passwordInitVec = null;
			} else {
				updates.username = username;
				if (password) {
					const { encryptedText, initVec } = aes256Encrypt(
						password,
						env.AES_ENCRYPTION_KEY!,
					);
					updates.password = encryptedText;
					updates.passwordInitVec = initVec;
				}
			}
		} else if (password) {
			const { encryptedText, initVec } = aes256Encrypt(password, env.AES_ENCRYPTION_KEY!);
			updates.password = encryptedText;
			updates.passwordInitVec = initVec;
		}

		await target.update(updates);
		const reloaded = await DepositTarget.findByPk(target.id, {
			include: [
				{ model: Community, as: 'community', attributes: ['id', 'title', 'subdomain'] },
			],
		});

		return res.json(sanitizeDepositTarget(reloaded!));
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

router.delete('/api/superadmin/deposit-targets/:id', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const target = await DepositTarget.findByPk(req.params.id);
		if (!target) {
			throw new NotFoundError(new Error('Deposit target not found'));
		}

		await target.update({ username: null, password: null, passwordInitVec: null });
		const reloaded = await DepositTarget.findByPk(target.id, {
			include: [
				{ model: Community, as: 'community', attributes: ['id', 'title', 'subdomain'] },
			],
		});
		return res.json(sanitizeDepositTarget(reloaded!));
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

router.post('/api/superadmin/deposit-targets/:id/copy', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const source = await DepositTarget.findByPk(req.params.id);
		if (!source) {
			throw new NotFoundError(new Error('Source deposit target not found'));
		}

		const { communityId, copyCredentials } = req.body;
		if (!communityId) {
			throw new BadRequestError(new Error('communityId is required'));
		}

		const destCommunity = await resolveCommunity(communityId);

		const existing = await DepositTarget.findOne({
			where: { communityId: destCommunity.id },
		});
		if (existing) {
			throw new BadRequestError(
				new Error('Destination community already has a deposit target'),
			);
		}

		const createData: Record<string, any> = {
			communityId: destCommunity.id,
			doiPrefix: source.doiPrefix,
			service: source.service,
		};

		if (copyCredentials && source.username && source.password && source.passwordInitVec) {
			const plaintext = aes256Decrypt(
				source.password,
				env.AES_ENCRYPTION_KEY!,
				source.passwordInitVec,
			);
			const { encryptedText, initVec } = aes256Encrypt(plaintext, env.AES_ENCRYPTION_KEY!);
			createData.username = source.username;
			createData.password = encryptedText;
			createData.passwordInitVec = initVec;
		}

		const newTarget = await DepositTarget.create(createData as any);
		const reloaded = await DepositTarget.findByPk(newTarget.id, {
			include: [
				{ model: Community, as: 'community', attributes: ['id', 'title', 'subdomain'] },
			],
		});

		return res.json(sanitizeDepositTarget(reloaded!));
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// ── FTP Targets API ────────────────────────────────────────────────────────

router.post('/api/superadmin/ftp-targets', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const { communityId, name, ftpType, port, host, filePath, username, password } = req.body;
		if (!communityId || !host) {
			throw new BadRequestError(new Error('communityId and host are required'));
		}
		if (!ftpType || !['sftp', 'ftps'].includes(ftpType)) {
			throw new BadRequestError(new Error('ftpType must be "sftp" or "ftps"'));
		}

		const community = await resolveCommunity(communityId);

		const createData: Record<string, any> = {
			communityId: community.id,
			name: name ? String(name).trim() : '',
			ftpType,
			host: String(host).trim(),
			port: port != null ? Number(port) : null,
			filePath: filePath ? String(filePath).trim() : null,
		};

		if (username && password) {
			await testSftpConnection(
				{ host: createData.host, port: createData.port, username, password },
				createData.filePath,
			).catch((err) => {
				throw new BadRequestError(new Error(err.message));
			});
			const { encryptedText, initVec } = aes256Encrypt(password, env.AES_ENCRYPTION_KEY!);
			createData.username = username;
			createData.password = encryptedText;
			createData.passwordInitVec = initVec;
		}

		const target = await FtpTarget.create(createData as any);
		const reloaded = await FtpTarget.findByPk(target.id, {
			include: [
				{ model: Community, as: 'community', attributes: ['id', 'title', 'subdomain'] },
			],
		});

		return res.status(201).json(sanitizeFtpTarget(reloaded!));
	} catch (err) {
		if (err instanceof HTTPStatusError) {
			return res.status(err.status).json({ error: err.message });
		}
		return next(err);
	}
});

router.put('/api/superadmin/ftp-targets/:id', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const target = await FtpTarget.findByPk(req.params.id);
		if (!target) {
			throw new NotFoundError(new Error('FTP target not found'));
		}

		const { name, ftpType, port, host, filePath, username, password } = req.body;
		const updates: Record<string, any> = {};

		if (name !== undefined) {
			updates.name = String(name).trim();
		}
		if (ftpType !== undefined) {
			if (!['sftp', 'ftps'].includes(ftpType)) {
				throw new BadRequestError(new Error('ftpType must be "sftp" or "ftps"'));
			}
			updates.ftpType = ftpType;
		}
		if (host !== undefined) {
			updates.host = String(host).trim();
		}
		if (port !== undefined) {
			updates.port = port !== null ? Number(port) : null;
		}
		if (filePath !== undefined) {
			updates.filePath = filePath ? String(filePath).trim() : null;
		}

		if (username !== undefined) {
			if (username === '') {
				updates.username = null;
				updates.password = null;
				updates.passwordInitVec = null;
			} else {
				// Encrypt any new password first (before the connection test).
				if (password) {
					const { encryptedText, initVec } = aes256Encrypt(
						password,
						env.AES_ENCRYPTION_KEY!,
					);
					updates.password = encryptedText;
					updates.passwordInitVec = initVec;
				}
				if (username !== undefined) {
					updates.username = username;
				}

				// Test connection if any connection-relevant field changed and credentials exist.
				const connectionFieldChanged =
					host !== undefined ||
					port !== undefined ||
					filePath !== undefined ||
					ftpType !== undefined ||
					username !== undefined ||
					password !== undefined;

				const effectiveUsername = username ?? target.username;
				const hasCredentials =
					Boolean(effectiveUsername) && Boolean(password ?? target.password);

				if (connectionFieldChanged && hasCredentials) {
					const effectiveHost = updates.host ?? target.host;
					const effectivePort = updates.port !== undefined ? updates.port : target.port;
					const effectivePath =
						updates.filePath !== undefined ? updates.filePath : target.filePath;
					const effectivePassword = password
						? password
						: aes256Decrypt(
								target.password!,
								env.AES_ENCRYPTION_KEY!,
								target.passwordInitVec!,
							);

					await testSftpConnection(
						{
							host: effectiveHost,
							port: effectivePort,
							username: effectiveUsername,
							password: effectivePassword,
						},
						effectivePath,
					).catch((err) => {
						throw new BadRequestError(new Error(err.message));
					});
				}
			}
		}

		await target.update(updates);
		const reloaded = await FtpTarget.findByPk(target.id, {
			include: [
				{ model: Community, as: 'community', attributes: ['id', 'title', 'subdomain'] },
			],
		});

		return res.json(sanitizeFtpTarget(reloaded!));
	} catch (err) {
		if (err instanceof HTTPStatusError) {
			return res.status(err.status).json({ error: err.message });
		}
		return next(err);
	}
});

router.delete('/api/superadmin/ftp-targets/:id', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const target = await FtpTarget.findByPk(req.params.id);
		if (!target) {
			throw new NotFoundError(new Error('FTP target not found'));
		}

		await target.destroy();
		return res.json({ id: req.params.id });
	} catch (err) {
		if (err instanceof HTTPStatusError) {
			return res.status(err.status).json({ error: err.message });
		}
		return next(err);
	}
});

router.post('/api/superadmin/ftp-targets/:id/copy', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const source = await FtpTarget.findByPk(req.params.id);
		if (!source) {
			throw new NotFoundError(new Error('Source FTP target not found'));
		}

		const { communityId, copyCredentials } = req.body;
		if (!communityId) {
			throw new BadRequestError(new Error('communityId is required'));
		}

		const destCommunity = await resolveCommunity(communityId);

		const createData: Record<string, any> = {
			communityId: destCommunity.id,
			name: source.name ?? '',
			ftpType: source.ftpType,
			port: source.port,
			host: source.host,
			filePath: source.filePath,
		};

		if (copyCredentials && source.username && source.password && source.passwordInitVec) {
			const plaintext = aes256Decrypt(
				source.password,
				env.AES_ENCRYPTION_KEY!,
				source.passwordInitVec,
			);
			const { encryptedText, initVec } = aes256Encrypt(plaintext, env.AES_ENCRYPTION_KEY!);
			createData.username = source.username;
			createData.password = encryptedText;
			createData.passwordInitVec = initVec;
		}

		const newTarget = await FtpTarget.create(createData as any);
		const reloaded = await FtpTarget.findByPk(newTarget.id, {
			include: [
				{ model: Community, as: 'community', attributes: ['id', 'title', 'subdomain'] },
			],
		});

		return res.json(sanitizeFtpTarget(reloaded!));
	} catch (err) {
		if (err instanceof HTTPStatusError) {
			return res.status(err.status).json({ error: err.message });
		}
		return next(err);
	}
});

// ── Feature Flags API ──────────────────────────────────────────────────────

const assertSuperAdmin = async (req: any) => {
	const initialData = await getInitialData(req);
	if (!initialData.loginData.isSuperAdmin) {
		throw new ForbiddenError();
	}
};

const featureFlagNamePattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

const parseOverrideState = (state: any): types.FeatureFlagOverrideState => {
	if (state !== 'on' && state !== 'off' && state !== 'inert') {
		throw new BadRequestError(new Error('state must be "on", "off", or "inert"'));
	}
	return state;
};

const parseFraction = (value: any, label: string) => {
	const fraction = Number(value);
	if (Number.isNaN(fraction) || fraction < 0 || fraction > 1) {
		throw new BadRequestError(new Error(`${label} must be a number between 0 and 1`));
	}
	return fraction;
};

router.post('/api/superadmin/feature-flags', async (req, res, next) => {
	try {
		await assertSuperAdmin(req);
		const name = String(req.body.name ?? '').trim();
		if (!featureFlagNamePattern.test(name)) {
			throw new BadRequestError(
				new Error(
					'Flag names must start with a letter and contain only letters, numbers, hyphens, and underscores (e.g. newActivityDash)',
				),
			);
		}
		const existing = await FeatureFlag.findOne({ where: { name } });
		if (existing) {
			throw new BadRequestError(new Error(`A feature flag named "${name}" already exists`));
		}
		const flag = await createFeatureFlag(name);
		return res.status(201).json(sanitizeFeatureFlag(await getFeatureFlagWithCounts(flag.id)));
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

router.put('/api/superadmin/feature-flags/:id', async (req, res, next) => {
	try {
		await assertSuperAdmin(req);
		const flag = await getFeatureFlagWithCounts(req.params.id);
		const { enabledUsersFraction, enabledCommunitiesFraction } = req.body;
		if (enabledUsersFraction !== undefined) {
			flag.enabledUsersFraction = parseFraction(enabledUsersFraction, 'enabledUsersFraction');
		}
		if (enabledCommunitiesFraction !== undefined) {
			flag.enabledCommunitiesFraction = parseFraction(
				enabledCommunitiesFraction,
				'enabledCommunitiesFraction',
			);
		}
		await flag.save();
		return res.json(sanitizeFeatureFlag(flag));
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

router.delete('/api/superadmin/feature-flags/:id', async (req, res, next) => {
	try {
		await assertSuperAdmin(req);
		const flag = await FeatureFlag.findByPk(req.params.id);
		if (!flag) {
			throw new NotFoundError(new Error('Feature flag not found'));
		}
		await Promise.all([
			FeatureFlagCommunity.destroy({ where: { featureFlagId: flag.id } }),
			FeatureFlagUser.destroy({ where: { featureFlagId: flag.id } }),
		]);
		await flag.destroy();
		return res.json({ id: req.params.id });
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

router.get('/api/superadmin/feature-flags/:id/overrides', async (req, res, next) => {
	try {
		await assertSuperAdmin(req);
		const flag = await FeatureFlag.findByPk(req.params.id);
		if (!flag) {
			throw new NotFoundError(new Error('Feature flag not found'));
		}
		const [communityOverrides, userOverrides] = await Promise.all([
			FeatureFlagCommunity.findAll({
				where: { featureFlagId: flag.id },
				include: [
					{ model: Community, as: 'community', attributes: ['id', 'title', 'subdomain'] },
				],
			}),
			FeatureFlagUser.findAll({
				where: { featureFlagId: flag.id },
				include: [
					{
						model: User,
						as: 'user',
						attributes: ['id', 'fullName', 'slug', 'avatar', 'initials'],
					},
				],
			}),
		]);
		return res.json({
			communities: communityOverrides
				.map((o) => ({
					communityId: o.communityId,
					enabled: Boolean(o.enabled),
					title: o.community?.title ?? '(unknown)',
					subdomain: o.community?.subdomain ?? '',
				}))
				.sort((a, b) => a.title.localeCompare(b.title)),
			users: userOverrides
				.map((o) => ({
					userId: o.userId,
					enabled: Boolean(o.enabled),
					fullName: o.user?.fullName ?? '(unknown)',
					slug: o.user?.slug ?? '',
					avatar: o.user?.avatar ?? null,
					initials: o.user?.initials ?? '?',
				}))
				.sort((a, b) => a.fullName.localeCompare(b.fullName)),
		});
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

router.put('/api/superadmin/feature-flags/:id/community-override', async (req, res, next) => {
	try {
		await assertSuperAdmin(req);
		const flag = await FeatureFlag.findByPk(req.params.id);
		if (!flag) {
			throw new NotFoundError(new Error('Feature flag not found'));
		}
		const state = parseOverrideState(req.body.state);
		if (!req.body.communityId) {
			throw new BadRequestError(new Error('communityId is required'));
		}
		const community = await resolveCommunity(req.body.communityId);
		await setFeatureFlagOverrideForCommunity(flag.id, community.id, state);
		return res.json({
			communityId: community.id,
			title: community.title,
			subdomain: community.subdomain,
			state,
		});
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

router.put('/api/superadmin/feature-flags/:id/user-override', async (req, res, next) => {
	try {
		await assertSuperAdmin(req);
		const flag = await FeatureFlag.findByPk(req.params.id);
		if (!flag) {
			throw new NotFoundError(new Error('Feature flag not found'));
		}
		const state = parseOverrideState(req.body.state);
		if (!req.body.userId) {
			throw new BadRequestError(new Error('userId is required'));
		}
		const user = await User.findByPk(String(req.body.userId).trim(), {
			attributes: ['id', 'fullName', 'slug', 'avatar', 'initials'],
		});
		if (!user) {
			throw new NotFoundError(new Error('User not found'));
		}
		await setFeatureFlagOverrideForUser(flag.id, user.id, state);
		return res.json({
			userId: user.id,
			fullName: user.fullName,
			slug: user.slug,
			avatar: user.avatar,
			initials: user.initials,
			state,
		});
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// JSON API for lazy-loading suggested-hubs sidebar summaries
router.get('/api/superadmin/suggested-hubs-summaries', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		const summaries = await getEduDomainSummaries({ publicOnly: true });
		return res.json(summaries);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// JSON API for lazy-loading suggested-hubs domain detail
router.get('/api/superadmin/suggested-hubs/:domain', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		const { domain } = req.params;
		const results = await getEduDomainDetailData({ domain, publicOnly: true });
		const group = results[0] ?? null;
		return res.json(group);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// JSON API for lazy-loading suggested-hubs collaborators (fetched on-demand)
router.get('/api/superadmin/suggested-hubs/:domain/collaborators', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		const { domain } = req.params;
		const collaborators = await getEduCollaborators(domain, { publicOnly: true });
		return res.json(collaborators);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// JSON API for lazy-loading suggested-hubs activity feed (fetched on-demand)
router.get('/api/superadmin/suggested-hubs/:domain/activity', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		const { domain } = req.params;
		const feed = await getActivityFeed(domain, { publicOnly: true });
		return res.json(feed);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// JSON API for known search term content mentions for a domain (cross-reference)
router.get('/api/superadmin/suggested-hubs/:domain/content-mentions', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		const { domain } = req.params;
		const mentions = await getContentMentionsForDomain(domain);
		return res.json(mentions);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// ── Content Search APIs ─────────────────────────────────────────────────────

const CONTENT_SEARCH_CACHE_TTL_MS = 60 * 60 * 1000;
let cachedContentSearchCounts: { data: any; expiresAt: number } | null = null;

// GET /api/superadmin/content-search — known search term counts
router.get('/api/superadmin/content-search', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		if (cachedContentSearchCounts && Date.now() < cachedContentSearchCounts.expiresAt) {
			return res.json(cachedContentSearchCounts.data);
		}

		const terms = await getContentSearchCounts();
		const data = { terms };
		cachedContentSearchCounts = { data, expiresAt: Date.now() + CONTENT_SEARCH_CACHE_TTL_MS };
		return res.json(data);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// GET /api/superadmin/content-search/:termIndex/pubs — pubs for a known term
router.get('/api/superadmin/content-search/:termIndex/pubs', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const termIndex = parseInt(req.params.termIndex, 10);
		if (Number.isNaN(termIndex) || termIndex < 0) {
			return res.status(400).json({ error: 'Invalid term index' });
		}

		const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
		const offset = parseInt(req.query.offset as string, 10) || 0;

		const result = await getContentSearchPubs(termIndex, { limit, offset });
		return res.json(result);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// GET /api/superadmin/content-search/adhoc/pubs?q=phrase — ad-hoc phrase search
router.get('/api/superadmin/content-search/adhoc/pubs', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const phrase = (req.query.q as string) || '';
		if (!phrase.trim()) {
			return res.json({ pubs: [], total: 0 });
		}

		const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
		const offset = parseInt(req.query.offset as string, 10) || 0;

		const result = await getContentSearchPubsByPhrase(phrase, { limit, offset });
		return res.json(result);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

router.get('/superadmin/:tabKind', async (req, res, next) => {
	try {
		const { tabKind } = req.params;
		if (!isSuperAdminTabKind(tabKind)) {
			throw new NotFoundError();
		}
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		return renderToNodeStream(
			res,
			<Html
				chunkName="SuperAdminDashboard"
				initialData={initialData}
				viewData={{
					tabKind,
					tabProps: await getTabProps(tabKind, initialData.locationData),
				}}
				headerComponents={generateMetaComponents({
					initialData,
					title: 'SuperAdmin · PubPub',
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
