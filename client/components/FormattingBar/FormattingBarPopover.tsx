import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';

import { useFocusTrap } from 'client/utils/useFocusTrap';

const FormattingBarPopover = (props) => {
	const {
		accentColor,
		button,
		children,
		onClose,
		isFullScreenWidth,
		floatingPosition,
		containerRef,
		captureFocusOnMount,
		editorChangeObject,
		showCloseButton,
	} = props;
	const [capturesFocus, setCapturesFocus] = useState(captureFocusOnMount);

	const focusTrap = useFocusTrap({
		isActive: capturesFocus,
		ignoreMouseEvents: true,
		restoreFocusTarget: editorChangeObject.view.dom,
		onEscapeKeyPressed: (evt) => {
			evt.stopPropagation();
			onClose();
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
			<div className="inner">{children}</div>
			{showCloseButton && (
				<div className="close-button-container">
					<Button
						minimal
						small
						icon="cross"
						aria-label="Close options"
						onClick={onClose}
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
