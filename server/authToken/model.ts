import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	Default,
	Model,
	PrimaryKey,
	Table,
	Unique,
} from 'sequelize-typescript';
import type { SerializedModel } from 'types/serializedModel';
import { Community, User } from '../models';

@Table
export class AuthToken extends Model<
	InferAttributes<AuthToken>,
	InferCreationAttributes<AuthToken>
> {
	declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare userId: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare communityId: string;

	@Unique
	@Default(DataType.UUIDV4)
	@Column(DataType.TEXT)
	declare token: CreationOptional<string>;

	@Column(DataType.DATE)
	declare expiresAt: Date | null;

	@BelongsTo(() => User, {
		as: 'user',
		foreignKey: 'userId',
		onDelete: 'CASCADE',
	})
	declare user?: User;

	@BelongsTo(() => Community, {
		as: 'community',
		foreignKey: 'communityId',
		onDelete: 'CASCADE',
	})
	declare community?: Community;
}
