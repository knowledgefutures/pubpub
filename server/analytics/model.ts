import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import { Op } from 'sequelize';
import {
	AllowNull,
	Column,
	DataType,
	Default,
	Index,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

@Table({
	updatedAt: false,
	// Map Sequelize's auto-managed createdAt to our renamed column (was "timestamp")
	createdAt: 'createdAt',
	indexes: [
		{
			name: 'analytics_events_community_event_created',
			fields: ['communityId', 'event', 'createdAt'],
		},
		{ name: 'analytics_events_pub_event_created', fields: ['pubId', 'event', 'createdAt'] },
		{
			name: 'analytics_events_collection_event_created',
			fields: ['collectionId', 'event', 'createdAt'],
		},
		{
			name: 'analytics_events_community_created',
			fields: ['communityId', 'createdAt'],
		},
		{
			name: 'analytics_events_community_pages',
			fields: ['communityId', 'createdAt', 'isUnique'],
			where: { event: { [Op.in]: ['page', 'pub', 'collection', 'other'] } },
		},
		{
			name: 'analytics_events_pub_views_dl',
			fields: ['communityId', 'pubId', 'createdAt'],
			where: {
				pubId: { [Op.ne]: null },
				event: { [Op.in]: ['pub', 'download'] },
			},
		},
	],
})
export class AnalyticsEvent extends Model<
	InferAttributes<AnalyticsEvent>,
	InferCreationAttributes<AnalyticsEvent>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare type: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare event: string;

	// Sequelize auto-manages this via `createdAt: 'createdAt'` in Table options.
	// For imported rows the value was preserved from the original Redshift "timestamp" column.
	declare createdAt: CreationOptional<Date>;

	@Column(DataType.TEXT)
	declare referrer: string | null;

	@Column(DataType.BOOLEAN)
	declare isUnique: boolean | null;

	@Column(DataType.TEXT)
	declare search: string | null;

	@Column(DataType.TEXT)
	declare utmSource: string | null;

	@Column(DataType.TEXT)
	declare utmMedium: string | null;

	@Column(DataType.TEXT)
	declare utmCampaign: string | null;

	@Column(DataType.TEXT)
	declare utmTerm: string | null;

	@Column(DataType.TEXT)
	declare utmContent: string | null;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare timezone: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare locale: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare userAgent: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare os: string;

	@Column(DataType.UUID)
	declare communityId: string | null;

	@Column(DataType.TEXT)
	declare url: string | null;

	@Column(DataType.TEXT)
	declare hash: string | null;

	@Column(DataType.INTEGER)
	declare height: number | null;

	@Column(DataType.INTEGER)
	declare width: number | null;

	@Column(DataType.TEXT)
	declare path: string | null;

	@Column(DataType.UUID)
	declare pageId: string | null;

	@Column(DataType.UUID)
	declare collectionId: string | null;

	@Column(DataType.UUID)
	declare pubId: string | null;

	@Column(DataType.TEXT)
	declare release: string | null;

	@Column(DataType.TEXT)
	declare format: string | null;
}
