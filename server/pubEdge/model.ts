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
	id!: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.UUID)
	pubId!: string;

	@Column(DataType.UUID)
	externalPublicationId!: string | null;

	@Column(DataType.UUID)
	targetPubId!: string | null;

	@AllowNull(false)
	@Column(DataType.STRING)
	relationType!: RelationTypeName;

	@AllowNull(false)
	@Column(DataType.TEXT)
	rank!: string;

	@AllowNull(false)
	@Column(DataType.BOOLEAN)
	pubIsParent!: boolean;

	@AllowNull(false)
	@Column(DataType.BOOLEAN)
	approvedByTarget!: boolean;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	pub?: Pub;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'targetPub', foreignKey: 'targetPubId' })
	targetPub?: Pub;

	@BelongsTo(() => ExternalPublication, {
		onDelete: 'CASCADE',
		as: 'externalPublication',
		foreignKey: 'externalPublicationId',
	})
	externalPublication?: ExternalPublication;
}
