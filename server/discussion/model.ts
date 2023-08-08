import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	AllowNull,
	Index,
	BelongsTo,
	HasMany,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
import { Thread, Visibility, User, Commenter, Pub, DiscussionAnchor } from '../models';

@Table
export class Discussion extends Model<
	InferAttributes<Discussion>,
	InferCreationAttributes<Discussion>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.TEXT)
	title!: string | null;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	number!: number;

	@Column(DataType.BOOLEAN)
	isClosed!: boolean | null;

	@Column(DataType.JSONB)
	labels!: string[] | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	threadId!: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	visibilityId!: string;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	userId!: string | null;

	@Column(DataType.UUID)
	anchorId!: string | null;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	pubId!: string | null;

	@Column(DataType.UUID)
	commenterId!: string | null;

	@BelongsTo(() => Thread, { onDelete: 'CASCADE', as: 'thread', foreignKey: 'threadId' })
	thread?: Thread;

	@BelongsTo(() => Visibility, {
		onDelete: 'CASCADE',
		as: 'visibility',
		foreignKey: 'visibilityId',
	})
	visibility?: Visibility;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'author', foreignKey: 'userId' })
	author?: User;

	@BelongsTo(() => Commenter, { onDelete: 'CASCADE', as: 'commenter', foreignKey: 'commenterId' })
	commenter?: Commenter;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	pub?: Pub;

	@HasMany(() => DiscussionAnchor, {
		onDelete: 'CASCADE',
		as: 'anchors',
		foreignKey: 'discussionId',
	})
	anchors?: DiscussionAnchor[];
}
