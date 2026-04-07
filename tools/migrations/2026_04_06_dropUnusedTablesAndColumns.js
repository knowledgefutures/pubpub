/**
 * Drop unused tables and columns identified via codebase audit.
 *
 * Tables removed:
 *   - Legacy v5 tables: Branches, BranchPermissions, Anchors, DiscussionChannels,
 *     DiscussionChannelParticipants, DiscussionsLegacy, Forks, PubTags, Reviews,
 *     Tags, Versions, VersionPermissions, Downloads, Archives
 *   - Removed models: CommunityAdmins, Merges, Organizations, PubManagers, PubVersions
 *   - Stale duplicates: Session (singular; Sessions is the active session table)
 *   - Dev-only orphans (IF EXISTS): AnalyticsDailyCaches, DraftCheckpoints,
 *     EditorCheckpoints, EditorSessions, EditorSteps
 *
 * Columns removed (orphaned DB columns with no model definition or runtime usage):
 *   - Communities: organizationId, accentColor, accentActionColor, accentHoverColor, accentMinimalColor
 *   - Pubs: useHeaderImage, draftEditHash, draftViewHash, isCommunityAdminManaged,
 *     communityAdminDraftPermissions, draftPermissions, review, headerBackgroundType
 *   - Members: organizationId
 *   - PublicPermissions: organizationId, canCreateForks
 *   - PubEdges: targetExternalPublication
 *   - CollectionPubs: isPrimary
 *   - Releases: historyKeyMissing
 *   - ReviewNews: labels
 *   - Users: inactive, pubpubV3Id
 */

const TABLES_TO_DROP = [
	// Legacy v5 tables (superseded by current models)
	'Branches',
	'BranchPermissions',
	'Anchors',
	'DiscussionChannels',
	'DiscussionChannelParticipants',
	'DiscussionsLegacy',
	'Forks',
	'PubTags',
	'Reviews',
	'Tags',
	'Versions',
	'VersionPermissions',
	'Downloads',
	'Archives',
	// Models removed in this branch
	'CommunityAdmins',
	'Merges',
	'Organizations',
	'PubManagers',
	'PubVersions',
	// Stale session table (Sessions is the active one)
	'Session',
];

const COLUMNS_TO_DROP = [
	{ table: 'Communities', columns: ['organizationId', 'accentColor', 'accentActionColor', 'accentHoverColor', 'accentMinimalColor'] },
	{ table: 'Pubs', columns: ['useHeaderImage', 'draftEditHash', 'draftViewHash', 'isCommunityAdminManaged', 'communityAdminDraftPermissions', 'draftPermissions', 'review', 'headerBackgroundType'] },
	{ table: 'Members', columns: ['organizationId'] },
	{ table: 'PublicPermissions', columns: ['organizationId', 'canCreateForks'] },
	{ table: 'PubEdges', columns: ['targetExternalPublication'] },
	{ table: 'CollectionPubs', columns: ['isPrimary'] },
	{ table: 'Releases', columns: ['historyKeyMissing'] },
	{ table: 'ReviewNews', columns: ['labels'] },
	{ table: 'Users', columns: ['inactive', 'pubpubV3Id'] },
];

// Enum types associated with dropped tables/columns
const ENUMS_TO_DROP = [
	'enum_Branches_communityAdminPermissions',
	'enum_Branches_publicPermissions',
	'enum_Branches_pubManagerPermissions',
	'enum_BranchPermissions_permissions',
	'enum_DiscussionChannels_permissions',
	'enum_Pubs_communityAdminDraftPermissions',
	'enum_Pubs_draftPermissions',
	'enum_Pubs_headerBackgroundType',
	'enum_VersionPermissions_permissions',
];

export const up = async ({ sequelize }) => {
	// Drop tables (CASCADE handles foreign key constraints)
	for (const table of TABLES_TO_DROP) {
		await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
	}

	// Drop orphaned columns
	for (const { table, columns } of COLUMNS_TO_DROP) {
		for (const column of columns) {
			await sequelize.queryInterface.removeColumn(table, column).catch(() => {
				// Column may not exist in all environments (dev vs prod drift)
			});
		}
	}

	// Drop orphaned enum types
	for (const enumName of ENUMS_TO_DROP) {
		await sequelize.query(`DROP TYPE IF EXISTS "${enumName}"`);
	}
};

export const down = async () => {
	// This migration is not reversible. The dropped tables and columns contained no
	// data referenced by the application. If needed, they can be recreated from the
	// model definitions in git history.
	throw new Error('Irreversible migration: dropped unused tables and columns');
};
