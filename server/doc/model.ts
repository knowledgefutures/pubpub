import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const Doc = sequelize.define('Doc', {
	id: sequelize.idType,
	content: { type: dataTypes.JSONB, allowNull: false },
}) as any;
