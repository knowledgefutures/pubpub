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
import { ReviewNew } from '../models';

@Table
export class Reviewer extends Model<InferAttributes<Reviewer>, InferCreationAttributes<Reviewer>> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Column(DataType.TEXT)
	declare name: string | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare reviewId: string;

	@BelongsTo(() => ReviewNew, { onDelete: 'CASCADE', as: 'review', foreignKey: 'reviewId' })
	declare review?: ReviewNew;
}
