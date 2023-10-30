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
import type { DocJson, SerializedModel } from 'types';
import { Doc } from '../models';

@Table
export class Release extends Model<InferAttributes<Release>, InferCreationAttributes<Release>> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	// TODO: add validation for noteContent
	@Column(DataType.JSONB)
	declare noteContent: DocJson | null;

	@Column(DataType.TEXT)
	declare noteText: string | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare pubId: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare userId: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare docId: string;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	declare historyKey: number;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare historyKeyMissing: CreationOptional<boolean>;

	@BelongsTo(() => Doc, { as: 'doc', foreignKey: 'docId' })
	declare doc?: Doc;
}
