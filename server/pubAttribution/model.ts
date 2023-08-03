import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	AllowNull,
	BelongsTo,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { User, Pub } from '../models';

@Table
class PubAttribution extends Model<
	InferAttributes<PubAttribution>,
	InferCreationAttributes<PubAttribution>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.TEXT)
	name?: string | null;

	@Column(DataType.TEXT)
	avatar?: string | null;

	@Column(DataType.TEXT)
	title?: string | null;

	@Column(DataType.DOUBLE)
	order?: number | null;

	@Column(DataType.BOOLEAN)
	isAuthor?: boolean | null;

	// TODO: Add validation for roles
	@Column(DataType.JSONB)
	roles?: string[] | null;

	@Column(DataType.TEXT)
	affiliation?: string | null;

	@Column(DataType.STRING)
	orcid?: string | null;

	@Column(DataType.UUID)
	userId?: string | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	pubId!: string;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	// 	user?: User;
	user?: any;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	// 	pub?: Pub;
	pub?: any;
}

export const PubAttributionAnyModel = PubAttribution as any;
