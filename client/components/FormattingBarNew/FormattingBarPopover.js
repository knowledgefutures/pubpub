import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';
import { useKey } from 'react-use';

import { useFocusTrap } from '../../utils/useFocusTrap';
import { usePendingAttrs } from './usePendingAttrs';

const renderPreventPointerEventsStyles = () => {
	return <style>{` .pub-body-component > .editor { pointer-events: none }`}</style>;
};

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

	const { selectedNode, updateNode } = editorChangeObject;
	const [capturesFocus, setCapturesFocus] = useState(trapFocusOnMount);
	const pendingAttrs = usePendingAttrs(selectedNode.attrs, updateNode);
	const { commitChanges } = pendingAttrs;
	const showCloseButton = !floatingPosition;

	const handleClose = useCallback(() => {
		console.log('committing changes');
		commitChanges();
		onClose();
	}, [commitChanges, onClose]);

	const focusTrap = useFocusTrap({ isActive: capturesFocus, onAttemptClose: handleClose });

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
			{capturesFocus && renderPreventPointerEventsStyles()}
			<div className="inner">
				{typeof children === 'function'
					? children({
							pendingAttrs: pendingAttrs,
							onClose: onClose,
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
