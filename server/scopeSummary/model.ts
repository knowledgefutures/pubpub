import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	AllowNull,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';

@Table
export class ScopeSummary extends Model<
	InferAttributes<ScopeSummary>,
	InferCreationAttributes<ScopeSummary>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@AllowNull(false)
	@Default(0)
	@Column(DataType.INTEGER)
	collections!: CreationOptional<number>;

	@AllowNull(false)
	@Default(0)
	@Column(DataType.INTEGER)
	pubs!: CreationOptional<number>;

	@AllowNull(false)
	@Default(0)
	@Column(DataType.INTEGER)
	discussions!: CreationOptional<number>;

	@AllowNull(false)
	@Default(0)
	@Column(DataType.INTEGER)
	reviews!: CreationOptional<number>;

	@AllowNull(false)
	@Default(0)
	@Column(DataType.INTEGER)
	submissions!: CreationOptional<number>;
}
