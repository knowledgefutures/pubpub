import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import { Icon, PubNoteContent } from 'components';

import { usePubContext } from '../../pubHooks';

require('./notes.scss');

export const notePropType = PropTypes.shape({
	structuredValue: PropTypes.string,
	unstructuredValue: PropTypes.string,
	count: PropTypes.number,
});

const propTypes = {
	accentColor: PropTypes.string.isRequired,
	notes: PropTypes.arrayOf(notePropType).isRequired,
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
	const { note, accentColor } = props;
	const contentRef = useRef();
	const [returnLinkTarget, setReturnLinkTarget] = useState(null);
	const { citationManager } = usePubContext();
	const [citation, setCitation] = useState(citationManager.getSync(note.structuredValue));

	useEffect(() => citationManager.subscribe(note.structuredValue, setCitation), [
		citationManager,
		note.structuredValue,
	]);

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
					structured={citation && citation.html}
					unstructured={note.unstructuredValue}
				/>
				{returnLinkTarget &&
					ReactDOM.createPortal(
						<a aria-label="Jump back to source" href={`#${note.id}`}>
							<Icon
								className="jump-back-icon"
								icon="return"
								color={accentColor}
								iconSize={10}
							/>
						</a>,
						returnLinkTarget,
					)}
			</div>
		</li>
	);
};

Note.propTypes = {
	accentColor: PropTypes.string.isRequired,
	note: notePropType.isRequired,
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
