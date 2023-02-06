import { ActivityItemRenderers } from '../types';

import { renderCommunityCreated, renderCommunityUpdated } from './community';
import {
	renderCollectionCreated,
	renderCollectionPubCreated,
	renderCollectionPubRemoved,
	renderCollectionRemoved,
	renderCollectionUpdated,
} from './collection';
import { renderPageCreated, renderPageUpdated, renderPageRemoved } from './page';
import {
	renderPubCreated,
	renderPubRemoved,
	renderPubUpdated,
	renderPubReleased,
	renderPubEdgeCreated,
	renderPubEdgeRemoved,
	renderPubDiscussionCommentAdded,
	renderPubReviewCreated,
	renderPubReviewCommentAdded,
	renderPubReviewUpdated,
} from './pub';
import { renderMemberCreated, renderMemberRemoved, renderMemberUpdated } from './member';

import { renderSubmissionUpdated } from './submission';
import { renderFacetInstanceUpdated } from './facet';

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
