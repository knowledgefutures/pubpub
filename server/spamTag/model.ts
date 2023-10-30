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
import type { SerializedModel } from 'types';
import { SpamStatus } from 'types';

@Table
export class SpamTag extends Model<InferAttributes<SpamTag>, InferCreationAttributes<SpamTag>> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	// TODO: this should probably be an enum
	@AllowNull(false)
	@Default('unreviewed')
	@Column(DataType.STRING)
	declare status: CreationOptional<SpamStatus>;

	@Column(DataType.DATE)
	declare statusUpdatedAt: Date | null;

	/**
	 * TODO: add validation and better type for fields
	 * Should probably be
	 * {
  heroText: [
    "casino"
  ],
  declare description?: [
    "casino"
  ]
} | 
	{
  title: [
    "buy"
  ],
  declare heroTitle?: [
    "buy"
  ],
  declare subdomain?: [
    "buy"
  ]
}
	 */
	@AllowNull(false)
	@Column(DataType.JSONB)
	declare fields: Record<string, string[]>;

	@AllowNull(false)
	@Column(DataType.DOUBLE)
	declare spamScore: number;

	@AllowNull(false)
	@Column(DataType.DATE)
	declare spamScoreComputedAt: Date;

	@Default(1)
	@Column(DataType.INTEGER)
	declare spamScoreVersion: CreationOptional<number | null>;
}
