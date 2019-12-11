/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { MinimalEditor } from 'components';

import { Button } from '@blueprintjs/core';
import { useFocusTrap } from '../../../utils/useFocusTrap';

const FormattingBarPopover = (props) => {
	const { accentColor, button, children, onClose, isFullScreenWidth } = props;
	const focusTrap = useFocusTrap({ onClickOutside: (evt) => console.log('oof!', evt.target) });
	const spokenTitle = button.ariaTitle || button.title;
	return (
		<div
			className={classNames(
				'formatting-bar-popover-component',
				isFullScreenWidth && 'full-screen-width',
			)}
			style={{ background: accentColor }}
		>
			<div
				tabIndex="0"
				role="dialog"
				className="inner"
				aria-label={`Editing ${spokenTitle} options`}
			>
				{children}
			</div>
			<div className="close-button-container">
				<Button minimal small icon="cross" aria-label="Close options" onClick={onClose} />
			</div>
		</div>
	);
};

export default FormattingBarPopover;
