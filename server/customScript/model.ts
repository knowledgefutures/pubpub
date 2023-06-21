import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const CustomScript = sequelize.define('CustomScript', {
	id: sequelize.idType,
	communityId: dataTypes.UUID,
	type: dataTypes.STRING,
	content: dataTypes.TEXT,
}) as any;
