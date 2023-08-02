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
import { MemberPermission } from 'types';
import { User, Community, Pub, Collection } from '../models';

@Table
export class Member extends Model<InferAttributes<Member>, InferCreationAttributes<Member>> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Default('view')
	@Column(DataType.ENUM('view', 'edit', 'manage', 'admin'))
	permissions!: CreationOptional<MemberPermission>;

	@Column(DataType.BOOLEAN)
	isOwner!: boolean | null;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	subscribedToActivityDigest!: CreationOptional<boolean>;

	@AllowNull(false)
	@Column(DataType.UUID)
	userId!: string;

	@Column(DataType.UUID)
	pubId!: string | null;

	@Column(DataType.UUID)
	collectionId!: string | null;

	@Column(DataType.UUID)
	communityId!: string | null;

	@Column(DataType.UUID)
	organizationId!: string | null;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	user?: User;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	community?: Community;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	pub?: Pub;

	@BelongsTo(() => Collection, {
		onDelete: 'CASCADE',
		as: 'collection',
		foreignKey: 'collectionId',
	})
	collection?: Collection;
}
