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
	declare id: CreationOptional<string>;

	@Column(DataType.BOOLEAN)
	declare canCreateReviews: boolean | null;

	@Column(DataType.BOOLEAN)
	declare canCreateDiscussions: boolean | null;

	@Column(DataType.BOOLEAN)
	declare canViewDraft: boolean | null;

	@Column(DataType.BOOLEAN)
	declare canEditDraft: boolean | null;

	@Column(DataType.UUID)
	declare pubId: string | null;

	@Column(DataType.UUID)
	declare collectionId: string | null;

	@Column(DataType.UUID)
	declare communityId: string | null;

	@Column(DataType.UUID)
	declare organizationId: string | null;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	declare pub?: Pub;
}
