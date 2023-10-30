import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	Index,
	AllowNull,
	BelongsTo,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
import { Collection, Pub } from '../models';

@Table
export class CollectionPub extends Model<
	InferAttributes<CollectionPub>,
	InferCreationAttributes<CollectionPub>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Index({ unique: true, name: 'collection_pubs_collection_id_pub_id' })
	@AllowNull(false)
	@Column(DataType.UUID)
	declare pubId: string;

	@Index({ unique: true, name: 'collection_pubs_collection_id_pub_id' })
	@AllowNull(false)
	@Column(DataType.UUID)
	declare collectionId: string;

	@Column(DataType.TEXT)
	declare contextHint: string | null;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare rank: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare pubRank: string;

	@BelongsTo(() => Collection, {
		onDelete: 'CASCADE',
		as: 'collection',
		foreignKey: 'collectionId',
	})
	declare collection?: Collection;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	declare pub?: Pub;
}
