import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const Pub = sequelize.define(
	'Pub',
	{
		id: sequelize.idType,
		slug: {
			type: dataTypes.TEXT,
			unique: true,
			allowNull: false,
			validate: {
				isLowercase: true,
				len: [1, 280],
				is: /^[a-zA-Z0-9-]+$/, // Must contain at least one letter, alphanumeric and underscores and hyphens
			},
		},
		title: { type: dataTypes.TEXT, allowNull: false },
		htmlTitle: { type: dataTypes.TEXT, allowNull: true },
		description: {
			type: dataTypes.TEXT,
			validate: {
				len: [0, 280],
			},
		},
		htmlDescription: {
			type: dataTypes.TEXT,
			validate: {
				len: [0, 280],
			},
		},
		avatar: { type: dataTypes.TEXT },
		customPublishedAt: { type: dataTypes.DATE },
		doi: { type: dataTypes.TEXT },
		labels: { type: dataTypes.JSONB },
		downloads: { type: dataTypes.JSONB },
		metadata: { type: dataTypes.JSONB },
		viewHash: { type: dataTypes.STRING },
		editHash: { type: dataTypes.STRING },
		reviewHash: { type: dataTypes.STRING },
		commentHash: { type: dataTypes.STRING },

		/* Set by Associations */
		draftId: { type: dataTypes.UUID, allowNull: false },
		communityId: { type: dataTypes.UUID, allowNull: false },
	},
	{
		indexes: [{ fields: ['communityId'], using: 'BTREE' }],
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const {
					CollectionPub,
					Community,
					CrossrefDepositRecord,
					Discussion,
					Export,
					Member,
					Pub: PubModel,
					PubAttribution,
					PubEdge,
					PubVersion,
					Release,
					ReviewNew,
					ScopeSummary,
					Submission,
				} = models;
				PubModel.hasMany(PubAttribution, {
					onDelete: 'CASCADE',
					as: 'attributions',
					foreignKey: 'pubId',
				});
				PubModel.hasMany(CollectionPub, {
					onDelete: 'CASCADE',
					hooks: true,
					as: 'collectionPubs',
					foreignKey: 'pubId',
				});
				PubModel.belongsTo(Community, {
					onDelete: 'CASCADE',
					as: 'community',
					foreignKey: 'communityId',
				});
				PubModel.hasMany(Discussion, {
					onDelete: 'CASCADE',
					as: 'discussions',
					foreignKey: 'pubId',
				});
				PubModel.hasMany(Export, {
					as: 'exports',
					foreignKey: 'pubId',
				});
				PubModel.hasMany(ReviewNew, {
					onDelete: 'CASCADE',
					as: 'reviews',
					foreignKey: 'pubId',
				});
				PubModel.hasMany(Member, {
					onDelete: 'CASCADE',
					as: 'members',
					foreignKey: 'pubId',
				});
				PubModel.hasMany(Release, {
					onDelete: 'CASCADE',
					as: 'releases',
					foreignKey: 'pubId',
				});
				PubModel.hasMany(PubVersion, {
					onDelete: 'CASCADE',
					as: 'pubVersions',
					foreignKey: 'pubId',
				});
				PubModel.hasMany(PubEdge, {
					onDelete: 'CASCADE',
					as: 'outboundEdges',
					foreignKey: 'pubId',
				});
				PubModel.hasMany(PubEdge, {
					onDelete: 'CASCADE',
					as: 'inboundEdges',
					foreignKey: 'targetPubId',
				});
				PubModel.hasOne(Submission, {
					as: 'submission',
					foreignKey: 'pubId',
				});
				PubModel.belongsTo(CrossrefDepositRecord, {
					as: 'crossrefDepositRecord',
					foreignKey: 'crossrefDepositRecordId',
				});
				PubModel.belongsTo(ScopeSummary, {
					as: 'scopeSummary',
					foreignKey: 'scopeSummaryId',
				});
			},
		},
	},
) as any;
