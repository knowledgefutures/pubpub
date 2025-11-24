import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import { Column, DataType, Default, HasOne, Model, PrimaryKey, Table } from 'sequelize-typescript';

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
