import { DataTypes as dataTypes, NOW } from 'sequelize';
import { sequelize } from '../sequelize';

export const ActivityItem = sequelize.define(
	'ActivityItem',
	{
		id: sequelize.idType,
		kind: { type: dataTypes.TEXT, allowNull: false },
		pubId: { type: dataTypes.UUID },
		payload: { type: dataTypes.JSONB },
		timestamp: {
			type: dataTypes.DATE,
			defaultValue: NOW,
			allowNull: false,
		},
		communityId: { type: dataTypes.UUID, allowNull: false },
		actorId: { type: dataTypes.UUID },
		collectionId: { type: dataTypes.UUID },
	},
	{
		indexes: [
			{ fields: ['communityId'], using: 'BTREE' },
			{ fields: ['collectionId'], using: 'BTREE' },
			{ fields: ['pubId'], using: 'BTREE' },
			{ fields: ['actorId'], using: 'BTREE' },
		],
	},
) as any;
