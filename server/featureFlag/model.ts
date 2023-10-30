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
import type { SerializedModel } from 'types';
import { FeatureFlagUser, FeatureFlagCommunity } from '../models';

@Table
export class FeatureFlag extends Model<
	InferAttributes<FeatureFlag>,
	InferCreationAttributes<FeatureFlag>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Index({ unique: true })
	@Column(DataType.STRING)
	declare name: string | null;

	@Default(0)
	@Column(DataType.DOUBLE)
	declare enabledUsersFraction: CreationOptional<number | null>;

	@Default(0)
	@Column(DataType.DOUBLE)
	declare enabledCommunitiesFraction: CreationOptional<number | null>;

	@HasMany(() => FeatureFlagUser, {
		onDelete: 'CASCADE',
		as: 'users',
		foreignKey: 'featureFlagId',
	})
	declare users?: FeatureFlagUser[];

	@HasMany(() => FeatureFlagCommunity, {
		onDelete: 'CASCADE',
		as: 'communities',
		foreignKey: 'featureFlagId',
	})
	declare communities?: FeatureFlagCommunity[];
}
