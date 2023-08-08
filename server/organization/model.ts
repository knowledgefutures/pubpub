import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	AllowNull,
	IsLowercase,
	Length,
	Is,
	Unique,
	HasMany,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
import { Community } from '../models';

@Table
export class Organization extends Model<
	InferAttributes<Organization>,
	InferCreationAttributes<Organization>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@AllowNull(false)
	@IsLowercase
	@Length({ min: 1, max: 280 })
	@Is(/^[a-zA-Z0-9-]+$/)
	@Unique
	@Column(DataType.TEXT)
	subdomain!: string;

	@Unique
	@Column(DataType.TEXT)
	domain!: string | null;

	@AllowNull(false)
	@Column(DataType.TEXT)
	title!: string;

	@Length({ min: 0, max: 280 })
	@Column(DataType.TEXT)
	description!: string | null;

	@Column(DataType.TEXT)
	avatar!: string | null;

	@Column(DataType.TEXT)
	favicon!: string | null;

	@HasMany(() => Community, {
		onDelete: 'CASCADE',
		as: 'communities',
		foreignKey: 'organizationId',
	})
	communities?: Community[];
}
