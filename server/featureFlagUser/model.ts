import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	BelongsTo,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
import { User, FeatureFlag } from '../models';

@Table
export class FeatureFlagUser extends Model<
	InferAttributes<FeatureFlagUser>,
	InferCreationAttributes<FeatureFlagUser>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Column(DataType.UUID)
	declare featureFlagId: string | null;

	@Column(DataType.UUID)
	declare userId: string | null;

	@Column(DataType.BOOLEAN)
	declare enabled: boolean | null;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	declare user?: User;

	@BelongsTo(() => FeatureFlag, {
		onDelete: 'CASCADE',
		as: 'featureFlag',
		foreignKey: 'featureFlagId',
	})
	declare featureFlag?: FeatureFlag;
}
