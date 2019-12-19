import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';
import { useKey } from 'react-use';

import { useFocusTrap } from '../../utils/useFocusTrap';

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
		focusOnMount,
	} = props;

	const [hasPendingChanges, setHasPendingChanges] = useState(false);
	const [capturesFocus, setCapturesFocus] = useState(!floatingPosition || focusOnMount);

	const handleClickOutside = () => {
		if (!hasPendingChanges) {
			onClose();
		}
	};

	const handleControlsClose = () => {
		setHasPendingChanges(false);
		onClose();
	};

	const focusTrap = useFocusTrap({ isActive: capturesFocus, onClickOutside: handleClickOutside });

	useKey('Escape', handleControlsClose);

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
							onPendingChanges: setHasPendingChanges,
							onClose: handleControlsClose,
					  })
					: children}
			</div>
			{!floatingPosition && (
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
