import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const Commenter = sequelize.define('Commenter', {
	id: sequelize.idType,
	name: { type: dataTypes.TEXT },
}) as any;
