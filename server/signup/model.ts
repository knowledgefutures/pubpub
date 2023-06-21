import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const Signup = sequelize.define('Signup', {
	id: sequelize.idType,
	email: {
		type: dataTypes.TEXT,
		allowNull: false,
		unique: true,
		validate: {
			isEmail: true,
			isLowercase: true,
		},
	},
	hash: { type: dataTypes.TEXT },
	count: { type: dataTypes.INTEGER },
	completed: { type: dataTypes.BOOLEAN },
	communityId: { type: dataTypes.UUID },
}) as any;
