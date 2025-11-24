import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { InsertableActivityItem, SerializedModel } from 'types';

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

import { ActivityItem, User, UserSubscription } from '../models';

@Table
export class UserNotification extends Model<
	InferAttributes<UserNotification>,
	InferCreationAttributes<UserNotification>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Index({ using: 'BTREE' })
	@AllowNull(false)
	@Column(DataType.UUID)
	declare userId: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare userSubscriptionId: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare activityItemId: string;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare isRead: CreationOptional<boolean>;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare manuallySetIsRead: CreationOptional<boolean>;

	@BelongsTo(() => ActivityItem<InsertableActivityItem>, {
		onDelete: 'CASCADE',
		as: 'activityItem',
		foreignKey: 'activityItemId',
	})
	declare activityItem?: ActivityItem;

	@BelongsTo(() => UserSubscription, {
		onDelete: 'CASCADE',
		as: 'userSubscription',
		foreignKey: 'userSubscriptionId',
	})
	declare userSubscription?: UserSubscription;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	declare user?: User;
}
