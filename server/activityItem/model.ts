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
import {
	ActivityItemKind,
	//	ActivityItemPayload
} from 'types';

@Table
class ActivityItem extends Model<
	InferAttributes<ActivityItem>,
	InferCreationAttributes<ActivityItem>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.TEXT)
	kind!: ActivityItemKind;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	pubId?: string | null;

	// TODO: Add validation for payload
	@Column(DataType.JSONB)
	// 	payload?: ActivityItemPayload | null;
	payload?: any;

	@AllowNull(false)
	@Default(DataType.NOW)
	@Column(DataType.DATE)
	timestamp!: CreationOptional<Date>;

	@Index({ using: 'BTREE' })
	@AllowNull(false)
	@Column(DataType.UUID)
	communityId!: string;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	actorId?: string | null;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	collectionId?: string | null;
}

export const ActivityItemAnyModel = ActivityItem as any;
