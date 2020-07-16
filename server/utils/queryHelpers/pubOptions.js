import {
	Branch,
	Collection,
	CollectionAttribution,
	CollectionPub,
	Community,
	Export,
	Page,
	PubAttribution,
	PubEdge,
	Release,
	DiscussionNew,
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
				model: Member,
				as: 'members',
			},
		];
	}
	if (getEdges) {
		pubEdges = [
			{
				model: PubEdge,
				as: 'outboundEdges',
				separate: true,
				include: getPubEdgeIncludes({ includeTargetPub: true }),
			},
			{
				model: PubEdge,
				as: 'inboundEdges',
				separate: true,
				include: getPubEdgeIncludes({ includePub: true }),
				where: !allowUnapprovedEdges && { approvedByTarget: true },
			},
		];
	}
	if (getCollections) {
		collectionPubs = [
			{
				model: CollectionPub,
				as: 'collectionPubs',
				separate: true,
				include: [
					{
						model: Collection,
						as: 'collection',
						include: [
							{
								model: Page,
								as: 'page',
								attributes: ['id', 'title', 'slug'],
							},
							{
								model: Member,
								as: 'members',
							},
							{
								model: CollectionAttribution,
								as: 'attributions',
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
				model: Community,
				as: 'community',
				attributes: [
					'id',
					'subdomain',
					'domain',
					'title',
					'accentColorLight',
					'accentColorDark',
					'headerLogo',
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
				model: DiscussionNew,
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
			...collectionPubs,
			...community,
		],
	};
};
