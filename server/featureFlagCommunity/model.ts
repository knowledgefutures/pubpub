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
import { Community, FeatureFlag } from '../models';

@Table
class FeatureFlagCommunity extends Model<
	InferAttributes<FeatureFlagCommunity>,
	InferCreationAttributes<FeatureFlagCommunity>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.UUID)
	featureFlagId?: string | null;

	@Column(DataType.UUID)
	communityId?: string | null;

	@Column(DataType.BOOLEAN)
	enabled?: boolean | null;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	// 	community?: Community;
	community?: any;

	@BelongsTo(() => FeatureFlag, {
		onDelete: 'CASCADE',
		as: 'featureFlag',
		foreignKey: 'featureFlagId',
	})
	// 	featureFlag?: FeatureFlag;
	featureFlag?: any;
}

export const FeatureFlagCommunityAnyModel = FeatureFlagCommunity as any;
