import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';

import { useFocusTrap } from 'client/utils/useFocusTrap';
import { Falsy } from 'utils/types';
import { EditorChangeObject, mouseEventSelectsNode } from '../Editor';

import { PositioningFn } from './types';

type Props = {
	accentColor: string;
	title: string;
	captureFocusOnMount?: boolean;
	children: React.ReactNode;
	containerRef?: React.RefObject<HTMLElement>;
	editorChangeObject: EditorChangeObject;
	floatingPosition: Falsy | ReturnType<PositioningFn>;
	isFullScreenWidth?: boolean;
	onClose: () => unknown;
	showCloseButton?: boolean;
};

const FormattingBarPopover = (props: Props) => {
	const {
		accentColor,
		title,
		captureFocusOnMount,
		children,
		containerRef,
		editorChangeObject,
		floatingPosition,
		isFullScreenWidth,
		onClose,
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
		onMouseDownOutside: (evt: MouseEvent) => {
			if (!mouseEventSelectsNode(editorChangeObject.view, evt)) {
				onClose();
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
			aria-label={`Editing ${title} options`}
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

	if (floatingPosition) {
		const containerElement = containerRef?.current || document.body;
		return ReactDOM.createPortal(popover, containerElement);
	}
	return popover;
};

export default FormattingBarPopover;
