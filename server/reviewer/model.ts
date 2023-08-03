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
import { ReviewNew } from '../models';

@Table
class Reviewer extends Model<InferAttributes<Reviewer>, InferCreationAttributes<Reviewer>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.TEXT)
	name?: string | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	reviewId!: string;

	@BelongsTo(() => ReviewNew, { onDelete: 'CASCADE', as: 'review', foreignKey: 'reviewId' })
	// 	review?: ReviewNew;
	review?: any;
}

export const ReviewerAnyModel = Reviewer as any;
