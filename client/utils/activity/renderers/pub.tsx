import React from 'react';

import {
	PubCreatedActivityItem,
	PubUpdatedActivityItem,
	PubRemovedActivityItem,
	PubReleasedActivityItem,
	PubEdgeCreatedActivityItem,
	PubEdgeRemovedActivityItem,
	PubDiscussionCommentAddedActivityItem,
	PubReviewCreatedActivityItem,
	PubReviewCommentAddedActivityItem,
	PubReviewUpdatedActivityItem,
} from 'types';

import {
	pubTitle,
	pubEdgeTitle,
	pubEdgeTargetTitle,
	releaseTitle,
	reviewTitle,
	discussionTitle,
} from '../titles';
import { itemRenderer } from './itemRenderer';

type BaseTitles = 'pub';
type ReleaseTitles = BaseTitles | 'release';
type PubEdgeTitles = BaseTitles | 'target' | 'edge';
type DiscussionTitles = BaseTitles | 'discussion';
type ReviewTitles = BaseTitles | 'review';

export const renderPubCreated = itemRenderer<PubCreatedActivityItem, BaseTitles>({
	icon: 'pubDoc',
	titleRenderers: {
		pub: pubTitle,
	},
	message: ({ titles }) => {
		const { actor, pub } = titles;
		return (
			<>
				{actor} created {pub}
			</>
		);
	},
});

export const renderPubUpdated = itemRenderer<PubUpdatedActivityItem, BaseTitles>({
	icon: 'pubDoc',
	titleRenderers: {
		pub: pubTitle,
	},
	message: ({ item, titles }) => {
		const { payload } = item;
		const { actor, pub } = titles;
		if (payload.draft) {
			return (
				<>
					{actor} edited {pub}
				</>
			);
		}
		if (payload.doi) {
			return (
				<>
					{actor} set the DOI of {pub} to {payload.doi.to}
				</>
			);
		}
		if (payload.attributions) {
			return (
				<>
					{actor} updated the contributors to {pub}
				</>
			);
		}
		if (payload.title) {
			return (
				<>
					{actor} changed the title of {pub} from <i>{payload.title.from}</i> to{' '}
					<i>{payload.title.to}</i>
				</>
			);
		}
		if (payload.slug) {
			return (
				<>
					{actor} changed the slug of {pub} from {payload.slug.from} to {payload.slug.to}
				</>
			);
		}
		return (
			<>
				{actor} updated the settings for {pub}
			</>
		);
	},
});

export const renderPubRemoved = itemRenderer<PubRemovedActivityItem, BaseTitles>({
	icon: 'pubDoc',
	titleRenderers: {
		pub: pubTitle,
	},
	message: ({ titles }) => {
		const { actor, pub } = titles;
		return (
			<>
				{actor} removed {pub}
			</>
		);
	},
});

export const renderPubReleased = itemRenderer<PubReleasedActivityItem, ReleaseTitles>({
	icon: 'document-share',
	titleRenderers: {
		pub: pubTitle,
		release: releaseTitle,
	},
	message: ({ titles }) => {
		const { actor, pub, release } = titles;
		return (
			<>
				{actor} created {release} of {pub}
			</>
		);
	},
});

export const renderPubEdgeCreated = itemRenderer<PubEdgeCreatedActivityItem, PubEdgeTitles>({
	icon: 'layout-auto',
	titleRenderers: {
		pub: pubTitle,
		edge: pubEdgeTitle,
		target: pubEdgeTargetTitle,
	},
	message: ({ titles }) => {
		const { actor, edge, target, pub } = titles;
		return (
			<>
				{actor} created {edge} with {target} for {pub}
			</>
		);
	},
});

export const renderPubEdgeRemoved = itemRenderer<PubEdgeRemovedActivityItem, PubEdgeTitles>({
	icon: 'layout-auto',
	titleRenderers: {
		pub: pubTitle,
		edge: pubEdgeTitle,
		target: pubEdgeTargetTitle,
	},
	message: ({ titles }) => {
		const { actor, edge, target, pub } = titles;
		return (
			<>
				{actor} removed {edge} with {target} from {pub}
			</>
		);
	},
});

export const renderPubDiscussionCommentAdded = itemRenderer<
	PubDiscussionCommentAddedActivityItem,
	DiscussionTitles
>({
	icon: 'chat',
	titleRenderers: {
		pub: pubTitle,
		discussion: discussionTitle,
	},
	message: ({ titles }) => {
		const { actor, pub, discussion } = titles;
		return (
			<>
				{actor} added {discussion} to {pub}
			</>
		);
	},
	excerpt: ({ item }) => {
		return item.payload.threadComment.text;
	},
});

export const renderPubReviewCreated = itemRenderer<PubReviewCreatedActivityItem, ReviewTitles>({
	icon: 'social-media',
	titleRenderers: {
		pub: pubTitle,
		review: reviewTitle,
	},
	message: ({ titles }) => {
		const { actor, pub, review } = titles;
		return (
			<>
				{actor} created {review} on {pub}
			</>
		);
	},
	excerpt: ({ item }) => {
		const { threadComment } = item.payload;
		if (threadComment) {
			return threadComment.text;
		}
		return null;
	},
});

export const renderPubReviewCommentAdded = itemRenderer<
	PubReviewCommentAddedActivityItem,
	ReviewTitles
>({
	icon: 'social-media',
	titleRenderers: {
		pub: pubTitle,
		review: reviewTitle,
	},
	message: ({ titles }) => {
		const { actor, pub, review } = titles;
		return (
			<>
				{actor} added a comment to {review} on {pub}
			</>
		);
	},
	excerpt: ({ item }) => {
		return item.payload.threadComment.text;
	},
});

export const renderPubReviewUpdated = itemRenderer<PubReviewUpdatedActivityItem, ReviewTitles>({
	icon: 'social-media',
	titleRenderers: {
		pub: pubTitle,
		review: reviewTitle,
	},
	message: ({ titles, item }) => {
		const { actor, pub, review } = titles;
		const { status } = item.payload;
		if (status) {
			return (
				<>
					{actor} changed the status of {review} on {pub} from <i>{status.from}</i> to{' '}
					<i>{status.to}</i>
				</>
			);
		}
		return (
			<>
				{actor} updated {review} on {pub}
			</>
		);
	},
});
