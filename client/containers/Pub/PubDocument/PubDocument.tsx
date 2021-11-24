import React, { useState, useEffect, useRef } from 'react';
import { setLocalHighlight } from 'components/Editor';

import { usePageContext } from 'utils/hooks';
import { PubHistoryViewer } from 'components';
import {
	PubEdgeListing,
	Filter as PubEdgeFilter,
	Mode as PubEdgeMode,
} from 'components/PubEdgeListing';

import PubBody from './PubBody';
import PubBottom from './PubBottom/PubBottom';
import PubFileImport from './PubFileImport';
import PubHeaderFormatting from './PubHeaderFormatting';
import PubHistoricalNotice from './PubHistoricalNotice';
import PubInlineMenu from './PubInlineMenu';
import PubLinkController from './PubLinkController';
import PubMaintenanceNotice from './PubMaintenanceNotice';
import { PubSuspendWhileTyping } from '../PubSuspendWhileTyping';

require('./pubDocument.scss');

type Props = {
	pubData: any;
	collabData: any;
	historyData: any;
	updateLocalData: (...args: any[]) => any;
};

const PubDocument = (props: Props) => {
	const { pubData, historyData, collabData, updateLocalData } = props;
	const { isViewingHistory } = historyData;
	const { editorChangeObject } = collabData;
	const { communityData, locationData, scopeData } = usePageContext();
	const { canEdit, canEditDraft } = scopeData.activePermissions;
	const [areDiscussionsShown, setDiscussionsShown] = useState(true);
	const mainContentRef = useRef(null);
	const sideContentRef = useRef(null);
	const editorWrapperRef = useRef(null);

	const updateHistoryData = (next) => updateLocalData('history', next);

	useEffect(() => {
		const fromNumber = Number(locationData.query.from);
		const toNumber = Number(locationData.query.to);
		const existingPermElement = document.getElementsByClassName('permanent')[0];
		if (editorChangeObject.view && fromNumber && toNumber && !existingPermElement) {
			setTimeout(() => {
				setLocalHighlight(editorChangeObject.view, fromNumber, toNumber, 'permanent');
				setTimeout(() => {
					const newlyCreatedPermElement = document.getElementsByClassName('permanent')[0];
					if (newlyCreatedPermElement) {
						newlyCreatedPermElement.scrollIntoView({ block: 'center' });
					}
				}, 0);
			}, 0);
		}
	}, [editorChangeObject.view, locationData]);

	// We use the useEffect hook to wait until after the render to show or hide discussions, since
	// they mount into portals that we rely on Prosemirror to create.
	useEffect(() => {
		setDiscussionsShown(!isViewingHistory);
	}, [isViewingHistory]);

	// const editorFocused = editorChangeObject.view && editorChangeObject.view.hasFocus();
	return (
		<div className="pub-document-component">
			{!pubData.isReadOnly && (
				<PubHeaderFormatting
					collabData={collabData}
					disabled={isViewingHistory}
					editorWrapperRef={editorWrapperRef}
				/>
			)}
			<div className="pub-grid">
				<div className="main-content" ref={mainContentRef}>
					<PubMaintenanceNotice pubData={pubData} />
					<PubHistoricalNotice pubData={pubData} historyData={historyData} />
					<PubEdgeListing
						className="top-pub-edges"
						pubData={pubData}
						accentColor={communityData.accentColorDark}
						initialFilters={[PubEdgeFilter.Parent]}
						isolated
					/>
					<PubBody editorWrapperRef={editorWrapperRef} />
					{!isViewingHistory && (canEdit || canEditDraft) && !pubData.isReadOnly && (
						<PubFileImport
							editorChangeObject={collabData.editorChangeObject}
							updatePubData={(data) => updateLocalData('pub', data)}
						/>
					)}
					{!isViewingHistory && <PubInlineMenu />}
					<PubEdgeListing
						className="bottom-pub-edges"
						pubData={pubData}
						accentColor={communityData.accentColorDark}
						initialFilters={[PubEdgeFilter.Child, PubEdgeFilter.Sibling]}
						initialMode={
							pubData.pubEdgeListingDefaultsToCarousel
								? PubEdgeMode.Carousel
								: PubEdgeMode.List
						}
					/>
				</div>
				<div className="side-content" ref={sideContentRef}>
					{isViewingHistory && !pubData.isRelease && (
						<PubHistoryViewer
							updateHistoryData={updateHistoryData}
							historyData={historyData}
							pubData={pubData}
							onClose={() => updateLocalData('history', { isViewingHistory: false })}
						/>
					)}
				</div>
			</div>
			<PubSuspendWhileTyping delay={1000}>
				{() => (
					<PubBottom
						pubData={pubData}
						updateLocalData={updateLocalData}
						sideContentRef={sideContentRef}
						mainContentRef={mainContentRef}
						showDiscussions={areDiscussionsShown}
					/>
				)}
			</PubSuspendWhileTyping>
			<PubLinkController locationData={locationData} mainContentRef={mainContentRef} />
		</div>
	);
};

export default PubDocument;
