/**
 * Migration: Add community templates support
 *
 * This migration:
 * 1. Creates the CommunityTemplates table (if sync didn't already)
 * 2. Creates the HubTemplates table (if sync didn't already)
 * 3. Adds templateId column to Communities table
 *
 * Run with: npx ts-node -r tsconfig-paths/register tools/migrationCommunityTemplates.ts
 */
import { DataTypes } from 'sequelize';

// eslint-disable-next-line import/first
import { sequelize } from 'server/models';

console.info('Beginning Migration: Community Templates');

const run = async () => {
	const qi = sequelize.getQueryInterface();

	// Add templateId to Communities if it doesn't exist
	try {
		await qi.addColumn('Communities', 'templateId', {
			type: DataTypes.UUID,
			allowNull: true,
			defaultValue: null,
			references: {
				model: 'CommunityTemplates',
				key: 'id',
			},
			onDelete: 'SET NULL',
		});
		console.info('Added templateId column to Communities');
	} catch (err: any) {
		if (err.message?.includes('already exists')) {
			console.info('templateId column already exists on Communities');
		} else {
			throw err;
		}
	}

	// Add hubId to CommunityTemplates if it doesn't exist
	try {
		await qi.addColumn('CommunityTemplates', 'hubId', {
			type: DataTypes.UUID,
			allowNull: true,
			defaultValue: null,
			references: {
				model: 'Hubs',
				key: 'id',
			},
			onDelete: 'SET NULL',
		});
		console.info('Added hubId column to CommunityTemplates');
	} catch (err: any) {
		if (err.message?.includes('already exists')) {
			console.info('hubId column already exists on CommunityTemplates');
		} else {
			throw err;
		}
	}

	console.info('Migration complete');
	process.exit(0);
};

run().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
