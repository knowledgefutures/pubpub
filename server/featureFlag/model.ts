import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	Index,
	HasMany,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { FeatureFlagUser, FeatureFlagCommunity } from '../models';

@Table
class FeatureFlag extends Model<
	InferAttributes<FeatureFlag>,
	InferCreationAttributes<FeatureFlag>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Index({ unique: true })
	@Column(DataType.STRING)
	name?: string | null;

	@Default(0)
	@Column(DataType.DOUBLE)
	// 	enabledUsersFraction?: CreationOptional<number | null>;
	enabledUsersFraction?: any;

	@Default(0)
	@Column(DataType.DOUBLE)
	// 	enabledCommunitiesFraction?: CreationOptional<number | null>;
	enabledCommunitiesFraction?: any;

	@HasMany(() => FeatureFlagUser, {
		onDelete: 'CASCADE',
		as: 'users',
		foreignKey: 'featureFlagId',
	})
	// 	users?: FeatureFlagUser[];
	users?: any;

	@HasMany(() => FeatureFlagCommunity, {
		onDelete: 'CASCADE',
		as: 'communities',
		foreignKey: 'featureFlagId',
	})
	// 	communities?: FeatureFlagCommunity[];
	communities?: any;
}

export const FeatureFlagAnyModel = FeatureFlag as any;
