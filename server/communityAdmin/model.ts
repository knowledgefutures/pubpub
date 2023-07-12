import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	AllowNull,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

@Table
class CommunityAdmin extends Model<
	InferAttributes<CommunityAdmin>,
	InferCreationAttributes<CommunityAdmin>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.UUID)
	userId!: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	communityId!: string;
}

export const CommunityAdminAnyModel = CommunityAdmin as any;
