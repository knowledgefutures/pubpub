import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { marksAtSelection, cursor } from '@pubpub/editor';
import { pubDataProps } from 'types/pub';
import { GridWrapper } from 'components';
import PubHeaderFormatting from './PubHeaderFormatting';
import PubBody from './PubBody';
import PubInlineMenu from './PubInlineMenu';
import PubLinkMenu from './PubLinkMenu';
import PubDiscussions from './PubDiscussions';
import PubFooter from './PubFooter';
import PubInlineImport from './PubInlineImport';
import PubToc from './PubToc';
import PubSideCollaborators from './PubSideCollaborators';

require('./pubDocument.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	updateLocalData: PropTypes.func.isRequired,
};

const defaultProps = {
	firebaseBranchRef: undefined,
};

const PubDocument = (props) => {
	const [linkPopupIsOpen, setLinkPopupIsOpen] = useState(false);
	const [areDiscussionsShown, setDiscussionsShown] = useState(true);
	const [clickedMarks, setClickedMarks] = useState([]);
	// const [tempId, setTempId] = useState(uuidv4());
	const editorChangeObject = props.collabData.editorChangeObject;
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

	// We use the useEffect hook to wait until after the render to show or hide discussions, since
	// they mount into portals that we rely on Prosemirror to create.
	useEffect(() => {
		setDiscussionsShown(props.pubData.metaMode !== 'history');
	}, [props.pubData.metaMode]);

	const editorFocused = editorChangeObject.view && editorChangeObject.view.hasFocus();
	return (
		<div className="pub-document-component">
			{props.pubData.metaMode !== 'history' && (
				<PubHeaderFormatting pubData={props.pubData} collabData={props.collabData} />
			)}
			<GridWrapper containerClassName="pub" columnClassName="pub-columns">
				<div className="main-content" ref={mainContentRef}>
					<PubBody
						pubData={props.pubData}
						collabData={props.collabData}
						historyData={props.historyData}
						firebaseBranchRef={props.firebaseBranchRef}
						updateLocalData={props.updateLocalData}
						onSingleClick={(view) => {
							/* Used to trigger link popup when link mark clicked */
							setClickedMarks(marksAtSelection(view));
						}}
					/>
					{props.pubData.metaMode !== 'history' && (
						<PubInlineImport
							pubData={props.pubData}
							editorView={props.collabData.editorChangeObject.view}
						/>
					)}
					<PubFooter pubData={props.pubData} />

					{areDiscussionsShown && (
						<PubDiscussions
							pubData={props.pubData}
							collabData={props.collabData}
							firebaseBranchRef={props.firebaseBranchRef}
							updateLocalData={props.updateLocalData}
							mainContentRef={mainContentRef}
							sideContentRef={sideContentRef}
						/>
					)}

					{!linkPopupIsOpen && editorFocused && (
						<PubInlineMenu
							pubData={props.pubData}
							collabData={props.collabData}
							openLinkMenu={() => {
								setLinkPopupIsOpen(true);
							}}
						/>
					)}
					{linkPopupIsOpen && (
						<PubLinkMenu pubData={props.pubData} collabData={props.collabData} />
					)}
				</div>
				<div className="side-content" ref={sideContentRef}>
					<PubToc
						pubData={props.pubData}
						editorChangeObject={props.collabData.editorChangeObject}
					/>
					<PubSideCollaborators pubData={props.pubData} />
				</div>
			</GridWrapper>
		</div>
	);
};

PubDocument.propTypes = propTypes;
PubDocument.defaultProps = defaultProps;
export default PubDocument;
