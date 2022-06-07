import { Community, Pub, PubEdge } from 'types';
import { formatDate } from 'utils/dates';
import { pubUrl, pubShortUrl } from 'utils/canonicalUrls';
import { getPubPublishedDate } from 'utils/pub/pubDates';
import { getAllPubContributors } from 'utils/contributors';

export const getHostnameForUrl = (url: string) => {
	try {
		const parsedUrl = new URL(url);
		return parsedUrl.hostname;
	} catch (_) {
		return url;
	}
};

export const getUrlForPub = (pubData: Pub, communityData: Community) => {
	if (communityData.id === pubData.communityId) {
		return pubUrl(communityData, pubData);
	}
	if ((pubData as any).community) {
		return pubUrl(pubData.communityId, pubData);
	}
	return pubShortUrl(pubData);
};

export const isViewingEdgeFromTarget = (
	pubEdge: PubEdge,
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
	pubEdge: PubEdge,
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
	pubEdge: PubEdge,
	communityData: Community,
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
