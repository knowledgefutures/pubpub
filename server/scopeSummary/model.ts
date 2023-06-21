import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const ScopeSummary = sequelize.define('ScopeSummary', {
	id: sequelize.idType,
	collections: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
	pubs: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
	discussions: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
	reviews: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
	submissions: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}) as any;
