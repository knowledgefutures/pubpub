import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const CommunityAdmin = sequelize.define('CommunityAdmin', {
	id: sequelize.idType,

	/* Set by Associations */
	userId: { type: dataTypes.UUID, allowNull: false },
	communityId: { type: dataTypes.UUID, allowNull: false },
}) as any;
