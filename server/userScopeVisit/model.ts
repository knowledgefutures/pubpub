import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const UserScopeVisit = sequelize.define(
	'UserScopeVisit',
	{
		id: sequelize.idType,
		userId: { type: dataTypes.UUID, allowNull: true },
		pubId: { type: dataTypes.UUID, allowNull: true },
		collectionId: { type: dataTypes.UUID, allowNull: true },
		communityId: { type: dataTypes.UUID, allowNull: true },
	},
	{
		indexes: [
			{
				unique: true,
				fields: ['userId', 'collectionId'],
			},
			{
				unique: true,
				fields: ['userId', 'pubId'],
			},
		],
	},
) as any;
