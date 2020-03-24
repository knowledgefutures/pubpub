import {
	Branch,
	Collection,
	CollectionAttribution,
	CollectionPub,
	Community,
	Export,
	Page,
	PubAttribution,
	Release,
	DiscussionNew,
	ReviewNew,
	Fork,
	Anchor,
	Visibility,
	Thread,
	ThreadEvent,
	ThreadComment,
	User,
} from '../../models';
import { attributesPublicUser } from '..';

export default ({ isAuth, isPreview, getCollections, getCommunity }) => {
	/* Initialize values assuming all inputs are false. */
	/* Then, iterate over each input and adjust */
	/* variables as needed */
	let pubAttributes;
	let pubAttributions = [
		{
			model: PubAttribution,
			as: 'attributions',
			separate: true,
			include: [
				{
					model: User,
					as: 'user',
					attributes: attributesPublicUser,
				},
			],
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
	let pubReleases = [
		{
			model: Release,
			as: 'releases',
		},
	];
	let collectionPubs = [];
	let community = [];
	let anchor = [{ model: Anchor, as: 'anchor' }];
	let author = [
		{
			model: User,
			as: 'author',
			attributes: attributesPublicUser,
		},
	];
	let thread = [
		{
			model: Thread,
			as: 'thread',
			include: [
				{
					model: ThreadComment,
					as: 'comments',
					include: [
						{
							model: User,
							as: 'author',
							attributes: attributesPublicUser,
						},
					],
				},
				{
					model: ThreadEvent,
					as: 'events',
					include: [
						{
							model: User,
							as: 'user',
							attributes: attributesPublicUser,
						},
					],
				},
			],
		},
	];
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
								model: CollectionAttribution,
								as: 'attributions',
								include: [
									{
										model: User,
										as: 'user',
									},
								],
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
	const visibility = [
		{
			model: Visibility,
			as: 'visibility',
			include: [
				{
					model: User,
					as: 'users',
					attributes: attributesPublicUser,
				},
			],
		},
	];
	return {
		attributes: pubAttributes,
		include: [
			...pubAttributions,
			...pubBranches,
			...pubReleases,
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
