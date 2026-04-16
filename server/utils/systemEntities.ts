/**
 * Well-known IDs for system entities used by account/community deletion.
 *
 * These must match the values seeded by the migration
 * 2026_04_13_prepareAccountAndCommunityDeletion.js
 */

/** A placeholder User row. Assigned as the author of ThreadEvents, ReviewEvents,
 *  Releases, Discussions, etc. after a real user deletes their account. */
export const DELETED_USER_ID = '00000000-0000-0000-0000-000000000000';

/** The archive.pubpub.org community. DOI'd pubs are moved here when their
 *  parent community is deleted, so DOI URLs remain resolvable. */
export const ARCHIVE_COMMUNITY_ID = '00000000-0000-0000-0000-000000000001';
