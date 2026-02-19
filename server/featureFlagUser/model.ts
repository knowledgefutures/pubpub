import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import {
	BelongsTo,
	Column,
	DataType,
	Default,
	Index,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { FeatureFlag, User } from '../models';

@Table
export class FeatureFlagUser extends Model<
	InferAttributes<FeatureFlagUser>,
	InferCreationAttributes<FeatureFlagUser>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Index
	@Column(DataType.UUID)
	declare featureFlagId: string | null;

	@Index
	@Column(DataType.UUID)
	declare userId: string | null;

	@Column(DataType.BOOLEAN)
	declare enabled: boolean | null;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	declare user?: User;

	@BelongsTo(() => FeatureFlag, {
		onDelete: 'CASCADE',
		as: 'featureFlag',
		foreignKey: 'featureFlagId',
	})
	declare featureFlag?: FeatureFlag;
}
