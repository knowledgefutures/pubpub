import { QueryTypes } from 'sequelize';

import { Community } from 'server/community/model';
import { Hub } from 'server/hub/model';
import { HubPub } from 'server/hubPub/model';
import { Pub } from 'server/pub/model';
import { PubAttribution } from 'server/pubAttribution/model';
import { Release } from 'server/release/model';
import { sequelize } from 'server/sequelize';
import { SpamTag } from 'server/spamTag/model';
import { User } from 'server/user/model';

/* ------------------------------------------------------------------ */
/* Hub-side queries (for hub managers / superadmins)                    */
/* ------------------------------------------------------------------ */

export const getHubPubs = async (hubId: string) => {
	const records = await HubPub.findAll({
		where: { hubId },
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
		.filter((r: any) => r.pub && r.pub.community?.spamTag?.status !== 'confirmed');
};

/** Featured pubs for the hub landing page (showOnLandingPage + has releases) */
export const getLandingPagePubs = async (hubId: string) => {
	const records = await HubPub.findAll({
		where: { hubId, showOnLandingPage: true },
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
				return pub && pub.community?.spamTag?.status !== 'confirmed';
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

export const addPubToHub = async (
	hubId: string,
	pubId: string,
	opts?: { rank?: string; showOnLandingPage?: boolean },
) => {
	const [record] = await HubPub.findOrCreate({
		where: { hubId, pubId },
		defaults: {
			rank: opts?.rank ?? null,
			...(opts?.showOnLandingPage !== undefined && {
				showOnLandingPage: opts.showOnLandingPage,
			}),
		} as any,
	});
	return record.toJSON();
};

export const removePubFromHub = async (hubId: string, pubId: string) => {
	return HubPub.destroy({ where: { hubId, pubId } });
};

/* ------------------------------------------------------------------ */
/* Pub-side queries (for pub admins/managers via "Curated By" tab)      */
/* ------------------------------------------------------------------ */

export const getHubsForPub = async (pubId: string) => {
	const associations = await HubPub.findAll({
		where: { pubId },
		include: [{ model: Hub }],
	});
	return associations
		.map((a) => {
			const json = a.toJSON() as any;
			return json.hub
				? {
						...json.hub,
						dataAccess: json.dataAccess,
					}
				: null;
		})
		.filter(Boolean);
};

export const getHubPubRecord = async (hubId: string, pubId: string) => {
	return HubPub.findOne({ where: { hubId, pubId } });
};
