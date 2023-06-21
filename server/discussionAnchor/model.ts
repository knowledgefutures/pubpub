import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const DiscussionAnchor = sequelize.define(
	'DiscussionAnchor',
	{
		id: sequelize.idType,
		isOriginal: { type: dataTypes.BOOLEAN, allowNull: false },
		discussionId: { type: dataTypes.UUID, allowNull: false },
		historyKey: { type: dataTypes.INTEGER, allowNull: false },
		selection: { type: dataTypes.JSONB, allowNull: true },
		originalText: { type: dataTypes.TEXT, allowNull: false },
		originalTextPrefix: { type: dataTypes.TEXT, allowNull: false },
		originalTextSuffix: { type: dataTypes.TEXT, allowNull: false },
	},
	{
		indexes: [{ fields: ['discussionId'], using: 'BTREE' }],
	},
) as any;
