import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { MemberPermission, SerializedModel } from 'types';

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

import { Collection, Community, Pub, User } from '../models';

@Table
export class Member extends Model<InferAttributes<Member>, InferCreationAttributes<Member>> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Default('view')
	@Column(DataType.ENUM('view', 'edit', 'manage', 'admin'))
	declare permissions: CreationOptional<MemberPermission>;

	@Column(DataType.BOOLEAN)
	declare isOwner: boolean | null;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare subscribedToActivityDigest: CreationOptional<boolean>;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare userId: string;

	@Index
	@Column(DataType.UUID)
	declare pubId: string | null;

	@Column(DataType.UUID)
	@Index
	declare collectionId: string | null;

	@Column(DataType.UUID)
	@Index
	declare communityId: string | null;

	@Column(DataType.UUID)
	declare organizationId: string | null;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	declare user?: User;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	declare community?: Community;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	declare pub?: Pub;

	@BelongsTo(() => Collection, {
		onDelete: 'CASCADE',
		as: 'collection',
		foreignKey: 'collectionId',
	})
	declare collection?: Collection;
}
