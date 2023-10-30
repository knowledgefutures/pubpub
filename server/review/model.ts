import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	AllowNull,
	Index,
	BelongsTo,
	HasMany,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
import { DocJson } from 'types';
import { Thread, Visibility, User, Pub, Reviewer } from '../models';

@Table
export class ReviewNew extends Model<
	InferAttributes<ReviewNew>,
	InferCreationAttributes<ReviewNew>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Column(DataType.TEXT)
	declare title: string | null;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	declare number: number;

	@Default('open')
	@Column(DataType.ENUM('open', 'closed', 'completed'))
	declare status: CreationOptional<'open' | 'closed' | 'completed'>;

	@Column(DataType.BOOLEAN)
	declare releaseRequested: boolean | null;

	@Column(DataType.JSONB)
	declare labels: object | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare threadId: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare visibilityId: string;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	declare userId: string | null;

	@Index({ using: 'BTREE' })
	@Column(DataType.UUID)
	declare pubId: string | null;

	// TODO: Add validation
	@Column(DataType.JSONB)
	declare reviewContent: DocJson | null;

	@BelongsTo(() => Thread, { onDelete: 'CASCADE', as: 'thread', foreignKey: 'threadId' })
	declare thread?: Thread;

	@BelongsTo(() => Visibility, {
		onDelete: 'CASCADE',
		as: 'visibility',
		foreignKey: 'visibilityId',
	})
	declare visibility?: Visibility;

	@BelongsTo(() => User, {
		onDelete: 'CASCADE',
		as: 'author',
		foreignKey: 'userId',
		constraints: false,
	})
	declare author?: User;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	declare pub?: Pub;

	@HasMany(() => Reviewer, { onDelete: 'CASCADE', as: 'reviewers', foreignKey: 'reviewId' })
	declare reviewers?: Reviewer[];
}
