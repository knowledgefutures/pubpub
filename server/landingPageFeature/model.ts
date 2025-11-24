import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { DefinitelyHas, SerializedModel } from 'types';

import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	Default,
	Index,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { Community, Pub } from '../models';

@Table
export class LandingPageFeature extends Model<
	InferAttributes<LandingPageFeature>,
	InferCreationAttributes<LandingPageFeature>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Index({ unique: true })
	@Column(DataType.UUID)
	declare communityId: string | null;

	@Index({ unique: true })
	@Column(DataType.UUID)
	declare pubId: string | null;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare rank: string;

	// TODO: add validation for payload
	@Column(DataType.JSONB)
	declare payload: Record<string, any> | null;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	declare pub?: DefinitelyHas<Pub, 'attributions' | 'collectionPubs' | 'community' | 'releases'>;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	declare community?: Community;
}
