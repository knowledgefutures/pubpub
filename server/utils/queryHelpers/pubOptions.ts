import {
	Branch,
	Collection,
	CollectionAttribution,
	CollectionPub,
	Community,
	CrossrefDepositRecord,
	Export,
	Page,
	PubAttribution,
	PubEdge,
	Release,
	Discussion,
	ReviewNew,
	Fork,
	Anchor,
	Member,
	includeUserModel,
} from 'server/models';

import { getPubEdgeIncludes } from './pubEdgeOptions';
import { baseAuthor, baseThread, baseVisibility } from './util';

export default ({
	isAuth,
	isPreview,
	getCollections,
	getMembers,
	getCommunity,
	getEdges = 'approved-only',
	getEdgesOptions,
}) => {
	const allowUnapprovedEdges = getEdges === 'all';
	/* Initialize values assuming all inputs are false. */
	/* Then, iterate over each input and adjust */
	/* variables as needed */
	let pubAttributes;
	let pubAttributions = [
		{
			model: PubAttribution,
			as: 'attributions',
			separate: true,
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ as: string; }' is not assignab... Remove this comment to see the full error message
			include: [includeUserModel({ as: 'user' })],
		},
	];
	let pubBranches = [
		{
			model: Branch,
			as: 'branches',
			required: true,
			include: [
				{
					model: Export,
					as: 'exports',
				},
			],
		},
	];
	let pubMembers = [];
	let pubEdges = [];
	let pubReleases = [
		{
			model: Release,
			as: 'releases',
		},
	];
	let collectionPubs = [];
	let community = [];
	let anchor = [{ model: Anchor, as: 'anchor' }];
	let author = baseAuthor;
	let thread = baseThread;
	if (isPreview) {
		pubAttributes = [
			'id',
			'slug',
			'title',
			'description',
			'labels',
			'avatar',
			'doi',
			'communityId',
			'customPublishedAt',
			'createdAt',
		];
		pubBranches = [];
		author = [];
		thread = [];
		anchor = [];
	}
	if (isAuth) {
		pubAttributes = ['id'];
		pubBranches = [];
		pubReleases = [];
		pubAttributions = [];
		author = [];
		thread = [];
		anchor = [];
	}
	if (getMembers) {
		pubMembers = [
			{
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
				model: Member,
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				as: 'members',
			},
		];
	}
	if (getEdges) {
		pubEdges = [
			{
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
				model: PubEdge,
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				as: 'outboundEdges',
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
				separate: true,
				// @ts-expect-error ts-migrate(2322) FIXME: Type '({ model: any; as: string; include: ({ model... Remove this comment to see the full error message
				include: getPubEdgeIncludes({
					...getEdgesOptions,
					includeTargetPub: true,
				}),
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				order: [['rank', 'ASC']],
			},
			{
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
				model: PubEdge,
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				as: 'inboundEdges',
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
				separate: true,
				// @ts-expect-error ts-migrate(2322) FIXME: Type '({ model: any; as: string; include: ({ model... Remove this comment to see the full error message
				include: getPubEdgeIncludes({ ...getEdgesOptions, includePub: true }),
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'false | { approvedByTarget: true; }' is not ... Remove this comment to see the full error message
				where: !allowUnapprovedEdges && { approvedByTarget: true },
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				order: [['rank', 'ASC']],
			},
		];
	}
	if (getCollections) {
		collectionPubs = [
			{
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
				model: CollectionPub,
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				as: 'collectionPubs',
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
				separate: true,
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				order: [['pubRank', 'ASC']],
				include: [
					{
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
						model: Collection,
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
						as: 'collection',
						include: [
							{
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
								model: Page,
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
								as: 'page',
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
								attributes: ['id', 'title', 'slug'],
							},
							{
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
								model: Member,
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
								as: 'members',
							},
							{
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
								model: CollectionAttribution,
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
								as: 'attributions',
								// @ts-expect-error ts-migrate(2322) FIXME: Type '{ model: any; attributes: any[]; }' is not a... Remove this comment to see the full error message
								include: [includeUserModel({ as: 'user' })],
							},
						],
					},
				],
			},
		];
	}
	if (getCommunity) {
		community = [
			{
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
				model: Community,
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				as: 'community',
				attributes: [
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
					'id',
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
					'subdomain',
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
					'domain',
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
					'title',
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
					'accentColorLight',
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
					'accentColorDark',
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
					'headerLogo',
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
					'headerColorType',
				],
			},
		];
	}
	const visibility = baseVisibility;
	return {
		attributes: pubAttributes,
		include: [
			...pubAttributions,
			...pubBranches,
			...pubReleases,
			...pubMembers,
			...pubEdges,
			{
				separate: true,
				model: Discussion,
				as: 'discussions',
				include: [...author, ...anchor, ...visibility, ...thread],
			},
			{
				separate: true,
				model: Fork,
				as: 'forks',
				include: [...author, ...visibility, ...thread],
			},
			{
				separate: true,
				model: ReviewNew,
				as: 'reviews',
				include: [...author, ...visibility, ...thread],
			},
			{
				model: CrossrefDepositRecord,
				as: 'crossrefDepositRecord',
			},
			...collectionPubs,
			...community,
		],
	};
};
