/* eslint-disable global-require */

if (process.env.NODE_ENV !== 'production') {
	require('./config.js');
}

const Sequelize = require('sequelize');
const passportLocalSequelize = require('passport-local-sequelize');

const operatorsAliases = {
	$or: Sequelize.Op.or,
	$and: Sequelize.Op.and,
	$ilike: Sequelize.Op.iLike,
	$in: Sequelize.Op.in,
	$not: Sequelize.Op.not,
	$ne: Sequelize.Op.ne,
	$lt: Sequelize.Op.lt,
	$gt: Sequelize.Op.gt,
};
const useSSL = process.env.DATABASE_URL.indexOf('localhost:') === -1;
const sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false,
	dialectOptions: { ssl: useSSL },
	operatorsAliases: operatorsAliases,
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
	smallHeaderLogo: { type: Sequelize.TEXT },
	largeHeaderLogo: { type: Sequelize.TEXT },
	largeHeaderBackground: { type: Sequelize.TEXT },
	accentColor: { type: Sequelize.STRING },
	accentTextColor: { type: Sequelize.STRING },
	accentActionColor: { type: Sequelize.STRING },
	accentHoverColor: { type: Sequelize.STRING },
	accentMinimalColor: { type: Sequelize.STRING },
	navigation: { type: Sequelize.JSONB },
	website: { type: Sequelize.TEXT },
	facebook: { type: Sequelize.TEXT },
	twitter: { type: Sequelize.TEXT },
	email: { type: Sequelize.TEXT },
	issn: { type: Sequelize.TEXT },
	hideCreatePubButton: { type: Sequelize.BOOLEAN },
	defaultPubTags: { type: Sequelize.JSONB },
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
		}
	},
	publicEmail: {
		type: Sequelize.TEXT,
		validate: {
			isEmail: true,
			isLowercase: true,
		}
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
		}
	},
	hash: { type: Sequelize.TEXT },
	count: { type: Sequelize.INTEGER },
	completed: { type: Sequelize.BOOLEAN },
});

const Pub = sequelize.define('Pub', {
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
	// isPublished: { type: Sequelize.BOOLEAN, defaultValue: false },
	/* isPublished can be removed from databases once we verify publishedAt is succesful */
	// publishedAt: { type: Sequelize.DATE },
	firstPublishedAt: { type: Sequelize.DATE },
	lastPublishedAt: { type: Sequelize.DATE },
	// collaborationMode: { // TODO: DELETE
	// 	// Used to note the mode of the workingDraft
	// 	type: Sequelize.ENUM,
	// 	values: ['private', 'publicView', 'publicEdit'],
	// 	defaultValue: 'private',
	// },
	// adminPermissions: { // TODO: DELETE
	// 	type: Sequelize.ENUM,
	// 	values: ['manage', 'edit', 'view', 'none'], // Must be same as permissions on Collaborator
	// 	defaultValue: 'none',
	// },
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
	/* Set by Associations */
	communityId: { type: Sequelize.UUID, allowNull: false },
}, {
	indexes: [
		{ fields: ['communityId'], method: 'BTREE' },
	]
});

const Discussion = sequelize.define('Discussion', {
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
	// isPublic: { type: Sequelize.BOOLEAN }, /* TODO: this field is deprecated once discussionChannels exist. Need to migrate isPublic=false to new channel */
	labels: { type: Sequelize.JSONB },
	/* Set by Associations */
	userId: { type: Sequelize.UUID, allowNull: false },
	pubId: { type: Sequelize.UUID, allowNull: false },
	communityId: { type: Sequelize.UUID, allowNull: false },
	discussionChannelId: { type: Sequelize.UUID },
}, {
	indexes: [
		{ fields: ['userId'], method: 'BTREE' },
		{ fields: ['pubId'], method: 'BTREE' },
		{ fields: ['communityId'], method: 'BTREE' },
	]
});

const Version = sequelize.define('Version', {
	id: id,
	description: { type: Sequelize.TEXT },
	content: { type: Sequelize.JSONB },
	// collaborativeRef: { type: Sequelize.TEXT }, // TODO: not clear what this is used for.
	isPublic: { type: Sequelize.BOOLEAN }, // New
	isCommunityAdminShared: { type: Sequelize.BOOLEAN }, // New
	viewHash: { type: Sequelize.STRING }, // New
	/* Set by Associations */
	pubId: { type: Sequelize.UUID, allowNull: false },
});

// const Collection = sequelize.define('Collection', {
// 	id: id,
// 	title: { type: Sequelize.TEXT, allowNull: false },
// 	description: { type: Sequelize.TEXT },
// 	slug: { type: Sequelize.TEXT, allowNull: false },
// 	isPage: { type: Sequelize.BOOLEAN, allowNull: false },
// 	isPublic: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false, },
// 	isOpenSubmissions: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false, },
// 	isOpenPublish: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false, },
// 	layout: { type: Sequelize.JSONB },
// 	createPubHash: { type: Sequelize.TEXT },
// 	createPubMessage: { type: Sequelize.JSONB },
// 	/* Set by Associations */
// 	communityId: { type: Sequelize.UUID, allowNull: false },
// });

const Page = sequelize.define('Page', {
	id: id,
	title: { type: Sequelize.TEXT, allowNull: false },
	description: { type: Sequelize.TEXT },
	slug: { type: Sequelize.TEXT, allowNull: false },

	// isPage: { type: Sequelize.BOOLEAN, allowNull: false },
	isPublic: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false, },
	viewHash: { type: Sequelize.TEXT },
	// isOpenSubmissions: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false, },
	// isOpenPublish: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false, },
	layout: { type: Sequelize.JSONB },
	// createPubHash: { type: Sequelize.TEXT },
	// createPubMessage: { type: Sequelize.JSONB },
	/* Set by Associations */
	communityId: { type: Sequelize.UUID, allowNull: false },
});

// const CollectionPub = sequelize.define('CollectionPub', {
// 	id: id,
// 	/* Set by Associations */
// 	collectionId: { type: Sequelize.UUID, allowNull: false },
// 	pubId: { type: Sequelize.UUID, allowNull: false },
// }, {
// 	indexes: [
// 		{ fields: ['collectionId'], method: 'BTREE' },
// 		{ fields: ['pubId'], method: 'BTREE' },
// 	]
// });

// const Collaborator = sequelize.define('Collaborator', { // TODO: Delete this table
// 	id: id,
// 	name: { type: Sequelize.TEXT },
// 	order: { type: Sequelize.DOUBLE },
// 	permissions: {
// 		// In this new version, we use this both to denote manager,
// 		// and draft permissions. If set to manage, can't be added to draft, as they already have
// 		// access through management.
// 		type: Sequelize.ENUM,
// 		values: ['manage', 'edit', 'view', 'none'], // Must be same as adminPermissions on Pub
// 		defaultValue: 'none',
// 	},
// 	title: { type: Sequelize.TEXT }, // This could allow users to override their default title per-pub. I don't think I'll enable it yet - but it's good to have in place.
// 	isAuthor: { type: Sequelize.BOOLEAN },
// 	isContributor: { type: Sequelize.BOOLEAN },
// 	roles: { type: Sequelize.JSONB },
// 	versionAccessList: { type: Sequelize.JSONB },
// 	/* Set by Associations */
// 	userId: { type: Sequelize.UUID },
// 	pubId: { type: Sequelize.UUID, allowNull: false },
// });

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
	name: { type: Sequelize.TEXT }, /* Used for non-account attribution */
	avatar: { type: Sequelize.TEXT }, /* Used for non-account attribution */
	title: { type: Sequelize.TEXT }, /* Used for non-account attribution */
	order: { type: Sequelize.DOUBLE },
	isAuthor: { type: Sequelize.BOOLEAN },
	roles: { type: Sequelize.JSONB },
	/* Set by Associations */
	userId: { type: Sequelize.UUID },
	pubId: { type: Sequelize.UUID, allowNull: false },
});

const Tag = sequelize.define('Tag', {
	id: id,
	title: { type: Sequelize.TEXT },
	isRestricted: { type: Sequelize.BOOLEAN }, /* Restricted tags can only be set by Community Admins */
	isPublic: { type: Sequelize.BOOLEAN }, /* Only visible to community admins */
	/* Set by Associations */
	pageId: { type: Sequelize.UUID }, /* Used to link a tag to a specific page */
	communityId: { type: Sequelize.UUID, allowNull: false },
});

const PubTag = sequelize.define('PubTag', {
	id: id,
	// Will we want order here?
	/* Set by Associations */
	pubId: { type: Sequelize.UUID },
	tagId: { type: Sequelize.UUID },
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
User.belongsToMany(Community, { as: 'communities', through: 'CommunityAdmin', foreignKey: 'userId' });
Community.belongsToMany(User, { as: 'admins', through: 'CommunityAdmin', foreignKey: 'communityId' });

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
Pub.hasMany(VersionPermission, { onDelete: 'CASCADE', as: 'versionPermissions', foreignKey: 'pubId' });
VersionPermission.belongsTo(User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' });
/* Pubs have many PubManagers. */
Pub.hasMany(PubManager, { onDelete: 'CASCADE', as: 'managers', foreignKey: 'pubId' });
PubManager.belongsTo(User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' });

Pub.hasMany(DiscussionChannel, { onDelete: 'CASCADE', as: 'discussionChannels', foreignKey: 'pubId' });
DiscussionChannel.hasMany(DiscussionChannelParticipant, { onDelete: 'CASCADE', as: 'participants', foreignKey: 'discussionChannelId' });
DiscussionChannelParticipant.belongsTo(User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' });
/* ---------- */
/* ---------- */

/* Communities have many Tags */
Community.hasMany(Tag, { onDelete: 'CASCADE', as: 'tags', foreignKey: 'communityId' });
/* Tags can belong to many Pubs. */
// Tag.belongsToMany(Pub, { onDelete: 'CASCADE', as: 'pubs', through: 'PubTag', foreignKey: 'tagId' });
/* Pubs have many PubTags. */
Pub.hasMany(PubTag, { onDelete: 'CASCADE', as: 'pubTags', foreignKey: 'pubId' });
PubTag.belongsTo(Tag, { onDelete: 'CASCADE', as: 'tag', foreignKey: 'tagId' });
Tag.belongsTo(Page, { as: 'page', foreignKey: 'pageId' });

/* Communities have many Pubs. Pubs belong to a single Community */
Community.hasMany(Pub, { onDelete: 'CASCADE', as: 'pubs', foreignKey: 'communityId' });
Pub.belongsTo(Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' });

/* Communities have many Discussions. Discussions belong to a single Community */
Community.hasMany(Discussion, { onDelete: 'CASCADE', as: 'discussions', foreignKey: 'communityId' });
Discussion.belongsTo(Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' });

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

const db = {
	Community: Community,
	CommunityAdmin: CommunityAdmin,
	// Collection: Collection,
	// CollectionPub: CollectionPub,
	// Collaborator: Collaborator,
	Discussion: Discussion,
	Pub: Pub,
	Signup: Signup,
	User: User,
	Version: Version,
	WorkerTask: WorkerTask,
	PubManager: PubManager,
	VersionPermission: VersionPermission,
	PubAttribution: PubAttribution,
	Tag: Tag,
	PubTag: PubTag,
	Page: Page,
	DiscussionChannel: DiscussionChannel,
	DiscussionChannelParticipant: DiscussionChannelParticipant,
};

db.sequelize = sequelize;

module.exports = db;
