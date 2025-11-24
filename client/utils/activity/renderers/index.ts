import type { ActivityItemRenderers } from '../types';

import {
	renderCollectionCreated,
	renderCollectionPubCreated,
	renderCollectionPubRemoved,
	renderCollectionRemoved,
	renderCollectionUpdated,
} from './collection';
import { renderCommunityCreated, renderCommunityUpdated } from './community';
import { renderFacetInstanceUpdated } from './facet';
import { renderMemberCreated, renderMemberRemoved, renderMemberUpdated } from './member';
import { renderPageCreated, renderPageRemoved, renderPageUpdated } from './page';
import {
	renderPubCreated,
	renderPubDiscussionCommentAdded,
	renderPubEdgeCreated,
	renderPubEdgeRemoved,
	renderPubReleased,
	renderPubRemoved,
	renderPubReviewCommentAdded,
	renderPubReviewCreated,
	renderPubReviewUpdated,
	renderPubUpdated,
} from './pub';
import { renderSubmissionUpdated } from './submission';

export const activityItemRenderers: ActivityItemRenderers = {
	'community-created': renderCommunityCreated,
	'community-updated': renderCommunityUpdated,
	'collection-created': renderCollectionCreated,
	'collection-updated': renderCollectionUpdated,
	'collection-removed': renderCollectionRemoved,
	'collection-pub-created': renderCollectionPubCreated,
	'collection-pub-removed': renderCollectionPubRemoved,
	'facet-instance-updated': renderFacetInstanceUpdated,
	'page-created': renderPageCreated,
	'page-updated': renderPageUpdated,
	'page-removed': renderPageRemoved,
	'pub-created': renderPubCreated,
	'pub-updated': renderPubUpdated,
	'pub-removed': renderPubRemoved,
	'pub-release-created': renderPubReleased,
	'pub-edge-created': renderPubEdgeCreated,
	'pub-edge-removed': renderPubEdgeRemoved,
	'pub-discussion-comment-added': renderPubDiscussionCommentAdded,
	'pub-review-created': renderPubReviewCreated,
	'pub-review-comment-added': renderPubReviewCommentAdded,
	'pub-review-updated': renderPubReviewUpdated,
	'member-created': renderMemberCreated,
	'member-updated': renderMemberUpdated,
	'member-removed': renderMemberRemoved,
	'submission-status-updated': renderSubmissionUpdated,
};
