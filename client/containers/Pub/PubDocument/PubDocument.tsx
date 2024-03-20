import React, { useRef } from 'react';

import { usePageContext } from 'utils/hooks';
import { PubHistoryViewer } from 'components';
import {
	PubEdgeListing,
	Filter as PubEdgeFilter,
	Mode as PubEdgeMode,
} from 'components/PubEdgeListing';
import { useFacetsQuery } from 'client/utils/useFacets';
import { chooseCollectionForPub } from 'client/utils/collections';
import { getPrimaryCollection } from 'utils/collections/primary';
import { usePageOnce } from 'utils/analytics/usePageOnce';

import { usePubContext } from '../pubHooks';
import { usePermalinkOnMount } from '../usePermalinkOnMount';
import { usePubHrefs } from '../usePubHrefs';
import PubBody from './PubBody';
import PubBottom from './PubBottom/PubBottom';
import PubFileImport from './PubFileImport';
import PubHeaderFormatting from './PubHeaderFormatting';
import PubHistoricalNotice from './PubHistoricalNotice';
import PubInlineMenu from './PubInlineMenu';
import PubInlineSuggestedEdits from './PubInlineSuggestedEdits';
import PubLinkController from './PubLinkController';
import PubMaintenanceNotice from './PubMaintenanceNotice';

require('./pubDocument.scss');

const PubDocument = () => {
	const {
		pubData,
		historyData,
		collabData,
		updatePubData,
		updateLocalData,
		pubBodyState: { isReadOnly, hidePubBody },
	} = usePubContext();
	const { isViewingHistory } = historyData;
	const { communityData, scopeData, featureFlags, locationData, gdprConsent } = usePageContext();
	const pubEdgeDisplay = useFacetsQuery((F) => F.PubEdgeDisplay);
	const { canEdit, canEditDraft } = scopeData.activePermissions;
	const { isReviewingPub } = pubData;
	const mainContentRef = useRef<null | HTMLDivElement>(null);
	const sideContentRef = useRef(null);
	const editorWrapperRef = useRef(null);

	usePermalinkOnMount();
	usePubHrefs({ enabled: !isReadOnly });

	const showPubFileImport = (canEdit || canEditDraft) && !isReadOnly;

	const uniqueCollectionIds = Array.from(
		new Set((pubData.collectionPubs ?? []).map((cp) => cp.collectionId)),
	);
	// we want to make this a string of comma separated UUIDs instead of an array
	// because Stitch will turn an array into a separate table with an event for each
	// UUID in the array, which creates a ton of events for a single page view if the pub
	// is in a lot of collections
	// much easier to just have a single event with a string of UUIDs and then do some
	// processing in Metabase
	const collectionIds = uniqueCollectionIds.join(',') || undefined;
	const collection = chooseCollectionForPub(pubData, locationData);

	usePageOnce(
		{
			event: 'pub',
			pubSlug: pubData.slug,
			pubId: pubData.id,
			pubTitle: pubData.title,
			collectionIds,
			collectionId: collection?.id,
			collectionTitle: collection?.title,
			collectionSlug: collection?.slug,
			primaryCollectionId: getPrimaryCollection(pubData?.collectionPubs)?.id,
			collectionKind: collection?.kind,
			communityId: pubData.communityId,
			communityName: communityData.title,
			communitySubdomain: communityData.subdomain,
			isProd: locationData.isProd,
			release: pubData.isRelease && pubData.releaseNumber ? pubData.releaseNumber : 'draft',
		},
		gdprConsent,
	);

	if (hidePubBody) {
		return null;
	}

	return (
		<div className="pub-document-component">
			{(!isReadOnly || isViewingHistory) && (
				<PubHeaderFormatting
					disabled={isViewingHistory}
					editorWrapperRef={editorWrapperRef}
				/>
			)}
			<div className="pub-grid">
				<div className="main-content" ref={mainContentRef}>
					<PubMaintenanceNotice pubData={pubData} />
					{!isReviewingPub && (
						<PubHistoricalNotice pubData={pubData} historyData={historyData} />
					)}
					<PubEdgeListing
						className="top-pub-edges"
						pubData={pubData}
						pubEdgeDescriptionIsVisible={pubEdgeDisplay.descriptionIsVisible}
						accentColor={communityData.accentColorDark}
						initialFilters={[PubEdgeFilter.Parent]}
						isolated
					/>
					<PubBody editorWrapperRef={editorWrapperRef} />
					{showPubFileImport && (
						<PubFileImport
							editorChangeObject={collabData.editorChangeObject!}
							updatePubData={updatePubData}
						/>
					)}
					{!isViewingHistory && <PubInlineMenu />}
					{featureFlags.suggestedEdits && !isViewingHistory && (
						<PubInlineSuggestedEdits />
					)}
					<PubEdgeListing
						className="bottom-pub-edges"
						pubData={pubData}
						pubEdgeDescriptionIsVisible={pubEdgeDisplay.descriptionIsVisible}
						accentColor={communityData.accentColorDark}
						initialFilters={[PubEdgeFilter.Child, PubEdgeFilter.Sibling]}
						initialMode={
							pubEdgeDisplay.defaultsToCarousel
								? PubEdgeMode.Carousel
								: PubEdgeMode.List
						}
					/>
				</div>
				<div className="side-content" ref={sideContentRef}>
					{isViewingHistory && !isReviewingPub && (
						<PubHistoryViewer
							historyData={historyData}
							pubData={pubData}
							onClose={() => historyData.setIsViewingHistory(false)}
							onSetCurrentHistoryKey={historyData.setCurrentHistoryKey}
						/>
					)}
				</div>
			</div>
			<PubBottom
				pubData={pubData}
				updateLocalData={updateLocalData}
				sideContentRef={sideContentRef}
				mainContentRef={mainContentRef}
			/>
			<PubLinkController mainContentRef={mainContentRef} />
		</div>
	);
};

export default PubDocument;
