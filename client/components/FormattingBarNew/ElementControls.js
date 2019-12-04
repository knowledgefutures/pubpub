import React from 'react';
import PropTypes from 'prop-types';

import { usePageContext } from 'containers/Pub/pubHooks';
import { useFocusTrap } from '../../utils/useFocusTrap';

const noOutsideClick = () => false;

const ElementControls = (props) => {
	const {
		communityData: { accentColorDark },
	} = usePageContext();

	const handleClickOutside = () => {
		console.log('click outside!');
	};

	const focusTrap = useFocusTrap({ onClickOutside: handleClickOutside });

	return (
		<div
			className="element-controls"
			style={{ background: accentColorDark }}
			ref={focusTrap.ref}
		>
			<button>Hello there,</button>
		</div>
	);
};

export default ElementControls;
