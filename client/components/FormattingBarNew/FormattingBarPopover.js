/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React from 'react';
import PropTypes from 'prop-types';

import { useFocusTrap } from '../../utils/useFocusTrap';

const FormattingBarPopover = (props) => {
	const { accentColor, formattingItem } = props;
	const focusTrap = useFocusTrap();
	const spokenTitle = formattingItem.ariaTitle || formattingItem.title;
	return (
		<div
			className="formatting-bar-popover"
			ref={focusTrap.ref}
			style={{ background: accentColor }}
		>
			<div tabIndex="0" role="dialog" aria-label={`Editing ${spokenTitle} options`}>
				Hwæt!
				<button type="button">Click me</button>
			</div>
		</div>
	);
};

export default FormattingBarPopover;
