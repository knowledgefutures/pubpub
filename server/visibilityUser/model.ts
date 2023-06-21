import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const VisibilityUser = sequelize.define('VisibilityUser', {
	id: sequelize.idType,

	/* Set by Associations */
	userId: { type: dataTypes.UUID, allowNull: false },
	visibilityId: { type: dataTypes.UUID, allowNull: false },
}) as any;
