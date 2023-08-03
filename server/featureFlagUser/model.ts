import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	BelongsTo,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { User, FeatureFlag } from '../models';

@Table
class FeatureFlagUser extends Model<
	InferAttributes<FeatureFlagUser>,
	InferCreationAttributes<FeatureFlagUser>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.UUID)
	featureFlagId?: string | null;

	@Column(DataType.UUID)
	userId?: string | null;

	@Column(DataType.BOOLEAN)
	enabled?: boolean | null;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	// 	user?: User;
	user?: any;

	@BelongsTo(() => FeatureFlag, {
		onDelete: 'CASCADE',
		as: 'featureFlag',
		foreignKey: 'featureFlagId',
	})
	// 	featureFlag?: FeatureFlag;
	featureFlag?: any;
}

export const FeatureFlagUserAnyModel = FeatureFlagUser as any;
