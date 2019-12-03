import React from 'react';
import PropTypes from 'prop-types';

import { useFocusTrap } from '../../utils/useFocusTrap';

const noOutsideClick = () => false;

const ElementControls = (props) => {
	const handleClickOutside = ({ allowClickOutside }) => {
		allowClickOutside();
	};

	const focusTrap = useFocusTrap({ onClickOutside: handleClickOutside });

	return (
		<div className="element-controls" ref={focusTrap.ref}>
			<button>Hello there,</button>
		</div>
	);
};

export default ElementControls;
