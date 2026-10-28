import { initServer } from '@ts-rest/express';
import { Op } from 'sequelize';

import { setSubdomain } from 'server/dev/api';
import { Community, User, WorkerTask } from 'server/models';
import { updateDiscussionCreationAccess } from 'server/publicPermissions/queries';
import { verifyCaptchaPayload } from 'server/utils/captcha';
import { BadRequestError, ForbiddenError, NotFoundError } from 'server/utils/errors';
import { handleHoneypotTriggered, isHoneypotFilled } from 'server/utils/honeypot';
import { addWorkerTask } from 'server/utils/workers';
import { contract } from 'utils/api/contract';
import { expect } from 'utils/assert';
import { communityUrl } from 'utils/canonicalUrls';
import {
	ensureUserIsCommunityAdmin,
	findCommunityByHostname,
} from 'utils/ensureUserIsCommunityAdmin';
import { isDevelopment, isDuqDuq, isProd } from 'utils/environment';
import { createGetRequestIds } from 'utils/getRequestIds';

import { applyTemplate } from '../communityTemplate/applyTemplate';
import { CommunityTemplate } from '../communityTemplate/model';
import { createTemplateFromCommunity } from '../communityTemplate/queries';
import { addCommunityToOrg, getOrgBySlug, isUserOrgMember } from '../org/queries';
import { addSpamTagToCommunity, updateSpamTagForCommunity } from '../spamTag/communityQueries';
import { destroyCommunity, getCommunityDeletionAudit } from './destroyCommunity';
import { getPermissions } from './permissions';
import {
	CommunityURLAlreadyExistsError,
	createCommunity,
	getCommunity,
	updateCommunity,
} from './queries';

const getRequestIds = createGetRequestIds<{
	communityId?: string | null;
}>();

const s = initServer();

const MAX_DAILY_EXPORTS = 2;

export const communityServer = s.router(contract.community, {
	communityExport: async ({ req }) => {
		const community = await ensureUserIsCommunityAdmin(req);

		const permissions = await getPermissions({
			userId: req.user?.id,
			communityId: community.id,
		});

		if (!permissions.communityExport) {
			throw new ForbiddenError();
		}

		const recentExportCount = await WorkerTask.count({
			where: {
				type: 'communityExport',
				createdAt: {
					[Op.lt]: new Date(),
					[Op.gt]: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
				},
				input: {
					communityId: community.id,
				},
			},
		});

		if (!req.user?.dataValues.isSuperAdmin && recentExportCount >= MAX_DAILY_EXPORTS) {
			throw new Error('You have reached the maximum number of daily exports.');
		}

		const key = `exports/community/${community.id}/${Date.now()}`;

		// check if there's already one running
		const runningTask = await WorkerTask.findOne({
			where: {
				type: 'communityExport',
				input: { communityId: community.id },
				isProcessing: true,
			},
		});

		if (runningTask) {
			return {
				body: {
					workerTaskId: runningTask.id,
					message:
						'Export already in progress. You will receive an email when it is ready.',
				},
				status: 200,
			};
		}

		const workerTask = await addWorkerTask({
			type: 'communityExport',
			input: {
				communityId: community.id,
				key,
				requestedByEmail: req.user?.email,
			},
		});

		return {
			body: { workerTaskId: workerTask.id },
			status: 200,
		};
	},

	getCommunities: async ({ req }) => {
		const community = expect(await findCommunityByHostname(req.hostname));

		return {
			body: [community],
			status: 200,
		};
	},
	get: async ({ params }) => {
		const community = await getCommunity(params.id);

		if (!community) {
			throw new NotFoundError();
		}

		return {
			body: community,
			status: 200,
		};
	},
	create: async ({ req }) => {
		if (!req.user) {
			throw new ForbiddenError();
		}
		if (isHoneypotFilled(req.body)) {
			await handleHoneypotTriggered(
				expect(req.user).id,
				'create-community',
				String(req.body._honeypot),
				{
					content: req.body.title
						? `title: ${req.body.title}, subdomain: ${req.body.subdomain}`
						: undefined,
				},
			);
			const subdomain = req.body.subdomain ?? 'community';
			return {
				body: `https://${subdomain}.pubpub.org`,
				status: 201,
			};
		}
		if (!(await verifyCaptchaPayload(req.body.altcha))) {
			throw new BadRequestError(new Error('Please complete the verification and try again.'));
		}
		const body = { ...req.body };
		delete body.altcha;
		delete body._honeypot;
		try {
			// Resolve org context before creating the community
			const orgSlug = (req as any).body.orgSlug as string | undefined;
			let validatedOrg: Awaited<ReturnType<typeof getOrgBySlug>> | null = null;

			if (orgSlug) {
				const org = await getOrgBySlug(orgSlug);
				if (org && org.communityCreationEnabled) {
					// Server-side domain validation: user email must match org domains (or be superadmin)
					const user = await User.findByPk(req.user!.id, {
						attributes: ['email', 'isSuperAdmin'],
					});
					if (user?.isSuperAdmin) {
						validatedOrg = org;
					} else if (user?.email && org.domains && org.domains.length > 0) {
						const emailDomain = user.email.split('@')[1]?.toLowerCase();
						if (emailDomain) {
							const matches = (org.domains as string[]).some((d) => {
								const pattern = d.toLowerCase();
								return (
									emailDomain === pattern || emailDomain.endsWith(`.${pattern}`)
								);
							});
							if (matches) {
								validatedOrg = org;
							}
						}
					}
				}
			}

			// Skip awaiting-approval email + Slack for org-created communities
			const newCommunity = await createCommunity(body, req.user, !validatedOrg);

			// Apply template if one was selected
			const templateId = (req as any).body.templateId as string | undefined;
			const cloneCommunityId = (req as any).body.cloneCommunityId as string | undefined;

			if (templateId) {
				try {
					const created = await Community.findOne({
						where: { subdomain: newCommunity.subdomain },
						attributes: ['id'],
					});
					if (created) {
						// Validate: if org context, ensure template belongs to the org
						if (validatedOrg) {
							const template = await CommunityTemplate.findOne({
								where: { id: templateId, orgId: validatedOrg.id, isActive: true },
							});
							if (!template) {
								console.warn(
									`Template ${templateId} not found or not active for org ${validatedOrg.id}`,
								);
							} else {
								await applyTemplate(template, created.id, req.user!.id);
								await created.update({ templateId });
							}
						} else {
							// No org context — superadmin or direct template usage
							const template = await CommunityTemplate.findByPk(templateId);
							if (template && template.isActive) {
								await applyTemplate(template, created.id, req.user!.id);
								await created.update({ templateId });
							}
						}
					}
				} catch (templateErr) {
					// Non-fatal: community was created, template just didn't apply
					console.error('Failed to apply template:', templateErr);
				}
			} else if (cloneCommunityId && validatedOrg) {
				// Clone-from-community: find or create an inactive clone template
				try {
					// Check that clone access is enabled for this org
					const cloneAccess = validatedOrg.communityCloneAccess || 'off';
					let cloneAllowed = false;
					if (cloneAccess === 'everyone') {
						cloneAllowed = true;
					} else if (cloneAccess === 'managers') {
						const user = await User.findByPk(req.user!.id, {
							attributes: ['isSuperAdmin'],
						});
						if (user?.isSuperAdmin) {
							cloneAllowed = true;
						} else {
							cloneAllowed = await isUserOrgMember(req.user!.id, validatedOrg.id);
						}
					}

					if (!cloneAllowed) {
						console.warn(
							`Clone access denied for user ${req.user!.id} on org ${validatedOrg.id} (access: ${cloneAccess})`,
						);
					} else {
						// Verify the org owns the source community
						const ownedSource = await Community.findOne({
							where: { id: cloneCommunityId, orgId: validatedOrg.id },
							attributes: ['id'],
						});
						if (ownedSource) {
							const created = await Community.findOne({
								where: { subdomain: newCommunity.subdomain },
								attributes: ['id'],
							});
							if (created) {
								// Reuse existing clone template if one exists for this source community + org
								let cloneTemplate = await CommunityTemplate.findOne({
									where: {
										orgId: validatedOrg.id,
										sourceCommunityId: cloneCommunityId,
										isActive: false,
									},
								});
								if (!cloneTemplate) {
									const sourceCommunity = await Community.findByPk(
										cloneCommunityId,
										{ attributes: ['title', 'subdomain'] },
									);
									const label =
										sourceCommunity?.title ||
										sourceCommunity?.subdomain ||
										'community';
									const { template } = await createTemplateFromCommunity(
										cloneCommunityId,
										{
											title: `Clone of ${label}`,
											slug: `clone-${sourceCommunity?.subdomain || cloneCommunityId.slice(0, 8)}`,
											createdById: req.user!.id,
										},
									);
									await template.update({ orgId: validatedOrg.id });
									cloneTemplate = template;
								}
								await applyTemplate(cloneTemplate, created.id, req.user!.id);
								await created.update({ templateId: cloneTemplate.id });
							}
						}
					}
				} catch (cloneErr) {
					// Non-fatal: community was created, clone just didn't apply
					console.error('Failed to apply clone template:', cloneErr);
				}
			}

			// A community created through an org belongs to it, if domain validation passed
			if (validatedOrg) {
				try {
					const created = await Community.findOne({
						where: { subdomain: newCommunity.subdomain },
						attributes: ['id'],
					});
					if (created) {
						await addCommunityToOrg(validatedOrg.id, created.id);
						// Ensure spam tag exists, then mark as not-spam
						await addSpamTagToCommunity(created.id);
						await updateSpamTagForCommunity({
							communityId: created.id,
							status: 'confirmed-not-spam',
							skipEmail: true,
						});
					}
				} catch (_e) {
					// Non-fatal: community was still created
				}
			}

			if (isDevelopment()) {
				await setSubdomain(newCommunity.subdomain);
				return {
					body: `http://localhost:9876`,
					status: 201,
				};
			}

			const baseUrl = communityUrl(newCommunity);

			return {
				body: baseUrl,
				status: 201,
			};
		} catch (e) {
			if (e instanceof CommunityURLAlreadyExistsError) {
				return {
					body: e.message,
					status: 409,
				};
			}
			console.error(e);
			throw new Error('Failed to create community');
		}
	},
	update: async ({ body, req }) => {
		const requestIds = getRequestIds(body, req.user);
		const permissions = await getPermissions(requestIds);
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const updatedValues = await updateCommunity(req.body, permissions.update, req.user.id);
		if (
			body.discussionCreationAccess !== undefined &&
			requestIds.communityId &&
			permissions.update
		) {
			await updateDiscussionCreationAccess({
				communityId: requestIds.communityId,
				discussionCreationAccess: body.discussionCreationAccess,
			});
		}
		return {
			body: updatedValues,
			status: 200,
		};
	},

	deletionAudit: async ({ params, req }) => {
		const community = await ensureUserIsCommunityAdmin({ ...req, id: params.id });
		const audit = await getCommunityDeletionAudit(community.id);
		return { status: 200, body: audit };
	},

	remove: async ({ params, body, req }) => {
		const community = await ensureUserIsCommunityAdmin({ ...req, id: params.id });

		if (community.title !== body.confirmationTitle) {
			throw new BadRequestError(
				new Error(
					'Confirmation title does not match. Please type the exact community title to confirm deletion.',
				),
			);
		}

		await destroyCommunity(community.id, req.user!.id);
		return { status: 200, body: { success: true } };
	},
});
