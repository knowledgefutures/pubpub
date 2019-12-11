/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import { Button } from '@blueprintjs/core';
import { useFocusTrap } from '../../utils/useFocusTrap';

const FormattingBarPopover = (props) => {
	const {
		accentColor,
		button,
		children,
		onClose,
		isFullScreenWidth,
		floatingPosition,
		editorWrapperRef,
	} = props;
	const [hasPendingChanges, setHasPendingChanges] = useState(false);
	const focusTrap = useFocusTrap({ clickOutsideDeactivates: !hasPendingChanges });

	const handleControlsClose = () => {
		setHasPendingChanges(false);
		onClose();
	};

	const popover = (
		<div
			className={classNames(
				'formatting-bar-popover-component',
				!!floatingPosition && 'floating',
				isFullScreenWidth && 'full-screen-width',
			)}
			tabIndex="-1"
			style={{ background: accentColor, ...floatingPosition }}
			ref={focusTrap.ref}
		>
			<div
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

	if (floatingPosition && editorWrapperRef.current) {
		return ReactDOM.createPortal(popover, editorWrapperRef.current);
	}
	return popover;
};

export default FormattingBarPopover;
