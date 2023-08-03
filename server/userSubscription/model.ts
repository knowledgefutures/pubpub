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
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { UserSubscriptionStatus } from 'types';
import { Pub, Thread, User } from '../models';

@Table
class UserSubscription extends Model<
	InferAttributes<UserSubscription>,
	InferCreationAttributes<UserSubscription>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.BOOLEAN)
	setAutomatically!: boolean;

	@AllowNull(false)
	@Column(DataType.STRING)
	status!: UserSubscriptionStatus;

	@Index({ using: 'BTREE' })
	@AllowNull(false)
	@Column(DataType.UUID)
	userId!: string;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	pubId?: string | null;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	threadId?: string | null;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	// 	pub?: Pub;
	pub?: any;

	@BelongsTo(() => Thread, { onDelete: 'CASCADE', as: 'thread', foreignKey: 'threadId' })
	// 	thread?: Thread;
	thread?: any;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	// 	user?: User;
	user?: any;
}

export const UserSubscriptionAnyModel = UserSubscription as any;
