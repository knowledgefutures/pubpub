import React, { useState, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import { RenderedStructuredValue } from 'utils/notesCore';
import { Icon, PubNoteContent } from 'components';

require('./notes.scss');

export type NotePropType = {
	structuredValue?: string;
	unstructuredValue?: string;
	renderedStructuredValue?: RenderedStructuredValue;
	number?: number;
	id?: string;
};

type NotesProps = {
	accentColor: string;
	notes: NotePropType[];
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

type NoteProps = {
	accentColor: string;
	note: NotePropType;
};

const Note = (props: NoteProps) => {
	const { note, accentColor } = props;
	const contentRef = useRef();
	const [returnLinkTarget, setReturnLinkTarget] = useState<HTMLSpanElement | null>(null);
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
			{note.number && <div className="number">{note.number}.</div>}
			<div className="inner">
				<PubNoteContent
					ref={contentRef}
					structured={note.renderedStructuredValue?.html}
					unstructured={note.unstructuredValue}
				/>
				{returnLinkTarget &&
					ReactDOM.createPortal(
						<span
							role="button"
							aria-label="Jump back to source"
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'number | ... Remove this comment to see the full error message
							tabIndex="0"
							style={{ cursor: 'pointer' }}
							// @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type 'notePropType... Remove this comment to see the full error message
							onClick={() => scrollToNode(document.getElementById(note.id))}
						>
							<Icon
								className="jump-back-icon"
								icon="return"
								color={accentColor}
								iconSize={10}
							/>
						</span>,
						returnLinkTarget!,
					)}
			</div>
		</li>
	);
};

const Notes = (props: NotesProps) => {
	const { notes, ...restProps } = props;
	const hasNumbering = notes.some(({ number }) => !!number);
	return (
		<ul className={classNames('notes-component', !hasNumbering && 'no-padding')}>
			{notes.map((fn) => (
				<Note key={fn.id} note={fn} {...restProps} />
			))}
		</ul>
	);
};
export default Notes;
