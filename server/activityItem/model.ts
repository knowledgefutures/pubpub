import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	AllowNull,
	Index,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
import { type InsertableActivityItem } from 'types/activity';

@Table
export class ActivityItem<T extends InsertableActivityItem = InsertableActivityItem> extends Model<
	InferAttributes<ActivityItem<T>, { omit: Extract<keyof ActivityItem<T>, keyof T> }> & T,
	InferCreationAttributes<ActivityItem<T>, { omit: Extract<keyof ActivityItem<T>, keyof T> }> & T
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare kind: T['kind'];

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	declare pubId: string | null;

	// TODO: Add validation for payload
	@Column(DataType.JSONB)
	declare payload: T['payload'];

	@AllowNull(false)
	@Default(DataType.NOW)
	@Column(DataType.DATE)
	declare timestamp: CreationOptional<string>;

	@Index({ using: 'BTREE' })
	@AllowNull(false)
	@Column(DataType.UUID)
	declare communityId: string;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	declare actorId: string | null;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	declare collectionId: string | null;
}
