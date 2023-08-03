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
import { Thread, Visibility, User, Commenter, Pub, DiscussionAnchor } from '../models';

@Table
class Discussion extends Model<InferAttributes<Discussion>, InferCreationAttributes<Discussion>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.TEXT)
	title?: string | null;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	number!: number;

	@Column(DataType.BOOLEAN)
	isClosed?: boolean | null;

	@Column(DataType.JSONB)
	labels?: string[] | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	threadId!: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	visibilityId!: string;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	userId?: string | null;

	@Column(DataType.UUID)
	anchorId?: string | null;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	pubId?: string | null;

	@Column(DataType.UUID)
	commenterId?: string | null;

	@BelongsTo(() => Thread, { onDelete: 'CASCADE', as: 'thread', foreignKey: 'threadId' })
	// 	thread?: Thread;
	thread?: any;

	@BelongsTo(() => Visibility, {
		onDelete: 'CASCADE',
		as: 'visibility',
		foreignKey: 'visibilityId',
	})
	// 	visibility?: Visibility;
	visibility?: any;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'author', foreignKey: 'userId' })
	// 	author?: User;
	author?: any;

	@BelongsTo(() => Commenter, { onDelete: 'CASCADE', as: 'commenter', foreignKey: 'commenterId' })
	// 	commenter?: Commenter;
	commenter?: any;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	// 	pub?: Pub;
	pub?: any;

	@HasMany(() => DiscussionAnchor, {
		onDelete: 'CASCADE',
		as: 'anchors',
		foreignKey: 'discussionId',
	})
	// 	anchors?: DiscussionAnchor[];
	anchors?: any;
}

export const DiscussionAnyModel = Discussion as any;
