import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Popper from 'popper.js';
import { ClickToCopyButton } from 'components';

const propTypes = {
	locationData: PropTypes.object.isRequired,
	elem: PropTypes.object.isRequired,
	mainContentRef: PropTypes.object.isRequired,
	timeouts: PropTypes.object.isRequired,
	mouseLeave: PropTypes.func.isRequired,
};

const HeaderPopover = (props) => {
	const { elem, mainContentRef, timeouts, mouseLeave, locationData } = props;
	const popoverRef = useRef();
	useEffect(() => {
		const popperObject = new Popper(elem, popoverRef.current, {
			placement: 'left',
		});
		return () => {
			popperObject.destroy();
		};
	}, [elem, mainContentRef]);

	const headerPopoverMouseEnter = () => {
		clearTimeout(timeouts.current.header);
	};

	useEffect(() => {
		const popoverElem = popoverRef.current;
		if (!popoverElem) {
			return () => {};
		}
		popoverElem.addEventListener('mouseenter', headerPopoverMouseEnter);
		popoverElem.addEventListener('mouseleave', mouseLeave);
		return () => {
			popoverElem.removeEventListener('mouseenter', headerPopoverMouseEnter);
			popoverElem.removeEventListener('mouseleave', mouseLeave);
		};
	});

	return (
		<div ref={popoverRef} style={{ position: 'absolute', top: '-9999px' }}>
			<ClickToCopyButton
				className="click-to-copy"
				copyString={`https://${locationData.hostname}${locationData.path}#${elem.id}`}
				beforeCopyPrompt="Copy link to header"
			/>
		</div>
	);
};
HeaderPopover.propTypes = propTypes;
export default HeaderPopover;
