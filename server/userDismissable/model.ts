import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const UserDismissable = sequelize.define(
	'UserDismissable',
	{
		id: sequelize.idType,
		key: { type: dataTypes.STRING, allowNull: false },
		userId: { type: dataTypes.UUID, allowNull: false },
	},
	{
		indexes: [{ fields: ['userId'], using: 'BTREE' }],
	},
) as any;
