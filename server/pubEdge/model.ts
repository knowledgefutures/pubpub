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
import { RelationTypeName } from 'utils/pubEdge/relations';
import { Pub, ExternalPublication } from '../models';

@Table
export class PubEdge extends Model<InferAttributes<PubEdge>, InferCreationAttributes<PubEdge>> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare pubId: string;

	@Column(DataType.UUID)
	declare externalPublicationId: string | null;

	@Column(DataType.UUID)
	declare targetPubId: string | null;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare relationType: RelationTypeName;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare rank: string;

	@AllowNull(false)
	@Column(DataType.BOOLEAN)
	declare pubIsParent: boolean;

	@AllowNull(false)
	@Column(DataType.BOOLEAN)
	declare approvedByTarget: boolean;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	declare pub?: Pub;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'targetPub', foreignKey: 'targetPubId' })
	declare targetPub?: Pub;

	@BelongsTo(() => ExternalPublication, {
		onDelete: 'CASCADE',
		as: 'externalPublication',
		foreignKey: 'externalPublicationId',
	})
	declare externalPublication?: ExternalPublication;
}
