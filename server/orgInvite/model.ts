import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	Default,
	ForeignKey,
	Index,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { Community } from '../community/model';
import { Org } from '../org/model';
import { User } from '../user/model';

/**
 * A pending move of a community into an org. Either side can start it:
 *  - 'invite'  — an org admin invites the community; a community admin answers
 *  - 'request' — a community admin asks to join; an org admin answers
 */
@Table
export class OrgInvite extends Model<
	InferAttributes<OrgInvite>,
	InferCreationAttributes<OrgInvite>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Index
	@ForeignKey(() => Org)
	@Column(DataType.UUID)
	declare orgId: string;

	@AllowNull(false)
	@Index
	@ForeignKey(() => Community)
	@Column(DataType.UUID)
	declare communityId: string;

	@AllowNull(false)
	@Column(DataType.ENUM('invite', 'request'))
	declare direction: 'invite' | 'request';

	@AllowNull(false)
	@Default('pending')
	@Column(DataType.ENUM('pending', 'accepted', 'declined', 'cancelled'))
	declare status: CreationOptional<'pending' | 'accepted' | 'declined' | 'cancelled'>;

	/** Who sent the invite or request */
	@AllowNull(false)
	@ForeignKey(() => User)
	@Column(DataType.UUID)
	declare requestedById: string;

	/** Who accepted, declined or cancelled it */
	@AllowNull
	@ForeignKey(() => User)
	@Column(DataType.UUID)
	declare respondedById: CreationOptional<string | null>;

	@AllowNull
	@Column(DataType.DATE)
	declare respondedAt: CreationOptional<Date | null>;

	@BelongsTo(() => Org, { onDelete: 'CASCADE', foreignKey: 'orgId' })
	declare org?: Org;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', foreignKey: 'communityId' })
	declare community?: Community;

	@BelongsTo(() => User, { as: 'requestedBy', onDelete: 'CASCADE', foreignKey: 'requestedById' })
	declare requestedBy?: User;

	@BelongsTo(() => User, { as: 'respondedBy', onDelete: 'SET NULL', foreignKey: 'respondedById' })
	declare respondedBy?: User;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	toJSON(): SerializedModel<OrgInvite> {
		return super.toJSON() as unknown as SerializedModel<OrgInvite>;
	}
}
