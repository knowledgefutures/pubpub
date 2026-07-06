import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import {
	BelongsTo,
	Column,
	DataType,
	Default,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { Community } from '../community/model';

@Table
export class FtpTarget extends Model<
	InferAttributes<FtpTarget>,
	InferCreationAttributes<FtpTarget>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Column(DataType.UUID)
	declare communityId: string | null;

	@Column(DataType.STRING)
	declare name: string | null;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	declare community?: Community;

	@Column(DataType.ENUM('sftp', 'ftps'))
	declare ftpType: 'sftp' | 'ftps' | null;

	@Column(DataType.INTEGER)
	declare port: number | null;

	@Column(DataType.STRING)
	declare host: string | null;

	@Column(DataType.STRING)
	declare filePath: string | null;

	@Column(DataType.STRING)
	declare username: string | null;

	@Column(DataType.STRING)
	declare password: string | null;

	@Column(DataType.TEXT)
	declare passwordInitVec: string | null;
}
