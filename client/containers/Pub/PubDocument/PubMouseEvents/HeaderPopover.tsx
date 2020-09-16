import React, { useEffect, useRef } from 'react';
import Popper from 'popper.js';
import { ClickToCopyButton } from 'components';

type Props = {
	locationData: any;
	elem: any;
	mainContentRef: any;
	timeouts: any;
	mouseLeave: (...args: any[]) => any;
};

const HeaderPopover = (props: Props) => {
	const { elem, mainContentRef, timeouts, mouseLeave, locationData } = props;
	const popoverRef = useRef();
	useEffect(() => {
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
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
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'addEventListener' does not exist on type... Remove this comment to see the full error message
		popoverElem.addEventListener('mouseenter', headerPopoverMouseEnter);
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'addEventListener' does not exist on type... Remove this comment to see the full error message
		popoverElem.addEventListener('mouseleave', mouseLeave);
		return () => {
			// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
			popoverElem.removeEventListener('mouseenter', headerPopoverMouseEnter);
			// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
			popoverElem.removeEventListener('mouseleave', mouseLeave);
		};
	});

	return (
		// @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'HTMLDi... Remove this comment to see the full error message
		<div ref={popoverRef} style={{ position: 'absolute', top: '-9999px' }}>
			<ClickToCopyButton
				className="click-to-copy"
				copyString={`https://${locationData.hostname}${locationData.path}#${elem.id}`}
				beforeCopyPrompt="Copy link to header"
			/>
		</div>
	);
};
export default HeaderPopover;
