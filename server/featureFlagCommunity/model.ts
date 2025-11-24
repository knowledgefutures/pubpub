import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import {
	BelongsTo,
	Column,
	DataType,
	Default,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { Community, FeatureFlag } from '../models';

@Table
export class FeatureFlagCommunity extends Model<
	InferAttributes<FeatureFlagCommunity>,
	InferCreationAttributes<FeatureFlagCommunity>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Column(DataType.UUID)
	declare featureFlagId: string | null;

	@Column(DataType.UUID)
	declare communityId: string | null;

	@Column(DataType.BOOLEAN)
	declare enabled: boolean | null;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	declare community?: Community;

	@BelongsTo(() => FeatureFlag, {
		onDelete: 'CASCADE',
		as: 'featureFlag',
		foreignKey: 'featureFlagId',
	})
	declare featureFlag?: FeatureFlag;
}
