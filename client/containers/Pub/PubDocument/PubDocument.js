import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { setLocalHighlight } from '@pubpub/editor';
import { usePageContext } from 'utils/hooks';
import PubBody from './PubBody';
import PubInlineMenu from './PubInlineMenu';
import PubFileImport from './PubFileImport';
import PubHistory from './PubHistory';
import PubHeaderFormatting from './PubHeaderFormatting';
import PubBottom from './PubBottom/PubBottom';
import PubMouseEvents from './PubMouseEvents';
import PubHistoricalNotice from './PubHistory/PubHistoricalNotice';

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
	const { locationData, scopeData } = usePageContext();
	const { canEdit, canEditDraft } = scopeData.activePermissions;
	const [areDiscussionsShown, setDiscussionsShown] = useState(true);
	// const [tempId, setTempId] = useState(uuidv4());
	const editorChangeObject = collabData.editorChangeObject;
	const mainContentRef = useRef(null);
	const sideContentRef = useRef(null);
	const editorWrapperRef = useRef(null);

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
			{!pubData.isReadOnly && !isViewingHistory && (
				<PubHeaderFormatting
					pubData={pubData}
					collabData={collabData}
					editorWrapperRef={editorWrapperRef}
				/>
			)}
			{isViewingHistory && <PubHistory {...props} />}
			<div className="pub-grid">
				<div className="main-content" ref={mainContentRef}>
					{pubData.isHistoricalDoc && pubData.isRelease && (
						<PubHistoricalNotice pubData={pubData} />
					)}
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
							updateLocalData={updateLocalData}
						/>
					)}
					{!pubData.isHistoricalDoc && (
						<PubInlineMenu
							pubData={pubData}
							collabData={collabData}
							historyData={historyData}
						/>
					)}
				</div>
				<div className="side-content" ref={sideContentRef} />
			</div>
			<PubBottom
				pubData={pubData}
				collabData={collabData}
				historyData={historyData}
				firebaseBranchRef={firebaseBranchRef}
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
