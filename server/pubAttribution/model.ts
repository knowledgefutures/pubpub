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
import type { SerializedModel } from 'types';
import { User, Pub } from '../models';

@Table
export class PubAttribution extends Model<
	InferAttributes<PubAttribution>,
	InferCreationAttributes<PubAttribution>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Column(DataType.TEXT)
	declare name: string | null;

	@Column(DataType.TEXT)
	declare avatar: string | null;

	/**
	 * @deprecated
	 */
	@Column(DataType.TEXT)
	declare title: string | null;

	// TODO: Add AllowNull(false) for this. Made non-null as that is how its used, but technically still nullable in the db
	@Column(DataType.DOUBLE)
	declare order: number;

	@Column(DataType.BOOLEAN)
	declare isAuthor: boolean | null;

	// TODO: Add validation for roles
	@Column(DataType.JSONB)
	declare roles: string[] | null;

	@Column(DataType.TEXT)
	declare affiliation: string | null;

	@Column(DataType.STRING)
	declare orcid: string | null;

	@Column(DataType.UUID)
	declare userId: string | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare pubId: string;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	declare user?: User;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	declare pub?: Pub;
}
