/* eslint-disable global-require */
const Sequelize = require('sequelize');
const passportLocalSequelize = require('passport-local-sequelize');

// const operatorsAliases = {
// 	$or: Sequelize.Op.or,
// 	$and: Sequelize.Op.and,
// 	$ilike: Sequelize.Op.iLike,
// 	$in: Sequelize.Op.in,
// 	$not: Sequelize.Op.not,
// 	$eq: Sequelize.Op.eq,
// 	$ne: Sequelize.Op.ne,
// 	$lt: Sequelize.Op.lt,
// 	$gt: Sequelize.Op.gt,
// };

const sequelize = new Sequelize(process.env.V5_PROD_DATABASE_URL, {
	logging: () => {},
	dialectOptions: { ssl: true },
});

// Change to true to update the model in the database.
// NOTE: This being set to true will erase your data.
sequelize.sync({ force: false });

const id = {
	primaryKey: true,
	type: Sequelize.UUID,
	defaultValue: Sequelize.UUIDV4,
};

const Community = sequelize.define('Community', {
	id: id,
	subdomain: {
		type: Sequelize.TEXT,
		unique: true,
		allowNull: false,
		validate: {
			isLowercase: true,
			len: [1, 280],
			is: /^[a-zA-Z0-9-]+$/, // Must contain at least one letter, alphanumeric and hyphens
		},
	},
	domain: {
		type: Sequelize.TEXT,
		unique: true,
	},
	title: { type: Sequelize.TEXT, allowNull: false },
	description: {
		type: Sequelize.TEXT,
		validate: {
			len: [0, 280],
		},
	},
	avatar: { type: Sequelize.TEXT },
	favicon: { type: Sequelize.TEXT },
	accentColor: { type: Sequelize.STRING },
	hideCreatePubButton: { type: Sequelize.BOOLEAN },
	headerLogo: { type: Sequelize.TEXT },
	headerLinks: { type: Sequelize.JSONB },
	hideHero: { type: Sequelize.BOOLEAN },
	hideHeaderLogo: { type: Sequelize.BOOLEAN },
	heroLogo: { type: Sequelize.TEXT },
	heroBackgroundImage: { type: Sequelize.TEXT },
	heroBackgroundColor: { type: Sequelize.TEXT },
	heroTextColor: { type: Sequelize.TEXT },
	useHeaderGradient: { type: Sequelize.BOOLEAN },
	heroImage: { type: Sequelize.TEXT },
	heroTitle: { type: Sequelize.TEXT },
	heroText: { type: Sequelize.TEXT },
	heroPrimaryButton: { type: Sequelize.JSONB },
	heroSecondaryButton: { type: Sequelize.JSONB },
	heroAlign: { type: Sequelize.TEXT },
	accentTextColor: { type: Sequelize.STRING },
	accentActionColor: { type: Sequelize.STRING },
	accentHoverColor: { type: Sequelize.STRING },
	accentMinimalColor: { type: Sequelize.STRING },
	navigation: { type: Sequelize.JSONB },
	hideNav: { type: Sequelize.BOOLEAN },
	website: { type: Sequelize.TEXT },
	facebook: { type: Sequelize.TEXT },
	twitter: { type: Sequelize.TEXT },
	email: { type: Sequelize.TEXT },
	issn: { type: Sequelize.TEXT },
	isFeatured: { type: Sequelize.BOOLEAN },
	defaultPubCollections: { type: Sequelize.JSONB },
});

const User = sequelize.define('User', {
	id: id,
	slug: {
		type: Sequelize.TEXT,
		unique: true,
		allowNull: false,
		validate: {
			isLowercase: true,
			len: [1, 280],
			is: /^[a-zA-Z0-9-]+$/, // Must contain at least one letter, alphanumeric and underscores and hyphens
		},
	},
	firstName: { type: Sequelize.TEXT, allowNull: false },
	lastName: { type: Sequelize.TEXT, allowNull: false },
	fullName: { type: Sequelize.TEXT, allowNull: false },
	initials: { type: Sequelize.STRING, allowNull: false },
	avatar: { type: Sequelize.TEXT },
	bio: { type: Sequelize.TEXT },
	title: { type: Sequelize.TEXT },
	email: {
		type: Sequelize.TEXT,
		allowNull: false,
		unique: true,
		validate: {
			isEmail: true,
			isLowercase: true,
		},
	},
	publicEmail: {
		type: Sequelize.TEXT,
		validate: {
			isEmail: true,
			isLowercase: true,
		},
	},
	location: { type: Sequelize.TEXT },
	website: { type: Sequelize.TEXT },
	facebook: { type: Sequelize.TEXT },
	twitter: { type: Sequelize.TEXT },
	github: { type: Sequelize.TEXT },
	orcid: { type: Sequelize.TEXT },
	googleScholar: { type: Sequelize.TEXT },
	resetHashExpiration: { type: Sequelize.DATE },
	resetHash: { type: Sequelize.TEXT },
	inactive: { type: Sequelize.BOOLEAN },
	pubpubV3Id: { type: Sequelize.INTEGER },
	passwordDigest: { type: Sequelize.TEXT },
	hash: { type: Sequelize.TEXT, allowNull: false },
	salt: { type: Sequelize.TEXT, allowNull: false },
});

passportLocalSequelize.attachToUser(User, {
	usernameField: 'email',
	hashField: 'hash',
	saltField: 'salt',
	digest: 'sha512',
	iterations: 25000,
});

const Signup = sequelize.define('Signup', {
	id: id,
	email: {
		type: Sequelize.TEXT,
		allowNull: false,
		unique: true,
		validate: {
			isEmail: true,
			isLowercase: true,
		},
	},
	hash: { type: Sequelize.TEXT },
	count: { type: Sequelize.INTEGER },
	completed: { type: Sequelize.BOOLEAN },
	communityId: { type: Sequelize.UUID },
});

const Pub = sequelize.define(
	'Pub',
	{
		id: id,
		slug: {
			type: Sequelize.TEXT,
			unique: true,
			allowNull: false,
			validate: {
				isLowercase: true,
				len: [1, 280],
				is: /^[a-zA-Z0-9-]+$/, // Must contain at least one letter, alphanumeric and underscores and hyphens
			},
		},
		title: { type: Sequelize.TEXT, allowNull: false },
		description: {
			type: Sequelize.TEXT,
			validate: {
				len: [0, 280],
			},
		},
		avatar: { type: Sequelize.TEXT },
		useHeaderImage: { type: Sequelize.BOOLEAN },
		firstPublishedAt: { type: Sequelize.DATE },
		lastPublishedAt: { type: Sequelize.DATE },
		draftEditHash: { type: Sequelize.STRING }, // TODO: This is used for draft
		draftViewHash: { type: Sequelize.STRING }, // TODO: This is used for draft
		doi: { type: Sequelize.TEXT },
		labels: { type: Sequelize.JSONB },

		isCommunityAdminManaged: { type: Sequelize.BOOLEAN },
		communityAdminDraftPermissions: {
			type: Sequelize.ENUM,
			values: ['none', 'view', 'edit'],
			defaultValue: 'none',
		},
		draftPermissions: {
			type: Sequelize.ENUM,
			values: ['private', 'publicView', 'publicEdit'],
			defaultValue: 'private',
		},
		review: { type: Sequelize.JSONB },
		downloads: { type: Sequelize.JSONB },

		/* Set by Associations */
		communityId: { type: Sequelize.UUID, allowNull: false },
	},
	{
		indexes: [{ fields: ['communityId'], method: 'BTREE' }],
	},
);

const Discussion = sequelize.define(
	'Discussion',
	{
		id: id,
		title: { type: Sequelize.TEXT },
		threadNumber: { type: Sequelize.INTEGER, allowNull: false },
		text: { type: Sequelize.TEXT },
		content: { type: Sequelize.JSONB },
		attachments: { type: Sequelize.JSONB },
		suggestions: { type: Sequelize.JSONB },
		highlights: { type: Sequelize.JSONB },
		submitHash: { type: Sequelize.TEXT }, // Deprecated since v5
		submitApprovedAt: { type: Sequelize.DATE }, // Deprecated since v5
		isArchived: { type: Sequelize.BOOLEAN },
		labels: { type: Sequelize.JSONB },

		/* Set by Associations */
		userId: { type: Sequelize.UUID, allowNull: false },
		pubId: { type: Sequelize.UUID, allowNull: false },
		communityId: { type: Sequelize.UUID, allowNull: false },
		discussionChannelId: { type: Sequelize.UUID },
	},
	{
		indexes: [
			{ fields: ['userId'], method: 'BTREE' },
			{ fields: ['pubId'], method: 'BTREE' },
			{ fields: ['communityId'], method: 'BTREE' },
		],
	},
);

const Version = sequelize.define('Version', {
	id: id,
	description: { type: Sequelize.TEXT },
	content: { type: Sequelize.JSONB },
	isPublic: { type: Sequelize.BOOLEAN }, // New
	isCommunityAdminShared: { type: Sequelize.BOOLEAN }, // New
	viewHash: { type: Sequelize.STRING }, // New

	/* Set by Associations */
	pubId: { type: Sequelize.UUID, allowNull: false },
});

const Page = sequelize.define('Page', {
	id: id,
	title: { type: Sequelize.TEXT, allowNull: false },
	slug: { type: Sequelize.TEXT, allowNull: false },
	description: { type: Sequelize.TEXT },
	avatar: { type: Sequelize.TEXT },
	isPublic: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
	isNarrowWidth: { type: Sequelize.BOOLEAN },
	viewHash: { type: Sequelize.TEXT },
	layout: { type: Sequelize.JSONB },

	/* Set by Associations */
	communityId: { type: Sequelize.UUID, allowNull: false },
});

const CommunityAdmin = sequelize.define('CommunityAdmin', {
	id: id,

	/* Set by Associations */
	userId: { type: Sequelize.UUID, allowNull: false },
	communityId: { type: Sequelize.UUID, allowNull: false },
});

const WorkerTask = sequelize.define('WorkerTask', {
	id: id,
	type: { type: Sequelize.TEXT, allowNull: false },
	input: { type: Sequelize.JSONB },
	isProcessing: { type: Sequelize.BOOLEAN },
	attemptCount: { type: Sequelize.INTEGER },
	error: { type: Sequelize.JSONB },
	output: { type: Sequelize.JSONB },
});

const PubManager = sequelize.define('PubManager', {
	id: id,

	/* Set by Associations */
	userId: { type: Sequelize.UUID, allowNull: false },
	pubId: { type: Sequelize.UUID, allowNull: false },
});

const VersionPermission = sequelize.define('VersionPermission', {
	id: id,
	permissions: {
		type: Sequelize.ENUM,
		values: ['view', 'edit'],
		defaultValue: 'view',
	},

	/* Set by Associations */
	userId: { type: Sequelize.UUID, allowNull: false },
	pubId: { type: Sequelize.UUID, allowNull: false },
	versionId: { type: Sequelize.UUID },
});

const PubAttribution = sequelize.define('PubAttribution', {
	id: id,
	name: { type: Sequelize.TEXT } /* Used for non-account attribution */,
	avatar: { type: Sequelize.TEXT } /* Used for non-account attribution */,
	title: { type: Sequelize.TEXT } /* Used for non-account attribution */,
	order: { type: Sequelize.DOUBLE },
	isAuthor: { type: Sequelize.BOOLEAN },
	roles: { type: Sequelize.JSONB },

	/* Set by Associations */
	userId: { type: Sequelize.UUID },
	pubId: { type: Sequelize.UUID, allowNull: false },
});

const Collection = sequelize.define('Collection', {
	id: id,
	title: { type: Sequelize.TEXT },
	isRestricted: {
		type: Sequelize.BOOLEAN,
	} /* Restricted collections can only be set by Community Admins */,
	isPublic: { type: Sequelize.BOOLEAN } /* Only visible to community admins */,

	/* Set by Associations */
	pageId: { type: Sequelize.UUID } /* Used to link a collection to a specific page */,
	communityId: { type: Sequelize.UUID },

	metadata: { type: Sequelize.JSONB },
	kind: { type: Sequelize.TEXT },
	doi: { type: Sequelize.TEXT },
});

const CollectionPub = sequelize.define(
	'CollectionPub',
	{
		id: id,
		pubId: { type: Sequelize.UUID, allowNull: false },
		collectionId: { type: Sequelize.UUID, allowNull: false },
		contextHint: { type: Sequelize.TEXT },
		rank: { type: Sequelize.TEXT },
		isPrimary: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
	},
	{
		indexes: [
			// Index to maintain invariant that every pub have at most one primary collection
			{
				fields: ['pubId'],
				where: {
					isPrimary: true,
				},
				unique: true,
			},
			// Index to enforce that there is one CollectionPub per (collection, pub) pair
			{
				fields: ['collectionId', 'pubId'],
				unique: true,
			},
		],
	},
);

const CollectionAttribution = sequelize.define('CollectionAttribution', {
	id: id,
	name: { type: Sequelize.TEXT } /* Used for non-account attribution */,
	avatar: { type: Sequelize.TEXT } /* Used for non-account attribution */,
	title: { type: Sequelize.TEXT } /* Used for non-account attribution */,
	order: { type: Sequelize.DOUBLE },
	isAuthor: { type: Sequelize.BOOLEAN },
	roles: { type: Sequelize.JSONB },

	/* Set by Associations */
	userId: { type: Sequelize.UUID },
	collectionId: { type: Sequelize.UUID, allowNull: false },
});

Collection.hasMany(CollectionAttribution, {
	onDelete: 'CASCADE',
	as: 'attributions',
	foreignKey: 'collectionId',
});
CollectionAttribution.belongsTo(User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' });
CollectionAttribution.belongsTo(Collection, {
	onDelete: 'CASCADE',
	as: 'collection',
	foreignKey: 'collectionId',
});

const DiscussionChannel = sequelize.define('DiscussionChannel', {
	id: id,
	title: { type: Sequelize.TEXT },
	permissions: {
		type: Sequelize.ENUM,
		values: ['private', 'restricted', 'public'],
		defaultValue: 'private',
	},
	isCommunityAdminModerated: { type: Sequelize.BOOLEAN },
	viewHash: { type: Sequelize.STRING },
	writeHash: { type: Sequelize.STRING },
	isArchived: { type: Sequelize.BOOLEAN },

	/* Set by Associations */
	pubId: { type: Sequelize.UUID, allowNull: false },
	communityId: { type: Sequelize.UUID, allowNull: false },
});

const DiscussionChannelParticipant = sequelize.define('DiscussionChannelParticipant', {
	/* Theoretically, we could allow participants to have either view or write permissions */
	/* This seems like a bit of an unnecessary verboseness. The viewHash URL seems like it would */
	/* solve most cases where you want view, but not write permissions. */
	/* We might revisit and decide otherwise later. */
	id: id,
	isModerator: { type: Sequelize.BOOLEAN },
	userId: { type: Sequelize.UUID, allowNull: false },
	discussionChannelId: { type: Sequelize.UUID, allowNull: false },
});

/* Communities can have many Admins. Users can admin many communities. */
User.belongsToMany(Community, {
	as: 'communities',
	through: 'CommunityAdmin',
	foreignKey: 'userId',
});
Community.belongsToMany(User, {
	as: 'admins',
	through: 'CommunityAdmin',
	foreignKey: 'communityId',
});

/* Pubs can have many Users. Users can belong to many Pubs. */
// User.belongsToMany(Pub, { as: 'pubs', through: 'PubAttribution', foreignKey: 'userId' });
// Pub.belongsToMany(User, { as: 'attributions', through: 'PubAttribution', foreignKey: 'pubId' });

/* Add emptyCollaborators association so we can grab authors that don't have userId accounts */
// Pub.hasMany(Collaborator, { onDelete: 'CASCADE', as: 'emptyCollaborators', foreignKey: 'pubId' });
// Collaborator.belongsTo(User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' });

/* NEW MODELS */
/* ---------- */
/* Pubs have many PubAttributions. PubAttributions are associated with a single user */
Pub.hasMany(PubAttribution, { onDelete: 'CASCADE', as: 'attributions', foreignKey: 'pubId' });
PubAttribution.belongsTo(User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' });
PubAttribution.belongsTo(Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' });
User.hasMany(PubAttribution, { onDelete: 'CASCADE', as: 'attributions', foreignKey: 'userId' });
/* Pubs have many VersionPermissions. */
Pub.hasMany(VersionPermission, {
	onDelete: 'CASCADE',
	as: 'versionPermissions',
	foreignKey: 'pubId',
});
VersionPermission.belongsTo(User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' });
/* Pubs have many PubManagers. */
Pub.hasMany(PubManager, { onDelete: 'CASCADE', as: 'managers', foreignKey: 'pubId' });
PubManager.belongsTo(User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' });

Pub.hasMany(DiscussionChannel, {
	onDelete: 'CASCADE',
	as: 'discussionChannels',
	foreignKey: 'pubId',
});
DiscussionChannel.hasMany(DiscussionChannelParticipant, {
	onDelete: 'CASCADE',
	as: 'participants',
	foreignKey: 'discussionChannelId',
});
DiscussionChannelParticipant.belongsTo(User, {
	onDelete: 'CASCADE',
	as: 'user',
	foreignKey: 'userId',
});
/* ---------- */
/* ---------- */

Community.hasMany(Collection, {
	onDelete: 'CASCADE',
	as: 'collections',
	foreignKey: 'communityId',
});
Pub.hasMany(CollectionPub, { onDelete: 'CASCADE', as: 'collectionPubs', foreignKey: 'pubId' });
CollectionPub.belongsTo(Collection, {
	onDelete: 'CASCADE',
	as: 'collection',
	foreignKey: 'collectionId',
});
Collection.belongsTo(Page, { as: 'page', foreignKey: 'pageId' });

/* Communities have many Pubs. Pubs belong to a single Community */
Community.hasMany(Pub, { onDelete: 'CASCADE', as: 'pubs', foreignKey: 'communityId' });
Pub.belongsTo(Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' });

/* Pages belong to a single Community */
Page.belongsTo(Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' });

/* Communities have many Discussions. Discussions belong to a single Community */
Community.hasMany(Discussion, {
	onDelete: 'CASCADE',
	as: 'discussions',
	foreignKey: 'communityId',
});
Discussion.belongsTo(Community, {
	onDelete: 'CASCADE',
	as: 'community',
	foreignKey: 'communityId',
});

/*  Pubs can have many Discussions. Discussions belong to a single Pub. */
Pub.hasMany(Discussion, { onDelete: 'CASCADE', as: 'discussions', foreignKey: 'pubId' });
Discussion.belongsTo(Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' });

/* Pubs can have many Versions */
/* We also select as activeVersion at time */
Pub.hasMany(Version, { onDelete: 'CASCADE', as: 'versions', foreignKey: 'pubId' });
Pub.hasMany(Version, { onDelete: 'CASCADE', as: 'activeVersion', foreignKey: 'pubId' });

/*  Users can have many Discussions. Discussions belong to a single User. */
User.hasMany(Discussion, { onDelete: 'CASCADE', as: 'discussions', foreignKey: 'userId' });
Discussion.belongsTo(User, { onDelete: 'CASCADE', as: 'author', foreignKey: 'userId' });

/* Collections can have many Pubs. Pubs can belong to many Collections. */
// Collection.belongsToMany(Pub, { as: 'pubs', through: 'CollectionPub', foreignKey: 'collectionId' });
// Pub.belongsToMany(Collection, { as: 'collections', through: 'CollectionPub', foreignKey: 'pubId' });

/* Communities have many Collections. A Collection belongs to only one Community. */
// Community.hasMany(Collection, { onDelete: 'CASCADE', as: 'collections', foreignKey: 'communityId' });

/* Communities have many Pages. */
Community.hasMany(Page, { onDelete: 'CASCADE', as: 'pages', foreignKey: 'communityId' });

/* Read for deprecation */

const Tag = sequelize.define('Tag', {
	id: id,
	title: { type: Sequelize.TEXT },
	isRestricted: {
		type: Sequelize.BOOLEAN,
	} /* Restricted tags can only be set by Community Admins */,
	isPublic: { type: Sequelize.BOOLEAN } /* Only visible to community admins */,

	/* Set by Associations */
	pageId: { type: Sequelize.UUID } /* Used to link a tag to a specific page */,
	communityId: { type: Sequelize.UUID, allowNull: false },
});

const PubTag = sequelize.define('PubTag', {
	id: id,

	/* Set by Associations */
	pubId: { type: Sequelize.UUID },
	tagId: { type: Sequelize.UUID },
});

const db = {
	Collection: Collection,
	CollectionAttribution: CollectionAttribution,
	CollectionPub: CollectionPub,
	Community: Community,
	CommunityAdmin: CommunityAdmin,
	Discussion: Discussion,
	DiscussionChannel: DiscussionChannel,
	DiscussionChannelParticipant: DiscussionChannelParticipant,
	Page: Page,
	Pub: Pub,
	PubTag: PubTag,
	PubAttribution: PubAttribution,
	PubManager: PubManager,
	Signup: Signup,
	Tag: Tag,
	User: User,
	Version: Version,
	VersionPermission: VersionPermission,
	WorkerTask: WorkerTask,
};

module.exports = db;
