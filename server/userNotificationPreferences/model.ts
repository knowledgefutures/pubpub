import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	Index,
	AllowNull,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
import { UserNotificationMarkReadTrigger } from 'types';

@Table
export class UserNotificationPreferences extends Model<
	InferAttributes<UserNotificationPreferences>,
	InferCreationAttributes<UserNotificationPreferences>
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
	@Default(true)
	@Column(DataType.BOOLEAN)
	declare receiveNotifications: CreationOptional<boolean>;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare receiveDiscussionThreadEmails: CreationOptional<boolean>;

	@Column(DataType.DATE)
	declare lastReceivedNotificationsAt: Date | null;

	@AllowNull(false)
	@Default(true)
	@Column(DataType.BOOLEAN)
	declare subscribeToThreadsAsCommenter: CreationOptional<boolean>;

	@AllowNull(false)
	@Default(true)
	@Column(DataType.BOOLEAN)
	declare subscribeToPubsAsMember: CreationOptional<boolean>;

	@AllowNull(false)
	@Default(true)
	@Column(DataType.BOOLEAN)
	declare subscribeToPubsAsContributor: CreationOptional<boolean>;

	@AllowNull(false)
	@Default(0)
	@Column(DataType.INTEGER)
	declare notificationCadence: CreationOptional<number>;

	// TODO: Add validation for this, or make enum
	@AllowNull(false)
	@Default('clicked-through')
	@Column(DataType.STRING)
	declare markReadTrigger: CreationOptional<UserNotificationMarkReadTrigger>;
}
