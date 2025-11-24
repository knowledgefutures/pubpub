import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import {
	AllowNull,
	Column,
	DataType,
	Default,
	HasMany,
	Is,
	IsLowercase,
	Length,
	Model,
	PrimaryKey,
	Table,
	Unique,
} from 'sequelize-typescript';

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
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@IsLowercase
	@Length({ min: 1, max: 280 })
	@Is(/^[a-zA-Z0-9-]+$/)
	@Unique
	@Column(DataType.TEXT)
	declare subdomain: string;

	@Unique
	@Column(DataType.TEXT)
	declare domain: string | null;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare title: string;

	@Length({ min: 0, max: 280 })
	@Column(DataType.TEXT)
	declare description: string | null;

	@Column(DataType.TEXT)
	declare avatar: string | null;

	@Column(DataType.TEXT)
	declare favicon: string | null;

	@HasMany(() => Community, {
		onDelete: 'CASCADE',
		as: 'communities',
		foreignKey: 'organizationId',
	})
	declare communities?: Community[];
}
