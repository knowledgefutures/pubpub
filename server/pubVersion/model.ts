import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	BelongsTo,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
import { Pub } from '../models';

@Table
export class PubVersion extends Model<
	InferAttributes<PubVersion>,
	InferCreationAttributes<PubVersion>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Column(DataType.INTEGER)
	declare historyKey: number | null;

	@Column(DataType.UUID)
	declare pubId: string | null;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	declare pub?: Pub;
}
