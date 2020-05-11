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
	User,
	Member,
} from '../../models';
import { attributesPublicUser } from '../attributesPublicUser';
import { baseAuthor, baseThread, baseVisibility } from './util';

export default ({ isAuth, isPreview, getCollections, getMembers, getCommunity }) => {
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
	let pubMembers = [];
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
	const visibility = baseVisibility;
	return {
		attributes: pubAttributes,
		include: [
			...pubAttributions,
			...pubBranches,
			...pubReleases,
			...pubMembers,
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
