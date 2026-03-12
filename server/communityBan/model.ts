import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { BanStatus, SerializedModel } from 'types';

import {
	AllowNull,
	BelongsTo,
	Column,
	createIndexDecorator,
	DataType,
	Default,
	Index,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { Community, SpamTag, ThreadComment, User } from '../models';

export type BanReason =
	| 'spam-content'
	| 'hateful-language'
	| 'harassment'
	| 'impersonation'
	| 'other';

@Table({ tableName: 'CommunityBans' })
export class CommunityBan extends Model<
	InferAttributes<CommunityBan>,
	InferCreationAttributes<CommunityBan>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Index
	@Column(DataType.UUID)
	declare userId: string;

	@AllowNull(false)
	@Index
	@Column(DataType.UUID)
	declare communityId: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare actorId: string;

	@AllowNull(false)
	@Column(
		DataType.ENUM('spam-content', 'hateful-language', 'harassment', 'impersonation', 'other'),
	)
	declare reason: BanReason;

	@Column(DataType.TEXT)
	declare reasonText: string | null;

	@Column(DataType.UUID)
	declare sourceThreadCommentId: string | null;

	@Column(DataType.UUID)
	declare spamTagId: string | null;

	@AllowNull(false)
	@Default('active')
	@Column(DataType.ENUM('active', 'retracted'))
	declare status: CreationOptional<BanStatus>;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	declare user?: User;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	declare community?: Community;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'actor', foreignKey: 'actorId' })
	/** last user to interact with the ban, not necessarily the one who created it */
	declare actor?: User;

	@BelongsTo(() => ThreadComment, {
		onDelete: 'SET NULL',
		as: 'sourceThreadComment',
		foreignKey: 'sourceThreadCommentId',
	})
	declare sourceThreadComment?: ThreadComment;

	// if the spam tag is deleted, delete the ban
	@BelongsTo(() => SpamTag, { onDelete: 'CASCADE', as: 'spamTag', foreignKey: 'spamTagId' })
	declare spamTag?: SpamTag;
}
