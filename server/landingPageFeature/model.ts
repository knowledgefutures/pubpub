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
import type { SerializedModel } from 'types';
import { DefinitelyHas } from 'types';
import { Pub, Community } from '../models';

@Table
export class LandingPageFeature extends Model<
	InferAttributes<LandingPageFeature>,
	InferCreationAttributes<LandingPageFeature>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Index({ unique: true })
	@Column(DataType.UUID)
	communityId!: string | null;

	@Index({ unique: true })
	@Column(DataType.UUID)
	pubId!: string | null;

	@AllowNull(false)
	@Column(DataType.TEXT)
	rank!: string;

	// TODO: add validation for payload
	@Column(DataType.JSONB)
	payload!: Record<string, any> | null;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	pub?: DefinitelyHas<Pub, 'attributions' | 'collectionPubs' | 'community' | 'releases'>;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	community?: Community;
}
