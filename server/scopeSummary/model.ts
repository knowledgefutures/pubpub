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

@Table
class ScopeSummary extends Model<
	InferAttributes<ScopeSummary>,
	InferCreationAttributes<ScopeSummary>
> {
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

export const ScopeSummaryAnyModel = ScopeSummary as any;
