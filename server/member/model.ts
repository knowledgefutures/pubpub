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
// import { MemberPermission } from 'types';
import { User, Community, Pub, Collection } from '../models';

@Table
class Member extends Model<InferAttributes<Member>, InferCreationAttributes<Member>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Default('view')
	@Column(DataType.ENUM('view', 'edit', 'manage', 'admin'))
	// 	permissions?: CreationOptional<MemberPermission | null>;
	permissions?: any;

	@Column(DataType.BOOLEAN)
	isOwner?: boolean | null;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	subscribedToActivityDigest!: CreationOptional<boolean>;

	@AllowNull(false)
	@Column(DataType.UUID)
	userId!: string;

	@Column(DataType.UUID)
	pubId?: string | null;

	@Column(DataType.UUID)
	collectionId?: string | null;

	@Column(DataType.UUID)
	communityId?: string | null;

	@Column(DataType.UUID)
	organizationId?: string | null;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	// 	user?: User;
	user?: any;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	// 	community?: Community;
	community?: any;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	// 	pub?: Pub;
	pub?: any;

	@BelongsTo(() => Collection, {
		onDelete: 'CASCADE',
		as: 'collection',
		foreignKey: 'collectionId',
	})
	// 	collection?: Collection;
	collection?: any;
}

export const MemberAnyModel = Member as any;
