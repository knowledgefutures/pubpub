import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const Page = sequelize.define(
	'Page',
	{
		id: sequelize.idType,
		title: { type: dataTypes.TEXT, allowNull: false },
		slug: { type: dataTypes.TEXT, allowNull: false },
		description: { type: dataTypes.TEXT },
		avatar: { type: dataTypes.TEXT },
		isPublic: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
		isNarrowWidth: { type: dataTypes.BOOLEAN },
		viewHash: { type: dataTypes.TEXT },
		layout: { type: dataTypes.JSONB, allowNull: false },
		layoutAllowsDuplicatePubs: {
			type: dataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false,
		},

		/* Set by Associations */
		communityId: { type: dataTypes.UUID, allowNull: false },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { Page: PageModel, Community } = models;
				PageModel.belongsTo(Community, {
					onDelete: 'CASCADE',
					as: 'community',
					foreignKey: 'communityId',
				});
			},
		},
	},
) as any;
