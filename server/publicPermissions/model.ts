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
import type { SerializedModel } from 'types';
import { Pub } from '../models';

@Table
export class PublicPermissions extends Model<
	InferAttributes<PublicPermissions>,
	InferCreationAttributes<PublicPermissions>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.BOOLEAN)
	canCreateReviews!: boolean | null;

	@Column(DataType.BOOLEAN)
	canCreateDiscussions!: boolean | null;

	@Column(DataType.BOOLEAN)
	canViewDraft!: boolean | null;

	@Column(DataType.BOOLEAN)
	canEditDraft!: boolean | null;

	@Column(DataType.UUID)
	pubId!: string | null;

	@Column(DataType.UUID)
	collectionId!: string | null;

	@Column(DataType.UUID)
	communityId!: string | null;

	@Column(DataType.UUID)
	organizationId!: string | null;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	pub?: Pub;
}
