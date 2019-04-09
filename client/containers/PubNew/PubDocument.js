import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { marksAtSelection } from '@pubpub/editor';
import PubHeaderFormatting from './PubHeaderFormatting';
import PubBody from './PubBody';
import PubInlineMenu from './PubInlineMenu';
import PubLinkMenu from './PubLinkMenu';
import PubDiscussions from './PubDiscussions';
import PubFooter from './PubFooter';
import { pubDataProps } from './sharedPropTypes';

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
	const [clickedMarks, setClickedMarks] = useState([]);
	// const [tempId, setTempId] = useState(uuidv4());
	const editorChangeObject = props.collabData.editorChangeObject;

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

	const editorFocused = editorChangeObject.view && editorChangeObject.view.hasFocus();
	return (
		<React.Fragment>
			<PubHeaderFormatting pubData={props.pubData} collabData={props.collabData} />
			<PubBody
				pubData={props.pubData}
				collabData={props.collabData}
				firebaseBranchRef={props.firebaseBranchRef}
				updateLocalData={props.updateLocalData}
				onSingleClick={(view) => {
					/* Used to trigger link popup when link mark clicked */
					setClickedMarks(marksAtSelection(view));
				}}
			/>
			{props.firebaseBranchRef && (
				<PubDiscussions
					pubData={props.pubData}
					collabData={props.collabData}
					firebaseBranchRef={props.firebaseBranchRef}
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
			<PubFooter pubData={props.pubData} />
		</React.Fragment>
	);
};

PubDocument.propTypes = propTypes;
PubDocument.defaultProps = defaultProps;
export default PubDocument;
