import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import {
	BelongsTo,
	Column,
	DataType,
	Default,
	ForeignKey,
	Index,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { Hub } from '../hub/model';
import { User } from '../user/model';

@Table({
	indexes: [
		{
			unique: true,
			fields: ['hubId', 'userId'],
			name: 'HubManagers_hubId_userId_unique',
		},
	],
})
export class HubManager extends Model<
	InferAttributes<HubManager>,
	InferCreationAttributes<HubManager>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@ForeignKey(() => Hub)
	@Column(DataType.UUID)
	declare hubId: string;

	@ForeignKey(() => User)
	@Index
	@Column(DataType.UUID)
	declare userId: string;

	@BelongsTo(() => Hub, { onDelete: 'CASCADE', foreignKey: 'hubId' })
	declare hub?: Hub;

	@BelongsTo(() => User, { onDelete: 'CASCADE', foreignKey: 'userId' })
	declare user?: User;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	toJSON(): SerializedModel<HubManager> {
		return super.toJSON() as unknown as SerializedModel<HubManager>;
	}
}
