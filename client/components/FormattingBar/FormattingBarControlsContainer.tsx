import type { ResolvedControlsConfiguration } from './types';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import { Button, Classes } from '@blueprintjs/core';
import classNames from 'classnames';

import { useFocusTrap } from 'client/utils/useFocusTrap';

import { type EditorChangeObject, mouseEventSelectsNode } from '../Editor';

type Props = {
	accentColor: string;
	children: React.ReactNode;
	editorChangeObject: EditorChangeObject;
	controlsConfiguration: ResolvedControlsConfiguration;
	onClose: () => unknown;
};

const FormattingBarControlsContainer = (props: Props) => {
	const { accentColor, children, editorChangeObject, onClose, controlsConfiguration } = props;

	const {
		isFullScreenWidth,
		kind,
		style,
		container,
		showCloseButton,
		title,
		captureFocusOnMount,
		hasPadding,
	} = controlsConfiguration;
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

	const wrapper = (
		<div
			aria-label={`Editing ${title} options`}
			className={classNames(
				'formatting-bar-controls-container-component',
				kind === 'floating' && `floating ${Classes.ELEVATION_2}`,
				isFullScreenWidth && 'full-screen-width',
				hasPadding && 'has-padding',
			)}
			style={{ background: accentColor, ...style }}
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

	if (kind === 'floating') {
		return ReactDOM.createPortal(wrapper, container);
	}
	return wrapper;
};

export default FormattingBarControlsContainer;
