import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	Index,
	BelongsTo,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { SerializedModel } from 'types';
import { Community, Collection, Pub } from '../../models';

@Table
export class FacetBinding extends Model<
	InferAttributes<FacetBinding>,
	InferCreationAttributes<FacetBinding>
> {
	declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	declare pubId: string | null;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	declare collectionId: string | null;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	declare communityId: string | null;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	declare community?: Community;

	@BelongsTo(() => Collection, {
		onDelete: 'CASCADE',
		as: 'collection',
		foreignKey: 'collectionId',
	})
	declare collection?: Collection;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	declare pub?: Pub;
}
