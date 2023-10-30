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
import type { InsertableActivityItem, SerializedModel } from 'types';
import { ActivityItem, UserSubscription, User } from '../models';

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
