/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';
import { useKey } from 'react-use';
import { Dialog, useDialogState } from 'reakit';

import { useFocusTrap } from '../../utils/useFocusTrap';

const FormattingBarPopover = (props) => {
	const {
		accentColor,
		button,
		children,
		onClose,
		isFullScreenWidth,
		floatingPosition,
		containerRef,
	} = props;
	const [hasPendingChanges, setHasPendingChanges] = useState(false);

	const dialog = useDialogState({ visible: true });

	const handleControlsClose = () => {
		setHasPendingChanges(false);
		onClose();
	};

	useKey('Escape', handleControlsClose);

	const popoverNode = (
		<Dialog
			{...dialog}
			aria-label={`Editing ${button.ariaTitle || button.title} options`}
			modal={true}
			hideOnEsc={false}
			hideOnClickOutside={false}
			unstable_autoFocusOnShow={true}
			unstable_portal={false}
			className={classNames(
				'formatting-bar-popover-component',
				!!floatingPosition && 'floating bp3-elevation-2',
				isFullScreenWidth && 'full-screen-width',
			)}
			style={{ background: accentColor, ...floatingPosition }}
		>
			<div className="inner">
				{typeof children === 'function'
					? children({
							onPendingChanges: setHasPendingChanges,
							onClose: handleControlsClose,
					  })
					: children}
			</div>
			<div className="close-button-container">
				<Button minimal small icon="cross" aria-label="Close options" onClick={onClose} />
			</div>
		</Dialog>
	);

	if (floatingPosition && containerRef.current) {
		return ReactDOM.createPortal(popoverNode, containerRef.current);
	}
	return popoverNode;
};

export default FormattingBarPopover;
