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
import { User, IntegrationDataOAuth1 } from '../models';

@Table
class ZoteroIntegration extends Model<
	InferAttributes<ZoteroIntegration>,
	InferCreationAttributes<ZoteroIntegration>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.TEXT)
	zoteroUsername?: string | null;

	@Column(DataType.TEXT)
	zoteroUserId?: string | null;

	@Column(DataType.UUID)
	userId?: string | null;

	@Column(DataType.UUID)
	integrationDataOAuth1Id?: string | null;

	@BelongsTo(() => User, { as: 'user', foreignKey: { allowNull: false, name: 'userId' } })
	// 	user?: User;
	user?: any;

	@BelongsTo(() => IntegrationDataOAuth1, {
		foreignKey: { allowNull: false, name: 'integrationDataOAuth1Id' },
		as: 'integrationDataOAuth1',
		onDelete: 'CASCADE',
	})
	// 	integrationDataOAuth1?: IntegrationDataOAuth1;
	integrationDataOAuth1?: any;
}

export const ZoteroIntegrationAnyModel = ZoteroIntegration as any;
