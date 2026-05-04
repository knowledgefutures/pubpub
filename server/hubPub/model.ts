import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	Default,
	ForeignKey,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { Hub } from '../hub/model';
import { Pub } from '../pub/model';

@Table({
	indexes: [
		{
			unique: true,
			fields: ['hubId', 'pubId'],
			name: 'HubPubs_hubId_pubId_unique',
		},
	],
})
export class HubPub extends Model<InferAttributes<HubPub>, InferCreationAttributes<HubPub>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@ForeignKey(() => Hub)
	@Column(DataType.UUID)
	declare hubId: string;

	@ForeignKey(() => Pub)
	@Column(DataType.UUID)
	declare pubId: string;

	/** Ordering key for curated lists (lexicographic rank string). */
	@AllowNull
	@Column(DataType.TEXT)
	declare rank: string | null;

	/** Whether this pub appears on the hub's public landing page. */
	@AllowNull(false)
	@Default(true)
	@Column(DataType.BOOLEAN)
	declare showOnLandingPage: CreationOptional<boolean>;

	/**
	 * Level of data the hub can see for this pub.
	 *  - 'none'      — listing only (default)
	 *  - 'requested' — hub has asked for analytics access; awaiting pub admin approval
	 *  - 'granted'   — hub can see analytics for this pub
	 */
	@AllowNull(false)
	@Default('none')
	@Column(DataType.ENUM('none', 'requested', 'granted'))
	declare dataAccess: CreationOptional<'none' | 'requested' | 'granted'>;

	@BelongsTo(() => Hub, { onDelete: 'CASCADE', foreignKey: 'hubId' })
	declare hub?: Hub;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', foreignKey: 'pubId' })
	declare pub?: Pub;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	toJSON(): SerializedModel<HubPub> {
		return super.toJSON() as unknown as SerializedModel<HubPub>;
	}
}
