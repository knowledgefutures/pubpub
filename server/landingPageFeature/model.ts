import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	Index,
	AllowNull,
	BelongsTo,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { Pub, Community } from '../models';

@Table
class LandingPageFeature extends Model<
	InferAttributes<LandingPageFeature>,
	InferCreationAttributes<LandingPageFeature>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Index({ unique: true })
	@Column(DataType.UUID)
	communityId?: string | null;

	@Index({ unique: true })
	@Column(DataType.UUID)
	pubId?: string | null;

	@AllowNull(false)
	@Column(DataType.TEXT)
	rank!: string;

	// TODO: add validation for payload
	@Column(DataType.JSONB)
	// 	payload?: Record<string, any> | null;
	payload?: any;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	// 	pub?: Pub;
	pub?: any;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	// 	community?: Community;
	community?: any;
}

export const LandingPageFeatureAnyModel = LandingPageFeature as any;
