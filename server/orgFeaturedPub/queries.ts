import { QueryTypes } from 'sequelize';

import { Community } from 'server/community/model';
import { OrgFeaturedPub } from 'server/orgFeaturedPub/model';
import { Pub } from 'server/pub/model';
import { PubAttribution } from 'server/pubAttribution/model';
import { Release } from 'server/release/model';
import { sequelize } from 'server/sequelize';
import { SpamTag } from 'server/spamTag/model';
import { User } from 'server/user/model';

/* ------------------------------------------------------------------ */
/* Org-side queries (for org managers / superadmins)                    */
/* ------------------------------------------------------------------ */

export const getOrgFeaturedPubs = async (orgId: string) => {
	const records = await OrgFeaturedPub.findAll({
		where: { orgId },
		include: [
			{
				model: Pub,
				attributes: ['id', 'title', 'slug', 'avatar', 'description', 'communityId'],
				include: [
					{
						model: Community,
						as: 'community',
						attributes: ['title', 'subdomain', 'domain'],
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
			},
		],
		order: [['rank', 'ASC NULLS LAST']],
	});
	return records
		.map((r) => r.toJSON())
		.filter((r: any) => r.pub && r.pub.community?.spamTag?.status !== 'confirmed-spam');
};

/** Featured pubs for the org landing page (showOnLandingPage + has releases) */
export const getLandingPagePubs = async (orgId: string) => {
	const records = await OrgFeaturedPub.findAll({
		where: { orgId, showOnLandingPage: true },
		include: [
			{
				model: Pub,
				attributes: [
					'id',
					'title',
					'slug',
					'avatar',
					'description',
					'communityId',
					'customPublishedAt',
				],
				required: true,
				include: [
					{
						model: Release,
						attributes: [],
						required: true,
					},
					{
						model: Community,
						as: 'community',
						attributes: ['id', 'subdomain', 'domain', 'title', 'accentColorDark'],
						include: [
							{
								model: SpamTag,
								as: 'spamTag',
								attributes: ['status'],
								required: false,
							},
						],
					},
					{
						model: PubAttribution,
						as: 'attributions',
						attributes: ['name', 'order', 'isAuthor'],
						where: { isAuthor: true },
						required: false,
						include: [
							{
								model: User,
								attributes: ['fullName'],
								required: false,
							},
						],
					},
				],
			},
		],
		order: [['rank', 'ASC NULLS LAST']],
	});

	return Promise.all(
		records
			.filter((r) => {
				const pub = (r as any).pub;
				return pub && pub.community?.spamTag?.status !== 'confirmed-spam';
			})
			.map(async (r) => {
				const json = r.toJSON() as any;
				const pub = json.pub;
				// Get first release date as publishedAt fallback
				const firstRelease = await Release.findOne({
					where: { pubId: pub.id },
					attributes: ['createdAt'],
					order: [['createdAt', 'ASC']],
				});
				const attributions = (pub.attributions || [])
					.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
					.map((a: any) => a.user?.fullName || a.name)
					.filter(Boolean);
				return {
					id: pub.id,
					title: pub.title,
					slug: pub.slug,
					avatar: pub.avatar,
					description: pub.description,
					communityId: pub.communityId,
					communityTitle: pub.community?.title || '',
					communitySlug: pub.community?.subdomain || '',
					communityDomain: pub.community?.domain || null,
					communityAccent: pub.community?.accentColorDark || null,
					byline: attributions.join(', '),
					publishedAt: pub.customPublishedAt || firstRelease?.createdAt || null,
				};
			}),
	);
};

export const addPubToOrg = async (
	orgId: string,
	pubId: string,
	opts?: { rank?: string; showOnLandingPage?: boolean },
) => {
	const [record] = await OrgFeaturedPub.findOrCreate({
		where: { orgId, pubId },
		defaults: {
			rank: opts?.rank ?? null,
			...(opts?.showOnLandingPage !== undefined && {
				showOnLandingPage: opts.showOnLandingPage,
			}),
		} as any,
	});
	return record.toJSON();
};

export const removePubFromOrg = async (orgId: string, pubId: string) => {
	return OrgFeaturedPub.destroy({ where: { orgId, pubId } });
};
