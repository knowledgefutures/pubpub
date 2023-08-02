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
	id!: CreationOptional<string>;

	@Index({ using: 'BTREE' })
	@AllowNull(false)
	@Column(DataType.UUID)
	userId!: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	userSubscriptionId!: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	activityItemId!: string;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	isRead!: CreationOptional<boolean>;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	manuallySetIsRead!: CreationOptional<boolean>;

	@BelongsTo(() => ActivityItem<InsertableActivityItem>, {
		onDelete: 'CASCADE',
		as: 'activityItem',
		foreignKey: 'activityItemId',
	})
	activityItem?: ActivityItem;

	@BelongsTo(() => UserSubscription, {
		onDelete: 'CASCADE',
		as: 'userSubscription',
		foreignKey: 'userSubscriptionId',
	})
	userSubscription?: UserSubscription;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	user?: User;
}
