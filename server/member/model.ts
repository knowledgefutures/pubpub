import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const Member = sequelize.define(
	'Member',
	{
		id: sequelize.idType,
		permissions: {
			type: dataTypes.ENUM,
			values: ['view', 'edit', 'manage', 'admin'],
			defaultValue: 'view',
		},
		isOwner: { type: dataTypes.BOOLEAN },
		subscribedToActivityDigest: {
			type: dataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},

		/* Set by Associations */
		userId: { type: dataTypes.UUID, allowNull: false },
		pubId: { type: dataTypes.UUID },
		collectionId: { type: dataTypes.UUID },
		communityId: { type: dataTypes.UUID },
		organizationId: { type: dataTypes.UUID },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { Member: MemberModel, User, Collection, Community, Pub } = models;
				MemberModel.belongsTo(User, {
					onDelete: 'CASCADE',
					as: 'user',
					foreignKey: 'userId',
				});
				MemberModel.belongsTo(Community, {
					onDelete: 'CASCADE',
					as: 'community',
					foreignKey: 'communityId',
				});
				MemberModel.belongsTo(Pub, {
					onDelete: 'CASCADE',
					as: 'pub',
					foreignKey: 'pubId',
				});
				MemberModel.belongsTo(Collection, {
					onDelete: 'CASCADE',
					as: 'collection',
					foreignKey: 'collectionId',
				});
			},
		},
	},
) as any;
