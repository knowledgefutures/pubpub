/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React from 'react';
import PropTypes from 'prop-types';

import { MinimalEditor } from 'components';

import { useFocusTrap } from '../../utils/useFocusTrap';

const FormattingBarPopover = (props) => {
	const { accentColor, button, children } = props;
	const focusTrap = useFocusTrap();
	const spokenTitle = button.ariaTitle || button.title;
	return (
		<div
			className="formatting-bar-popover-component"
			ref={focusTrap.ref}
			style={{ background: accentColor }}
		>
			<div tabIndex="0" role="dialog" aria-label={`Editing ${spokenTitle} options`}>
				{children}
			</div>
		</div>
	);
};

export default FormattingBarPopover;
