import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	Default,
	ForeignKey,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { Community } from '../community/model';
import { Hub } from '../hub/model';

/**
 * Per-hub opt-out.
 * When a row exists for (communityId, hubId), that community
 * has rejected association with that specific hub.
 */
@Table({ tableName: 'HubOptOuts' })
export class HubOptOut extends Model<
	InferAttributes<HubOptOut>,
	InferCreationAttributes<HubOptOut>
> {
	toJSON(): SerializedModel<HubOptOut> {
		return super.toJSON() as unknown as SerializedModel<HubOptOut>;
	}

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@ForeignKey(() => Community)
	@Column(DataType.UUID)
	declare communityId: string;

	@AllowNull(false)
	@ForeignKey(() => Hub)
	@Column(DataType.UUID)
	declare hubId: string;

	@BelongsTo(() => Community, { onDelete: 'CASCADE' })
	declare community?: Community;

	@BelongsTo(() => Hub, { onDelete: 'CASCADE' })
	declare hub?: Hub;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
}
