import * as types from 'types';
import { formatDate } from 'utils/dates';
import { pubUrl, pubShortUrl } from 'utils/canonicalUrls';
import { getPubPublishedDate } from 'utils/pub/pubDates';
import { getAllPubContributors } from 'utils/contributors';

import { Community, Pub } from 'server/models';
import { RelationType } from './relations';

export const getHostnameForUrl = (url: string) => {
	try {
		const parsedUrl = new URL(url);
		return parsedUrl.hostname;
	} catch (_) {
		return url;
	}
};

export const getUrlForPub = (
	pubData: types.Pub | Pub,
	communityData: types.Community | Community,
) => {
	if (communityData.id === pubData.communityId) {
		return pubUrl(communityData, pubData);
	}
	if (pubData.community) {
		return pubUrl(pubData.community, pubData);
	}
	return pubShortUrl(pubData);
};

export const isViewingEdgeFromTarget = (
	pubEdge: types.PubEdge,
	viewingFromSibling: boolean,
	isInboundEdge: boolean,
) => {
	const { pubIsParent } = pubEdge;
	if (viewingFromSibling) {
		// If the `pub` in the edge relationship is the parent, then the `targetPub` is the child.
		// We want this edge to display the child -- in other words, we want to view from the
		// `targetPub` towards the `pub` only if the `pub` is the child.
		return !pubIsParent;
	}
	// If this edge is inbound, that means another Pub (relative to our vantage point) created it,
	// which is to say that we're viewing it from the target.
	return isInboundEdge;
};

export const getDisplayedPubForPubEdge = (
	pubEdge: types.PubEdge,
	context:
		| { viewingFromTarget: boolean }
		| { isInboundEdge: boolean; viewingFromSibling: boolean },
) => {
	const { pub, targetPub } = pubEdge;
	const isViewingFromTarget =
		'viewingFromTarget' in context
			? context.viewingFromTarget
			: isViewingEdgeFromTarget(pubEdge, context.viewingFromSibling, context.isInboundEdge);
	return isViewingFromTarget ? pub : targetPub;
};

export const getValuesFromPubEdge = (
	pubEdge: types.PubEdge,
	communityData: types.Community,
	viewingFromTarget: boolean,
) => {
	const { externalPublication } = pubEdge;
	const displayedPub = getDisplayedPubForPubEdge(pubEdge, {
		viewingFromTarget,
	});
	if (displayedPub) {
		const { title, description, avatar } = displayedPub;
		const url = getUrlForPub(displayedPub, communityData);
		const publishedDate = getPubPublishedDate(displayedPub);
		return {
			displayedPubId: displayedPub.id,
			avatar,
			contributors: getAllPubContributors(displayedPub, 'contributors', false, true),
			description,
			publishedAt: publishedDate && formatDate(publishedDate),
			title,
			url,
		};
	}
	if (externalPublication) {
		const { title, description, contributors, avatar, url, publicationDate } =
			externalPublication;
		return {
			avatar,
			contributors: contributors || '',
			description,
			publishedAt: publicationDate && formatDate(publicationDate, { inUtcTime: true }),
			title,
			url,
		};
	}
	return {};
};

export const createCandidateEdge = (resource, relationType = RelationType.Reply) => {
	return {
		relationType,
		pubIsParent: true,
		...resource,
	};
};

export const stripMarkupFromString = (string) => {
	if (string) {
		const div = document.createElement('div');
		div.innerHTML = string;
		return div.innerText;
	}
	return string;
};
