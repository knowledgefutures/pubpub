import {
	Branch,
	Collection,
	CollectionAttribution,
	CollectionPub,
	Export,
	Page,
	PubAttribution,
	Release,
	Thread,
	ThreadUser,
	User,
} from '../../models';
import { attributesPublicUser } from '..';

export default ({ isAuth, isPreview, getCollections }) => {
	/* Initialize values assuming all inputs are false. */
	/* Then, iterate over each input and adjust */
	/* variables as needed */
	let pubAttributes;
	let pubAttributions = [
		{
			model: PubAttribution,
			as: 'attributions',
			required: false,
			separate: true,
			include: [
				{
					model: User,
					as: 'user',
					required: false,
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
			required: false,
		},
	];
	let collectionPubs = [];
	let threadAuthor = [
		{
			model: User,
			as: 'author',
			attributes: attributesPublicUser,
		},
	];
	let threadUserInclude = [
		{
			model: User,
			as: 'user',
			attributes: attributesPublicUser,
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
			'createdAt',
		];
		pubBranches = [];
		threadAuthor = [];
		threadUserInclude = [];
	}
	if (isAuth) {
		pubAttributes = ['id'];
		pubBranches = [];
		pubReleases = [];
		pubAttributions = [];
		threadAuthor = [];
		threadUserInclude = [];
	}
	if (getCollections) {
		collectionPubs = [
			{
				model: CollectionPub,
				as: 'collectionPubs',
				required: false,
				separate: true,
				include: [
					{
						model: Collection,
						as: 'collection',
						include: [
							{
								model: Page,
								as: 'page',
								required: false,
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
	return {
		attributes: pubAttributes,
		include: [
			...pubAttributions,
			...pubBranches,
			...pubReleases,
			{
				separate: true,
				required: false,
				model: Thread,
				as: 'threads',
				include: [
					...threadAuthor,
					{
						model: ThreadUser,
						as: 'threadUsers',
						include: threadUserInclude,
					},
				],
			},
			...collectionPubs,
		],
	};
};
