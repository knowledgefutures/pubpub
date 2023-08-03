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
import { Pub, ExternalPublication } from '../models';

@Table
class PubEdge extends Model<InferAttributes<PubEdge>, InferCreationAttributes<PubEdge>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.UUID)
	pubId!: string;

	@Column(DataType.UUID)
	externalPublicationId?: string | null;

	@Column(DataType.UUID)
	targetPubId?: string | null;

	@AllowNull(false)
	@Column(DataType.STRING)
	relationType!: string;

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
	// 	pub?: Pub;
	pub?: any;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'targetPub', foreignKey: 'targetPubId' })
	// 	targetPub?: Pub;
	targetPub?: any;

	@BelongsTo(() => ExternalPublication, {
		onDelete: 'CASCADE',
		as: 'externalPublication',
		foreignKey: 'externalPublicationId',
	})
	// 	externalPublication?: ExternalPublication;
	externalPublication?: any;
}

export const PubEdgeAnyModel = PubEdge as any;
