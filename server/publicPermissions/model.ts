import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const PublicPermissions = sequelize.define(
	'PublicPermissions',
	{
		id: sequelize.idType,
		canCreateReviews: { type: dataTypes.BOOLEAN },
		canCreateDiscussions: { type: dataTypes.BOOLEAN },
		canViewDraft: { type: dataTypes.BOOLEAN },
		canEditDraft: { type: dataTypes.BOOLEAN },

		/* Set by Associations */
		pubId: { type: dataTypes.UUID },
		collectionId: { type: dataTypes.UUID },
		communityId: { type: dataTypes.UUID },
		organizationId: { type: dataTypes.UUID },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { PublicPermissions: PublicPermissionsModel, Pub } = models;
				PublicPermissionsModel.belongsTo(Pub, {
					onDelete: 'CASCADE',
					as: 'pub',
					foreignKey: 'pubId',
				});
			},
		},
	},
) as any;
