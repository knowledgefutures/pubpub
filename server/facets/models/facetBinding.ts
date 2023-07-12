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
import { Community, Collection, Pub } from '../../models';

@Table
class FacetBinding extends Model<
	InferAttributes<FacetBinding>,
	InferCreationAttributes<FacetBinding>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	pubId?: string | null;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	collectionId?: string | null;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	communityId?: string | null;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	// 	community?: Community;
	community?: any;

	@BelongsTo(() => Collection, {
		onDelete: 'CASCADE',
		as: 'collection',
		foreignKey: 'collectionId',
	})
	// 	collection?: Collection;
	collection?: any;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	// 	pub?: Pub;
	pub?: any;
}

export const FacetBindingAnyModel = FacetBinding as any;
