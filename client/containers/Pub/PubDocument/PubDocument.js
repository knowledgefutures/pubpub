import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { setLocalHighlight } from 'components/Editor';

import { usePageContext } from 'utils/hooks';
import { PubHistoryViewer } from 'components';
import { PubEdgeListing, Filter as PubEdgeFilter } from 'components/PubEdgeListing';

import PubBody from './PubBody';
import PubBottom from './PubBottom/PubBottom';
import PubFileImport from './PubFileImport';
import PubHeaderFormatting from './PubHeaderFormatting';
import PubHistoricalNotice from './PubHistoricalNotice';
import PubInlineMenu from './PubInlineMenu';
import PubMouseEvents from './PubMouseEvents';
import PubMaintenanceNotice from './PubMaintenanceNotice';

require('./pubDocument.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	historyData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	updateLocalData: PropTypes.func.isRequired,
};

const defaultProps = {
	firebaseBranchRef: undefined,
};

const PubDocument = (props) => {
	const { pubData, historyData, collabData, firebaseBranchRef, updateLocalData } = props;
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
		/* TODO: Clean up the hanlding of permalink generation and scrolling */
		const fromNumber = Number(locationData.query.from);
		const toNumber = Number(locationData.query.to);
		const permElement = document.getElementsByClassName('permanent')[0];
		if (
			editorChangeObject.view &&
			firebaseBranchRef &&
			fromNumber &&
			toNumber &&
			!permElement
		) {
			setTimeout(() => {
				setLocalHighlight(editorChangeObject.view, fromNumber, toNumber, 'permanent');
				setTimeout(() => {
					document.getElementsByClassName('permanent')[0].scrollIntoView(false);
				}, 0);
			}, 0);
		}
	}, [editorChangeObject.view, firebaseBranchRef, locationData]);

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
					pubData={pubData}
					collabData={collabData}
					editorWrapperRef={editorWrapperRef}
					disabled={isViewingHistory}
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
					<PubBody
						editorWrapperRef={editorWrapperRef}
						pubData={pubData}
						collabData={collabData}
						historyData={historyData}
						firebaseBranchRef={firebaseBranchRef}
						updateLocalData={updateLocalData}
					/>
					{!isViewingHistory && (canEdit || canEditDraft) && !pubData.isReadOnly && (
						<PubFileImport
							editorChangeObject={collabData.editorChangeObject}
							updatePubData={(data) => updateLocalData('pub', data)}
						/>
					)}
					{!isViewingHistory && (
						<PubInlineMenu
							pubData={pubData}
							collabData={collabData}
							historyData={historyData}
						/>
					)}
					<PubEdgeListing
						className="bottom-pub-edges"
						pubData={pubData}
						accentColor={communityData.accentColorDark}
						initialFilters={[PubEdgeFilter.Child, PubEdgeFilter.Sibling]}
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
			<PubBottom
				pubData={pubData}
				collabData={collabData}
				updateLocalData={updateLocalData}
				sideContentRef={sideContentRef}
				mainContentRef={mainContentRef}
				showDiscussions={areDiscussionsShown}
			/>
			<PubMouseEvents
				pubData={pubData}
				collabData={collabData}
				locationData={locationData}
				historyData={historyData}
				mainContentRef={mainContentRef}
			/>
		</div>
	);
};

PubDocument.propTypes = propTypes;
PubDocument.defaultProps = defaultProps;
export default PubDocument;
