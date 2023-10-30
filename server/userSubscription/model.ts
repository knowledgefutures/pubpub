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
import type { SerializedModel } from 'types';
import { UserSubscriptionStatus } from 'types';
import { Pub, Thread, User } from '../models';

@Table
export class UserSubscription extends Model<
	InferAttributes<UserSubscription>,
	InferCreationAttributes<UserSubscription>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.BOOLEAN)
	declare setAutomatically: boolean;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare status: UserSubscriptionStatus;

	@Index({ using: 'BTREE' })
	@AllowNull(false)
	@Column(DataType.UUID)
	declare userId: string;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	declare pubId: string | null;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	declare threadId: string | null;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	declare pub?: Pub;

	@BelongsTo(() => Thread, { onDelete: 'CASCADE', as: 'thread', foreignKey: 'threadId' })
	declare thread?: Thread;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	declare user?: User;
}
