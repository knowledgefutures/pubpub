import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Popper from 'popper.js';
import { Card } from '@blueprintjs/core';

require('./notePopover.scss');

const propTypes = {
	elem: PropTypes.object.isRequired,
	mainContentRef: PropTypes.object.isRequired,
	timeouts: PropTypes.object.isRequired,
	mouseLeave: PropTypes.func.isRequired,
	content: PropTypes.node,
};
const defaultProps = {
	content: undefined,
};

const NotePopover = (props) => {
	const { elem, mainContentRef, content, timeouts, mouseLeave } = props;
	const popoverRef = useRef();
	useEffect(() => {
		const popperObject = new Popper(elem, popoverRef.current, {
			placement: 'top-start',
			modifiers: {
				flip: {
					behavior: 'flip',
				},
				preventOverflow: {
					boundariesElement: mainContentRef.current,
				},
			},
		});
		return () => {
			popperObject.destroy();
		};
	}, [elem, mainContentRef, popoverRef]);

	const notePopoverMouseEnter = () => {
		clearTimeout(timeouts.current.note);
	};

	useEffect(() => {
		const popoverElem = popoverRef.current;
		if (!popoverElem) {
			return () => {};
		}
		popoverElem.addEventListener('mouseenter', notePopoverMouseEnter);
		popoverElem.addEventListener('mouseleave', mouseLeave);
		return () => {
			popoverElem.removeEventListener('mouseenter', notePopoverMouseEnter);
			popoverElem.removeEventListener('mouseleave', mouseLeave);
		};
	});

	return (
		<div
			className="note-popover-component"
			ref={popoverRef}
			style={{ position: 'absolute', top: '-9999px' }}
		>
			<Card elevation={2}>{content}</Card>
		</div>
	);
};
NotePopover.propTypes = propTypes;
NotePopover.defaultProps = defaultProps;
export default NotePopover;
