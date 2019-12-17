/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import { Button } from '@blueprintjs/core';
import { useKey } from 'react-use';
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

	const handleControlsClose = () => {
		setHasPendingChanges(false);
		onClose();
	};

	// const focusTrap = useFocusTrap({
	// 	clickOutsideDeactivates: !hasPendingChanges,
	// });

	useKey('Escape', handleControlsClose);

	const popover = (
		<div
			className={classNames(
				'formatting-bar-popover-component',
				!!floatingPosition && 'floating bp3-elevation-2',
				isFullScreenWidth && 'full-screen-width',
			)}
			style={{ background: accentColor, ...floatingPosition }}
		>
			<div
				tabIndex="0"
				role="dialog"
				className="inner"
				aria-label={`Editing ${button.ariaTitle || button.title} options`}
			>
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
		</div>
	);

	if (floatingPosition && containerRef.current) {
		return ReactDOM.createPortal(popover, containerRef.current);
	}
	return popover;
};

export default FormattingBarPopover;
