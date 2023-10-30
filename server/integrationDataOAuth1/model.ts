import { Model, Table, Column, DataType, PrimaryKey, Default, HasOne } from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
import { ZoteroIntegration } from '../models';

@Table({
	tableName: 'IntegrationDataOAuth1',
})
export class IntegrationDataOAuth1 extends Model<
	InferAttributes<IntegrationDataOAuth1>,
	InferCreationAttributes<IntegrationDataOAuth1>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Column(DataType.TEXT)
	declare accessToken: string | null;

	@HasOne(() => ZoteroIntegration, {
		foreignKey: { allowNull: false, name: 'integrationDataOAuth1Id' },
		as: 'zoteroIntegration',
		onDelete: 'CASCADE',
	})
	declare zoteroIntegration?: ZoteroIntegration;
}
