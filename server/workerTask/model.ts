import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const WorkerTask = sequelize.define('WorkerTask', {
	id: sequelize.idType,
	type: { type: dataTypes.TEXT, allowNull: false },
	input: { type: dataTypes.JSONB },
	isProcessing: { type: dataTypes.BOOLEAN },
	attemptCount: { type: dataTypes.INTEGER },
	error: { type: dataTypes.JSONB },
	output: { type: dataTypes.JSONB },
	priority: { type: dataTypes.INTEGER },
}) as any;
