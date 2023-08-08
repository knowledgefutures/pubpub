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
import { MinimalUser } from 'types';
import { User, Collection } from '../models';

@Table
export class CollectionAttribution extends Model<
	InferAttributes<CollectionAttribution>,
	InferCreationAttributes<CollectionAttribution>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.TEXT)
	name!: string | null;

	@Column(DataType.TEXT)
	avatar!: string | null;

	@Column(DataType.TEXT)
	title!: string | null;

	// TODO: Add AllowNull(false) for this. Made non-null as that is how its used, but technically still nullable in the db
	@Column(DataType.DOUBLE)
	order!: number;

	@Column(DataType.BOOLEAN)
	isAuthor!: boolean | null;

	// TODO: Add validation for roles
	@Column(DataType.JSONB)
	roles!: string[] | null;

	@Column(DataType.TEXT)
	affiliation!: string | null;

	@Column(DataType.STRING)
	orcid!: string | null;

	@Column(DataType.UUID)
	userId!: string | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	collectionId!: string;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	user?: MinimalUser;

	@BelongsTo(() => Collection, {
		onDelete: 'CASCADE',
		as: 'collection',
		foreignKey: 'collectionId',
	})
	collection?: Collection;
}
