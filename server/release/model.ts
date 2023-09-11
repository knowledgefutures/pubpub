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
	id!: CreationOptional<string>;

	// TODO: add validation for noteContent
	@Column(DataType.JSONB)
	noteContent!: DocJson | null;

	@Column(DataType.TEXT)
	noteText!: string | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	pubId!: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	userId!: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	docId!: string;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	historyKey!: number;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	historyKeyMissing!: CreationOptional<boolean>;

	@BelongsTo(() => Doc, { as: 'doc', foreignKey: 'docId' })
	doc?: Doc;
}
