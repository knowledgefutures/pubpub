import { Model, Table, Column, DataType, PrimaryKey, Default } from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';

@Table
export class DepositTarget extends Model<
	InferAttributes<DepositTarget>,
	InferCreationAttributes<DepositTarget>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.UUID)
	communityId!: string | null;

	@Column(DataType.STRING)
	doiPrefix!: string | null;

	@Default('crossref')
	@Column(DataType.ENUM('crossref', 'datacite'))
	service!: CreationOptional<'crossref' | 'datacite' | null>;

	@Column(DataType.STRING)
	username!: string | null;

	@Column(DataType.STRING)
	password!: string | null;

	@Column(DataType.TEXT)
	passwordInitVec!: string | null;

	declare isPubPubManaged?: boolean;
}
