import React, { useState, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import { Icon, PubNoteContent } from 'components';

require('./notes.scss');

export const notePropType = PropTypes.shape({
	html: PropTypes.string,
	unstructuredValue: PropTypes.string,
	count: PropTypes.number,
});

const propTypes = {
	accentColor: PropTypes.string.isRequired,
	notes: PropTypes.arrayOf(notePropType).isRequired,
	targetNoteElement: PropTypes.func.isRequired,
};

const scrollToNode = (node) => {
	if (node) {
		node.scrollIntoView();
		const currentTop = document.body.scrollTop || document.documentElement.scrollTop;
		document.body.scrollTop = currentTop - 75;
		document.documentElement.scrollTop = currentTop - 75;
	}
};

const findLastElementChild = (node) => {
	let child = node;
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const { lastElementChild, lastChild } = child;
		if (lastElementChild && lastElementChild === lastChild) {
			child = lastElementChild;
		} else {
			break;
		}
	}
	return child;
};

const Note = (props) => {
	const { note, accentColor, targetNoteElement } = props;
	const contentRef = useRef();
	const [returnLinkTarget, setReturnLinkTarget] = useState(null);

	useLayoutEffect(() => {
		const contentNode = contentRef.current;
		if (contentNode) {
			const lastChild = findLastElementChild(contentNode);
			if (lastChild) {
				const newReturnLinkTarget = document.createElement('span');
				lastChild.appendChild(newReturnLinkTarget);
				setReturnLinkTarget(newReturnLinkTarget);
			}
		}
	}, [note.unstructuredValue]);

	return (
		<li className="note">
			<div className="number">{note.number}.</div>
			<div className="inner">
				<PubNoteContent
					ref={contentRef}
					structured={note.html}
					unstructured={note.unstructuredValue}
				/>
				{returnLinkTarget &&
					ReactDOM.createPortal(
						<span
							role="button"
							aria-label="Jump back to source"
							tabIndex="0"
							style={{ cursor: 'pointer' }}
							onClick={() => scrollToNode(targetNoteElement(note))}
						>
							<Icon
								className="jump-back-icon"
								icon="return"
								color={accentColor}
								iconSize={10}
							/>
						</span>,
						returnLinkTarget,
					)}
			</div>
		</li>
	);
};

Note.propTypes = {
	accentColor: PropTypes.string.isRequired,
	note: notePropType.isRequired,
	targetNoteElement: PropTypes.func.isRequired,
};

const Notes = (props) => {
	const { notes, ...restProps } = props;
	return (
		<ul className="notes-component">
			{notes.map((fn) => (
				<Note key={fn.number} note={fn} {...restProps} />
			))}
		</ul>
	);
};

Notes.propTypes = propTypes;
export default Notes;
