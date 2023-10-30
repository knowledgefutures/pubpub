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
	declare id: CreationOptional<string>;

	@Column(DataType.TEXT)
	declare title: string | null;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	declare number: number;

	@Column(DataType.BOOLEAN)
	declare isClosed: boolean | null;

	@Column(DataType.JSONB)
	declare labels: string[] | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare threadId: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare visibilityId: string;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	declare userId: string | null;

	@Column(DataType.UUID)
	declare anchorId: string | null;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	declare pubId: string | null;

	@Column(DataType.UUID)
	declare commenterId: string | null;

	@BelongsTo(() => Thread, { onDelete: 'CASCADE', as: 'thread', foreignKey: 'threadId' })
	declare thread?: Thread;

	@BelongsTo(() => Visibility, {
		onDelete: 'CASCADE',
		as: 'visibility',
		foreignKey: 'visibilityId',
	})
	declare visibility?: Visibility;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'author', foreignKey: 'userId' })
	declare author?: User;

	@BelongsTo(() => Commenter, { onDelete: 'CASCADE', as: 'commenter', foreignKey: 'commenterId' })
	declare commenter?: Commenter;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	declare pub?: Pub;

	@HasMany(() => DiscussionAnchor, {
		onDelete: 'CASCADE',
		as: 'anchors',
		foreignKey: 'discussionId',
	})
	declare anchors?: DiscussionAnchor[];
}
