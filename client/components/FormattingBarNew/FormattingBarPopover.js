import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';

import { useFocusTrap } from '../../utils/useFocusTrap';
import { usePendingAttrs } from './usePendingAttrs';
import { setEditorSelectionFromClick } from './positioning';

const FormattingBarPopover = (props) => {
	const {
		accentColor,
		button,
		children,
		onClose,
		isFullScreenWidth,
		floatingPosition,
		containerRef,
		trapFocusOnMount,
		editorChangeObject,
	} = props;
	const [capturesFocus, setCapturesFocus] = useState(trapFocusOnMount);
	const pendingAttrs = usePendingAttrs(editorChangeObject);
	const hasSeenMouseDownOutside = useRef(false);
	const showCloseButton = !floatingPosition;

	const commitChanges = useCallback(() => {
		if (pendingAttrs) {
			pendingAttrs.commitChanges();
		}
	}, [pendingAttrs]);

	const handleClose = useCallback(() => {
		commitChanges();
		onClose();
	}, [commitChanges, onClose]);

	const focusTrap = useFocusTrap({
		isActive: capturesFocus,
		onMouseDownOutside: (evt) => {
			hasSeenMouseDownOutside.current = true;
			evt.stopPropagation();
			evt.preventDefault();
		},
		onEscapeKeyPressed: (evt) => {
			evt.stopPropagation();
			handleClose();
		},
		onClickOutside: (evt) => {
			evt.stopPropagation();
			if (hasSeenMouseDownOutside.current) {
				handleClose();
				setEditorSelectionFromClick(editorChangeObject, evt);
			}
		},
	});

	useEffect(() => {
		const options = { capture: true };
		const handler = (evt) => {
			if (evt.key === 'Tab' && !capturesFocus) {
				evt.preventDefault();
				setCapturesFocus(true);
			}
		};
		document.addEventListener('keydown', handler, options);
		return () => document.removeEventListener('keydown', handler, options);
	}, [capturesFocus]);

	const popover = (
		<div
			aria-label={`Editing ${button.ariaTitle || button.title} options`}
			className={classNames(
				'formatting-bar-popover-component',
				!!floatingPosition && 'floating bp3-elevation-2',
				isFullScreenWidth && 'full-screen-width',
			)}
			style={{ background: accentColor, ...floatingPosition }}
			ref={focusTrap.ref}
		>
			<div className="inner">
				{typeof children === 'function'
					? children({
							pendingAttrs: pendingAttrs,
							onClose: handleClose,
					  })
					: children}
			</div>
			{showCloseButton && (
				<div className="close-button-container">
					<Button
						minimal
						small
						icon="cross"
						aria-label="Close options"
						onClick={handleClose}
					/>
				</div>
			)}
		</div>
	);

	if (floatingPosition && containerRef.current) {
		return ReactDOM.createPortal(popover, containerRef.current);
	}
	return popover;
};

export default FormattingBarPopover;
