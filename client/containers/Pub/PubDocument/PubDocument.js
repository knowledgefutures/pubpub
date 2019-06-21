import React, { useState, useEffect, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import { marksAtSelection, setLocalHighlight, cursor } from '@pubpub/editor';
import { pubDataProps } from 'types/pub';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import PubBody from './PubBody';
import PubInlineMenu from './PubInlineMenu';
import PubLinkMenu from './PubLinkMenu';
import PubDiscussions from './PubDiscussions';
import PubFooter from './PubFooter';
import PubInlineImport from './PubInlineImport';
import PubDetails from './PubDetails';
import PubHistory from './PubHistory';
import PubHeaderFormatting from './PubHeaderFormatting';

require('./pubDocument.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
	collabData: PropTypes.object.isRequired,
	historyData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	updateLocalData: PropTypes.func.isRequired,
};

const defaultProps = {
	firebaseBranchRef: undefined,
};

const PubDocument = (props) => {
	const { pubData, historyData, collabData, firebaseBranchRef } = props;
	const { isViewingHistory } = historyData;
	const { locationData } = useContext(PageContext);
	const [linkPopupIsOpen, setLinkPopupIsOpen] = useState(false);
	const [areDiscussionsShown, setDiscussionsShown] = useState(true);
	const [clickedMarks, setClickedMarks] = useState([]);
	// const [tempId, setTempId] = useState(uuidv4());
	const editorChangeObject = collabData.editorChangeObject;
	const mainContentRef = useRef(null);
	const sideContentRef = useRef(null);

	/* Calculate whether the link popup should be open */
	const activeLink = editorChangeObject.activeLink || {};
	const selectionIsLink = !!activeLink.attrs;
	const clickedOnLink = clickedMarks.indexOf('link') > -1;
	const nextLinkPopupIsOpen = clickedOnLink || (linkPopupIsOpen && selectionIsLink);
	if (nextLinkPopupIsOpen !== linkPopupIsOpen) {
		setLinkPopupIsOpen(nextLinkPopupIsOpen);
		setClickedMarks([]);
	}

	/* Manage link popup based on certain key events */
	const handleKeyPressEvents = (evt) => {
		if (linkPopupIsOpen && (evt.key === 'Escape' || evt.key === 'Enter')) {
			evt.preventDefault();
			setLinkPopupIsOpen(false);
			cursor.moveToEndOfSelection(editorChangeObject.view);
			editorChangeObject.view.focus();
		}
		if (evt.key === 'k' && evt.metaKey) {
			setLinkPopupIsOpen(true);
		}
	};

	useEffect(() => {
		window.addEventListener('keydown', handleKeyPressEvents);
		return () => {
			window.removeEventListener('keydown', handleKeyPressEvents);
		};
	});

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

	const editorFocused = editorChangeObject.view && editorChangeObject.view.hasFocus();
	return (
		<div className="pub-document-component">
			{!pubData.isStaticDoc && !isViewingHistory && (
				<PubHeaderFormatting pubData={pubData} collabData={collabData} />
			)}
			{isViewingHistory && <PubHistory {...props} />}
			{!isViewingHistory && <PubDetails {...props} />}
			<div className="pub-grid">
				<div className="main-content" ref={mainContentRef}>
					<PubBody
						pubData={pubData}
						collabData={collabData}
						historyData={props.historyData}
						firebaseBranchRef={firebaseBranchRef}
						updateLocalData={props.updateLocalData}
						onSingleClick={(view) => {
							/* Used to trigger link popup when link mark clicked */
							setClickedMarks(marksAtSelection(view));
						}}
					/>
					{!isViewingHistory && pubData.canEditBranch && !pubData.isStaticDoc && (
						<PubInlineImport
							pubData={pubData}
							editorView={collabData.editorChangeObject.view}
						/>
					)}
					{!linkPopupIsOpen && (editorFocused || pubData.isStaticDoc) && (
						<PubInlineMenu
							pubData={pubData}
							collabData={collabData}
							historyData={props.historyData}
							openLinkMenu={() => {
								setLinkPopupIsOpen(true);
							}}
						/>
					)}
					{linkPopupIsOpen && <PubLinkMenu pubData={pubData} collabData={collabData} />}
				</div>
				<div className="side-content" ref={sideContentRef} />
			</div>
			<PubFooter pubData={pubData} />
			{areDiscussionsShown && (
				<PubDiscussions
					pubData={pubData}
					collabData={collabData}
					firebaseBranchRef={firebaseBranchRef}
					updateLocalData={props.updateLocalData}
					sideContentRef={sideContentRef}
					mainContentRef={mainContentRef}
				/>
			)}
		</div>
	);
};

PubDocument.propTypes = propTypes;
PubDocument.defaultProps = defaultProps;
export default PubDocument;
